import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { z } from 'zod';
import { materializeTemplateWindow } from '@/lib/recurrence/generator';
import { randomUUID } from 'crypto';

const responsibilitySchema = z.object({
  name: z.string().min(1, 'Responsibility name is required').max(200),
  startDateTime: z.string().datetime({ message: "Invalid start date format" }),
  endDateTime: z.string().datetime({ message: "Invalid end date format" }),
  duration: z.number().positive(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().nullable().optional(),
  recurrenceStart: z.string().datetime().optional().nullable(),
  recurrenceUntil: z.string().datetime().optional().nullable(),
  recurrenceWeeks: z.number().int().positive().optional().nullable(),
  recurrenceTemplateId: z.string().uuid().nullable().optional(),
  generatedFromTemplateId: z.string().uuid().nullable().optional(),
  detachReason: z.enum(['none', 'edited', 'cancelled', 'rescheduled', 'manually_created']).optional(),
  category: z.string().default('General'),
  state: z.enum(['Scheduled', 'Completed']).default('Scheduled').optional(),
  owner: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedData = responsibilitySchema.parse(body);
    const { name, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, recurrenceStart, recurrenceUntil, recurrenceWeeks, category, owner, ownerId, recurrenceTemplateId, generatedFromTemplateId, detachReason } = parsedData;

    const securityContext = await getSessionContext();

    // PHASE 6: new recurring responsibilities via template + materialize (no legacy master)
    if (isRecurring && recurrenceRule && !recurrenceTemplateId) {
      const tpl = await prisma.recurrenceTemplate.create({
        data: {
          templateType: 'responsibility',
          name,
          duration: Number(duration),
          category: category || 'General',
          recurrenceRule,
          // startDate / endDate on the template now come from the dedicated Recurrence Start/Until fields when supplied (they also drive DTSTART/UNTIL inside recurrenceRule)
          startDate: recurrenceStart ? new Date(recurrenceStart) : new Date(startDateTime),
          endDate: recurrenceUntil ? new Date(recurrenceUntil) : null,
          versionSeriesId: randomUUID(),
          version: 1,
          status: 'active',
        },
        ...(securityContext ? { _context: securityContext } : {}),
      });

      const horizon = recurrenceWeeks ? recurrenceWeeks * 7 + 14 : 365;

      await materializeTemplateWindow(prisma, tpl.id, {
        asOf: recurrenceStart ? new Date(recurrenceStart) : new Date(startDateTime),
        horizonDays: horizon,
        context: securityContext,
      });

      // Backfill owner onto the materialized children (the generator does not set owner/ownerId)
      if (ownerId || owner) {
        await prisma.responsibility.updateMany({
          where: { recurrenceTemplateId: tpl.id },
          data: {
            owner: owner || null,
            ownerId: ownerId || null,
          },
          ...(securityContext ? { _context: securityContext } : {}),
        });
      }

      // Return a real child id when possible (so client treats it like a normal row)
      const firstChild = await prisma.responsibility.findFirst({
        where: { recurrenceTemplateId: tpl.id },
        orderBy: { startDateTime: 'asc' },
        select: { id: true },
      });

      return NextResponse.json({
        id: firstChild?.id ?? tpl.id,
        name,
        startDateTime,
        endDateTime: endDateTime,
        duration: Number(duration),
        isRecurring: true,
        recurrenceRule: null,
        recurrenceTemplateId: tpl.id,
        generatedFromTemplateId: tpl.id,
        detachReason: 'none',
        category: category || 'General',
        owner: owner || null,
        ownerId: ownerId || null,
      }, { status: 201 });
    }

    const responsibility = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'create',
      args: {
        data: {
          name,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          duration: Number(duration),
          isRecurring: Boolean(isRecurring),
          recurrenceRule: isRecurring ? recurrenceRule : null,
          recurrenceTemplateId: recurrenceTemplateId || null,
          generatedFromTemplateId: generatedFromTemplateId || null,
          detachReason: detachReason || 'none',
          category: category || 'General',
          owner: owner || null,
          ownerId: ownerId || null,
        }
      }
    }));

    return NextResponse.json(responsibility, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating responsibility:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  try {
    const securityContext = await getSessionContext();
    console.log(`[RESP GET] securityContext id=${securityContext?.id} roles=[${securityContext?.roles?.join(',') || 'none'}]`);

    // PHASE 6: real rows with optional date-range filter for consistency.
    // No shadow filter, no virtual expansion.
    const where: any = {
      ownerId: securityContext?.id || undefined,
    };
    if (startParam && endParam) {
      const rangeStart = new Date(startParam);
      const rangeEnd = new Date(endParam);
      where.startDateTime = { lte: rangeEnd };
      where.endDateTime = { gte: rangeStart };
    }

    const responsibilities = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'findMany',
      args: {
        where,
        orderBy: { startDateTime: 'asc' }
      }
    }));

    return NextResponse.json(responsibilities);
  } catch (error: unknown) {
    console.error("Error fetching responsibilities:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
