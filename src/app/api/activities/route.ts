import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { rrulestr } from 'rrule';
import { addMinutes } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start') || new Date().toISOString();
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
      // Build a set of participant user IDs (from Participant records)
      const participantUserIds = new Set<string>();
      const participantUserNames = new Set<string>();

      for (const p of activity.participants) {
        participantUserIds.add(p.userId);
        if (p.user) {
          participantUserNames.add(p.user.name);
        }
      }

      // Add leader, guide, observer as participants (if they exist)
      const staffNames = [activity.leader, activity.guide, activity.observer].filter(Boolean);
      for (const name of staffNames) {
        participantUserNames.add(name);
      }

      // Calculate total unique participants
      // Count = registered participants + staff members not already in participants
      let totalCount = participantUserIds.size;
      for (const name of staffNames) {
        // If this staff member is not already counted via participants
        const isStaffInParticipants = activity.participants.some((p: any) => p.user && p.user.name === name);
        if (!isStaffInParticipants) {
          totalCount++;
        }
      }

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
              participantCount: totalCount
            });
          }
        } catch (e) {
          console.error("Error parsing rrule for event", activity.id, e);
        }
      } else {
        if (activity.endDateTime >= rangeStart && activity.startDateTime <= rangeEnd) {
          expandedActivities.push({
            ...activity,
            participantCount: totalCount
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
    const { name, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule } = body;

    const securityContext = await getSessionContext();

    const activity = await withAuth(async () => {
      const evt = await prisma.activity.create({
        data: {
          name,
          leader,
          guide,
          observer,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
        }
      });

       // Auto-populate participants
       try {
         const staffNames = [leader, guide, observer].filter(Boolean);
         const staffUsers = await prisma.user.findMany({
           where: { name: { in: staffNames } }
         });
         if (staffUsers.length > 0) {
           await prisma.participant.createMany({
             data: staffUsers.map((user: { id: string }) => ({
               activityId: evt.id,
               userId: user.id
             })),
             skipDuplicates: true
           });
         }
       } catch (e) {
         console.error("Error auto-populating participants", e);
       }

      return evt;
    }, securityContext);

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Error creating activity:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
