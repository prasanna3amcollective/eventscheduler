

import { NextResponse, NextRequest } from 'next/server';
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
  status: z.enum(['active', 'archived', 'draft']).optional(),
});

export async function GET(
  request: NextRequest,
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
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
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
    if (parsed.status !== undefined) data.status = parsed.status;

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

    // If the template is being archived, also cancel related activities
    if (data.status === 'archived') {
      await withAuth(securityContext, () => ({
        model: 'activity',
        operation: 'updateMany',
        args: {
          where: { recurrenceTemplateId: id },
          data: { detachReason: 'cancelled' },
        },
      }));
    }


    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating recurrence template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message, details: error.issues }, { status: 400 });
    }
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 });
    }

    const securityContext = await getSessionContext();
    const updated = await withAuth(securityContext, () => ({
      model: 'recurrenceTemplate',
      operation: 'update',
      args: {
        where: { id },
        data: { status: 'archived' },
      },
    }));

    // Also mark all generated activities as cancelled via detachReason
    await withAuth(securityContext, () => ({
      model: 'activity',
      operation: 'updateMany',
      args: {
        where: { recurrenceTemplateId: id },
        data: { detachReason: 'cancelled' },
      },
    }));

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error archiving recurrence template:', error);
    if ((error as Error).message?.includes('Security Restricted')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message, details: (error as Error).stack }, { status: 500 });
  }
}
