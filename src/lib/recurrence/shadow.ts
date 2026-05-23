import { randomUUID } from 'crypto';
import { materializeTemplateWindow, compareVirtualToMaterialized } from './generator';
import type { RecurrenceTemplateType } from '@prisma/client';

/**
 * Returns true for rows that were generated as shadow materializations (PHASE 5).
 *
 * These rows are written to the DB for comparison/validation but must be
 * filtered out of every list API response. This keeps the live application
 * 100% unchanged for users during the shadow-mode validation period.
 *
 * Key clause: `!row.recurrenceRule` guarantees that the *original* backlinked
 * master row (which still carries its legacy recurrenceRule during PHASE 5)
 * is never hidden — only the newly materialized children (rrule moved to template)
 * are suppressed.
 *
 * The predicate is pure and has no side effects; it can be used in both
 * activity and responsibility list paths.
 */
export const isShadowGeneratedRow = (row: Record<string, unknown>): boolean =>
  !!row.recurrenceTemplateId &&
  row.generatedFromTemplateId === row.recurrenceTemplateId &&
  row.detachReason === 'none' &&
  !row.recurrenceRule;

/**
 * Best-effort helper that, after a legacy master row has been created by the
 * normal POST path, creates the corresponding RecurrenceTemplate, asks the
 * generator to materialize the concrete future occurrences (which have
 * recurrenceRule: null), back-links the original master via the two FKs,
 * runs the compare utility, and logs any mismatch.
 *
 * Everything is wrapped in try/catch; a failure here must never affect the
 * user-visible 201 response.
 *
 * Called only for brand-new recurring creates (isRecurring && recurrenceRule && !recurrenceTemplateId).
 */
export async function ensureShadowTemplateAndMaterialize(params: {
  prisma: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  masterId: string; // the just-created legacy master that had the rrule
  model: 'activity' | 'responsibility';
  templateType: RecurrenceTemplateType;
  name: string;
  duration: number;
  category: string;
  recurrenceRule: string;
  startDateTime: Date;
  recurrenceStart?: string | Date | null;
  recurrenceUntil?: string | Date | null;
  recurrenceWeeks?: number | null;
  context?: { id: string; roles: string[] };
}): Promise<string | null> {
  try {
    const tpl = await params.prisma.recurrenceTemplate.create({
      data: {
        templateType: params.templateType,
        name: params.name,
        duration: params.duration,
        category: params.category,
        recurrenceRule: params.recurrenceRule,
        // startDate / endDate on the template now come from the dedicated Recurrence Start/Until fields when supplied (they also drive DTSTART/UNTIL inside recurrenceRule)
        startDate: params.recurrenceStart ? new Date(params.recurrenceStart) : params.startDateTime,
        endDate: params.recurrenceUntil ? new Date(params.recurrenceUntil) : null,
        excludeDates: [],
        versionSeriesId: randomUUID(),
        version: 1,
        status: 'active',
      },
      ...(params.context ? { _context: params.context } : {}),
    });

    // Materialize the *new* records (they correctly have no rrule)
    await materializeTemplateWindow(params.prisma, tpl.id, {
      asOf: params.recurrenceStart ? new Date(params.recurrenceStart) : params.startDateTime,
      horizonDays: 60,
      context: params.context,
    });

    // Backlink the original master record (the one that had the rrule column)
    await params.prisma[params.model].update({
      where: { id: params.masterId },
      data: {
        recurrenceTemplateId: tpl.id,
        generatedFromTemplateId: tpl.id,
        // recurrenceRule deliberately left on the master during shadow phase
      },
      ...(params.context ? { _context: params.context } : {}),
    });

    const comparison = await compareVirtualToMaterialized(params.prisma, tpl.id, {
      asOf: params.recurrenceStart ? new Date(params.recurrenceStart) : params.startDateTime,
      horizonDays: 60,
    });
    if (!comparison.match) {
      console.error('[Shadow Generation] MISMATCH for template', tpl.id, comparison);
    } else {
      console.log('[Shadow Generation] match=true for template', tpl.id, 'virtual=', comparison.virtualDates.length);
    }
    return tpl.id;
  } catch (err) {
    console.error('[Shadow Generation] Best-effort creation + backlink failed (non-fatal):', err);
    return null;
  }
}
