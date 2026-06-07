import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { z } from 'zod';
import { reconcileFutureOccurrences } from '@/lib/recurrence/generator';

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  recurrenceRule: z.string().optional(),
  duration: z.number().positive().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const securityContext = await getSessionContext();

    const tpl = await withAuth(securityContext, () => ({
      model: 'recurrenceTemplate',
      operation: 'findUnique',
      args: {
        where: { id },
      },
    }));

    if (!tpl) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(tpl);
  } catch (error: any) {
    console.error('Error fetching recurrence template:', error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateTemplateSchema.parse(body);

    const securityContext = await getSessionContext();

    // Update only provided fields
    const data: Record<string, unknown> = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.recurrenceRule !== undefined) data.recurrenceRule = parsed.recurrenceRule;
    if (parsed.duration !== undefined) data.duration = parsed.duration;
    if (parsed.category !== undefined) data.category = parsed.category;
    if (parsed.startDate !== undefined) data.startDate = new Date(parsed.startDate);
    if (parsed.endDate !== undefined) data.endDate = parsed.endDate ? new Date(parsed.endDate) : null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const updated = await withAuth(securityContext, () => ({
      model: 'recurrenceTemplate',
      operation: 'update',
      args: {
        where: { id },
        data,
      },
    }));

    // Trigger reconcile so future non-detached children are created/updated/cancelled to match new rule
    await reconcileFutureOccurrences(prisma, id, {
      asOf: new Date(),
      horizonDays: 365,
      context: securityContext,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating recurrence template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message, details: error.issues }, { status: 400 });
    }
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
