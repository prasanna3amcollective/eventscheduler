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

    const dbEvents: any[] = await withAuth(
      () => prisma.event.findMany(),
      securityContext
    );

    const expandedEvents: any[] = [];

    for (const event of dbEvents) {
      if (event.isRecurring && event.recurrenceRule) {
        try {
          const rule = rrulestr(event.recurrenceRule);
          const occurrences = rule.between(rangeStart, rangeEnd, true);
          for (const date of occurrences) {
            expandedEvents.push({
              ...event,
              id: `${event.id}_inst_${date.getTime()}`,
              originalId: event.id,
              startDateTime: date,
              endDateTime: addMinutes(date, event.duration)
            });
          }
        } catch (e) {
          console.error("Error parsing rrule for event", event.id, e);
        }
      } else {
        if (event.endDateTime >= rangeStart && event.startDateTime <= rangeEnd) {
          expandedEvents.push(event);
        }
      }
    }

    return NextResponse.json(expandedEvents);
  } catch (error: any) {
    console.error("Error fetching events:", error);
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

    const event = await withAuth(async () => {
      const evt = await prisma.event.create({
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
            data: staffUsers.map((user: any) => ({
              eventId: evt.id,
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

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
