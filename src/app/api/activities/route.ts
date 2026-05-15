import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { rrulestr } from 'rrule';
import { addMinutes, startOfDay as startOfDayFn } from 'date-fns';
import { activitySchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start') || startOfDayFn(new Date()).toISOString();
  const endParam = searchParams.get('end') || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const rangeStart = new Date(startParam);
  const rangeEnd = new Date(endParam);

  try {
    const securityContext = await getSessionContext();

    const dbActivities: any[] = await withAuth(
      () => prisma.activity.findMany({
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      }),
      securityContext
    );

    const expandedActivities: any[] = [];

    for (const activity of dbActivities) {
      // Extract staff members from participants based on their type
      const leaderRecord = activity.participants.find((p: any) => p.type === 'Leader');
      const guideRecord = activity.participants.find((p: any) => p.type === 'Guide');
      const observerRecord = activity.participants.find((p: any) => p.type === 'Observer');

      const leader = leaderRecord?.user?.name || null;
      const guide = guideRecord?.user?.name || null;
      const observer = observerRecord?.user?.name || null;

      const staffNames = [leader, guide, observer].filter(Boolean);
      const participantUserNames = new Set<string>();

      for (const p of activity.participants) {
        if (p.user) {
          participantUserNames.add(p.user.name);
        }
      }

      // Add staff names to participant names set (just for count calculation)
      for (const name of staffNames) {
        if (name) participantUserNames.add(name);
      }

      // Calculate total unique participants
      const totalCount = participantUserNames.size;

      if (activity.isRecurring && activity.recurrenceRule) {
        try {
          const rule = rrulestr(activity.recurrenceRule);
          const occurrences = rule.between(rangeStart, rangeEnd, true);
          for (const date of occurrences) {
            expandedActivities.push({
              ...activity,
              id: `${activity.id}_inst_${date.getTime()}`,
              originalId: activity.id,
              startDateTime: date,
              endDateTime: addMinutes(date, activity.duration),
              participantCount: totalCount,
              leader,
              guide,
              observer
            });
          }
        } catch (e) {
          console.error("Error parsing rrule for event", activity.id, e);
        }
      } else {
        if (activity.endDateTime >= rangeStart && activity.startDateTime <= rangeEnd) {
          expandedActivities.push({
            ...activity,
            participantCount: totalCount,
            leader,
            guide,
            observer
          });
        }
      }
    }

    return NextResponse.json(expandedActivities);
  } catch (error: any) {
    console.error("Error fetching activities:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedData = activitySchema.parse(body);
    const { name, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, category } = parsedData;

    const securityContext = await getSessionContext();

    const activity = await withAuth(async () => {
      const evt = await prisma.activity.create({
        data: {
          name,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          category: category || 'General',
        }
      });

       // Auto-populate participants with roles
       try {
         const staff = [
           { name: leader, type: 'Leader' },
           { name: guide, type: 'Guide' },
           { name: observer, type: 'Observer' }
         ].filter(s => s.name);

         for (const s of staff) {
           const user = await prisma.user.findFirst({
             where: { name: s.name }
           });
           if (user) {
             await prisma.participant.create({
               data: {
                 activityId: evt.id,
                 userId: user.id,
                 type: s.type
               }
             });
           }
         }
       } catch (e) {
         console.error("Error auto-populating participants", e);
       }

      return evt;
    }, securityContext);

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Error creating activity:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
