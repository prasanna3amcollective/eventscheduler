import { NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib/prisma';
import { getSessionContext } from '@/lib/auth';
import { z } from 'zod';
import { isShadowGeneratedRow, ensureShadowTemplateAndMaterialize } from '@/lib/recurrence/shadow';

const responsibilitySchema = z.object({
  name: z.string().min(1, 'Responsibility name is required').max(200),
  startDateTime: z.string().datetime({ message: "Invalid start date format" }),
  endDateTime: z.string().datetime({ message: "Invalid end date format" }),
  duration: z.number().positive(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().nullable().optional(),
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
    const { name, startDateTime, endDateTime, duration, isRecurring, recurrenceRule, category, owner, ownerId, recurrenceTemplateId, generatedFromTemplateId, detachReason } = parsedData;

    const securityContext = await getSessionContext();

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

    // PHASE 5 — shadow generation for newly created recurring masters (best-effort only).
    // Mirrors the activities path exactly. The materialized responsibility shadows
    // omit owner (per generator contract) and are hidden by the GET filter during
    // this validation phase. The backlinked master retains its recurrenceRule.
    // Do not remove until PHASE 8 cutover.
    if (isRecurring && recurrenceRule && !recurrenceTemplateId) {
      const tplId = await ensureShadowTemplateAndMaterialize({
        prisma,
        masterId: responsibility.id,
        model: 'responsibility',
        templateType: 'responsibility',
        name,
        duration: Number(duration),
        category: category || 'General',
        recurrenceRule,
        startDateTime: new Date(startDateTime),
        context: securityContext,
      });
      if (tplId) {
        // Patch the 201 response (harmless for now)
        (responsibility as any).recurrenceTemplateId = tplId;
        (responsibility as any).generatedFromTemplateId = tplId;
      }
    }

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

export async function GET() {
  try {
    const securityContext = await getSessionContext();

    const responsibilities = await withAuth(securityContext, () => ({
      model: 'responsibility',
      operation: 'findMany',
      args: {
        where: {
          ownerId: securityContext?.id || undefined,
        },
        orderBy: { startDateTime: 'asc' }
      }
    }));

    // PHASE 5 shadow filter — pure materialized shadow rows are hidden from the response.
    // The backlinked master (still carrying its recurrenceRule) is retained so any
    // future expansion logic (once implemented for responsibilities) continues to work.
    // Do not remove until PHASE 8 cutover.
    const visibleResponsibilities = (responsibilities as unknown as any[]).filter((r: any) => !isShadowGeneratedRow(r));

    return NextResponse.json(visibleResponsibilities);
  } catch (error: unknown) {
    console.error("Error fetching responsibilities:", error);
    if (error.message?.includes('Security Restricted')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
