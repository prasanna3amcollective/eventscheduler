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

    const dbActivities: any[] = await (withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'findMany',
      args: {
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      }
    })) as any);

    const expandedActivities: any[] = [];

    for (const activity of dbActivities) {
      // Extract staff members from participants based on their type
      const leaders = activity.participants.filter((p: any) => p.type === 'Leader').map((p: any) => p.user?.name).filter(Boolean);
      const guides = activity.participants.filter((p: any) => p.type === 'Guide').map((p: any) => p.user?.name).filter(Boolean);
      const observers = activity.participants.filter((p: any) => p.type === 'Observer').map((p: any) => p.user?.name).filter(Boolean);

      const staffNames = [...leaders, ...guides, ...observers];
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
              leaders,
              guides,
              observers
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
            leaders,
            guides,
            observers
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
    console.log("POST /api/activities body:", JSON.stringify(body, null, 2));
    const parsedData = activitySchema.parse(body);
    console.log("POST /api/activities parsedData:", JSON.stringify(parsedData, null, 2));
    const { name, leader, guide, observer, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, category } = parsedData;

    const securityContext = await getSessionContext();

    const activity = await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'create',
      args: {
        data: {
          name,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          category: category || 'General',
        }
      }
    }));

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Error creating activity FULL ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message, details: error.issues }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
  }
}
