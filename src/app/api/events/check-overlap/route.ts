import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rrulestr } from 'rrule';
import { addMinutes } from 'date-fns';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDateTime, endDateTime, isRecurring, recurrenceRule, duration } = body;

    const newStart = new Date(startDateTime);
    const newEnd = new Date(endDateTime);

    const dbEvents = await prisma.event.findMany();
    const overlaps = [];

    let newInstances: { start: Date, end: Date }[] = [];
    if (isRecurring && recurrenceRule) {
      try {
        const rule = rrulestr(recurrenceRule);
        const until = new Date(newStart);
        until.setFullYear(until.getFullYear() + 1);
        newInstances = rule.between(newStart, until, true).map(d => ({
          start: d,
          end: addMinutes(d, duration)
        }));
      } catch (e) {
        console.error("Error parsing new rrule", e);
      }
    } else {
      newInstances = [{ start: newStart, end: newEnd }];
    }

    for (const event of dbEvents) {
      if (overlaps.length >= 5) break;

      let eventInstances: { start: Date, end: Date }[] = [];
      if (event.isRecurring && event.recurrenceRule) {
        try {
          const rule = rrulestr(event.recurrenceRule);
          // Only check instances around the new event's time range
          const checkStart = new Date(newStart);
          checkStart.setMonth(checkStart.getMonth() - 1);
          const checkEnd = new Date(newStart);
          checkEnd.setFullYear(checkEnd.getFullYear() + 1);
          
          eventInstances = rule.between(checkStart, checkEnd, true).map(d => ({
            start: d,
            end: addMinutes(d, event.duration)
          }));
        } catch (e) {}
      } else {
        eventInstances = [{ start: event.startDateTime, end: event.endDateTime }];
      }

      let hasOverlap = false;
      for (const ni of newInstances) {
        if (hasOverlap) break;
        for (const ei of eventInstances) {
          if (ni.start < ei.end && ni.end > ei.start) {
            overlaps.push(event);
            hasOverlap = true;
            break;
          }
        }
      }
    }

    if (overlaps.length > 0) {
      return NextResponse.json({ overlap: true, events: overlaps.slice(0, 5) });
    }

    return NextResponse.json({ overlap: false, events: [] });
  } catch (error) {
    console.error("Error checking overlap:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
