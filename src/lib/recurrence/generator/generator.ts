import { PrismaClient } from '@prisma/client';
import {
  GenerateOccurrencesOptions,
  MaterializeOptions,
  MaterializeResult,
  ReconcileOptions,
  ReconcileResult,
  TemplateSnapshot,
} from './types';

// Stable recurrence library (read-only reuse — never modify during PHASE 4)
import { generateOccurrenceDates, applyExdates } from '../expander';
import { toIcalDtstart, computeEndDateTime } from '../utils';
import type { RecurrenceTemplateType } from '@prisma/client';

/**
 * PHASE 4 — Isolated Recurrence Generator Service
 *
 * This module is the heart of the hybrid rolling materialization system.
 * It is developed and tested in complete isolation.
 * NO existing production code paths (API routes, forms, CalendarView, expander)
 * import or call anything from here yet.
 *
 * Public contract:
 *   - generateOccurrences (pure, asOf-aware)
 *   - materializeTemplateWindow
 *   - reconcileFutureOccurrences
 */

/* -------------------------------------------------------------------------- */
/*                              LOW-LEVEL GENERATOR                           */
/* -------------------------------------------------------------------------- */

/**
 * Generate occurrence start dates for a recurrence rule within a range.
 *
 * Key behaviors (per PHASE 4 spec):
 * - Re-uses the stable `generateOccurrenceDates` + EXDATE handling from the
 *   sibling recurrence library.
 * - Automatically filters the result to dates >= `asOf` (default = now()).
 * - Respects both EXDATE lines embedded in the rule string AND the
 *   `excludeDates` array stored on the template.
 * - Returns a sorted, deduplicated list of Date objects (start of each occurrence).
 *
 * This function is intentionally pure / side-effect free so it can be
 * unit-tested with zero database or clock dependencies.
 */
export function generateOccurrences(
  recurrenceRule: string,
  rangeStart: Date,
  rangeEnd: Date,
  options: GenerateOccurrencesOptions = {}
): Date[] {
  const asOf = options.asOf ?? new Date();

  // 1. Get candidate dates from the stable engine (handles embedded EXDATEs in the rule string)
  let dates = generateOccurrenceDates(recurrenceRule, rangeStart, rangeEnd);

  // 2. If the template also carries an excludeDates[] array, convert them to EXDATE lines
  //    and post-filter using the existing applyExdates helper (keeps logic in one place).
  if (options.excludeDates && options.excludeDates.length > 0) {
    const exdateLines = options.excludeDates.map((d) => `EXDATE:${toIcalDtstart(d)}`);
    dates = applyExdates(dates, exdateLines);
  }

  // 3. Generator is asOf-aware: only return dates at/after the reference point (future materialization)
  const filtered = dates.filter((d) => d >= asOf);

  // 4. Ensure stable ordering and remove any accidental duplicates (rrule should not produce them, but be defensive)
  const seen = new Set<string>();
  const result: Date[] = [];
  for (const d of filtered) {
    const key = d.toISOString();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(d);
    }
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/*                           MATERIALIZE WINDOW                               */
/* -------------------------------------------------------------------------- */

/**
 * Materialize (create) concrete Activity or Responsibility rows for all
 * missing future occurrences of a RecurrenceTemplate up to a rolling horizon.
 *
 * Invariants:
 * - Only creates rows for dates >= asOf (future / present).
 * - Never touches rows where detachReason !== 'none'.
 * - Never touches past occurrences.
 * - Uses createMany({ skipDuplicates: true }) + the unique constraint on
 *   (recurrenceTemplateId, startDateTime) for safety.
 * - Updates generatedUntil and lastGeneratedAt on the template.
 * - When dryRun = true, performs all calculations but does not write.
 *
 * The stamped data for each created occurrence comes from the template:
 *   name, duration, category (owner is left null for responsibilities).
 *   Participants are intentionally left empty for Activity occurrences.
 */
export async function materializeTemplateWindow(
  prisma: PrismaClient,
  templateId: string,
  options: MaterializeOptions = {}
): Promise<MaterializeResult> {
  const asOf = options.asOf ?? new Date();
  const horizonDays = options.horizonDays ?? 60;
  const dryRun = options.dryRun ?? false;
  const errors: string[] = [];

  try {
    const template = await loadTemplateSnapshot(prisma, templateId);

    if (template.status !== 'active') {
      return {
        templateId,
        created: 0,
        skipped: 0,
        newGeneratedUntil: template.generatedUntil ?? asOf,
        errors: [`Template ${templateId} is not active (status=${template.status})`],
        dryRun,
      };
    }

    // Compute the target horizon
    const horizonEnd = new Date(asOf.getTime() + horizonDays * 24 * 60 * 60 * 1000);

    // Generate all candidate dates in the window (asOf-aware)
    const desiredDates = generateOccurrences(
      template.recurrenceRule,
      template.startDate,
      horizonEnd,
      {
        asOf,
        excludeDates: template.excludeDates,
        templateId,
      }
    );

    if (desiredDates.length === 0) {
      // Nothing to do — still advance the horizon so we don't keep re-querying
      if (!dryRun) {
        await prisma.recurrenceTemplate.update({
          where: { id: templateId },
          data: {
            generatedUntil: horizonEnd,
            lastGeneratedAt: new Date(),
          },
        });
      }
      return {
        templateId,
        created: 0,
        skipped: 0,
        newGeneratedUntil: horizonEnd,
        errors,
        dryRun,
      };
    }

    // For each desired date, prepare the payload for the correct model
    const payloads = desiredDates.map((start) =>
      buildOccurrenceCreatePayload(template, start, template.id)
    );

    let created = 0;

    if (!dryRun) {
      // We perform the write inside a transaction for atomicity with the horizon update
      await prisma.$transaction(async (tx) => {
        if (template.templateType === 'activity') {
          const result = await tx.activity.createMany({
            data: payloads as any,
            skipDuplicates: true,
          });
          created = result.count;
        } else {
          const result = await tx.responsibility.createMany({
            data: payloads as any,
            skipDuplicates: true,
          });
          created = result.count;
        }

        await tx.recurrenceTemplate.update({
          where: { id: templateId },
          data: {
            generatedUntil: horizonEnd,
            lastGeneratedAt: new Date(),
          },
        });
      });
    } else {
      // Dry run — just count how many would have been new
      // We can't easily know without querying, so we report the full desired set size
      created = desiredDates.length;
    }

    return {
      templateId,
      created,
      skipped: desiredDates.length - created,
      newGeneratedUntil: horizonEnd,
      errors,
      dryRun,
    };
  } catch (err: any) {
    errors.push(err?.message ?? String(err));
    return {
      templateId,
      created: 0,
      skipped: 0,
      newGeneratedUntil: asOf,
      errors,
      dryRun,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                           RECONCILE FUTURE                                 */
/* -------------------------------------------------------------------------- */

export async function reconcileFutureOccurrences(
  prisma: PrismaClient,
  templateId: string,
  options: ReconcileOptions = {}
): Promise<ReconcileResult> {
  const asOf = options.asOf ?? new Date();
  const dryRun = options.dryRun ?? false;
  const newVersionId = options.newVersionId ?? templateId;
  const errors: string[] = [];

  let created = 0;
  let updated = 0;
  let cancelled = 0;
  let skippedDetached = 0;

  try {
    const template = await loadTemplateSnapshot(prisma, templateId);

    if (template.status !== 'active') {
      return {
        templateId,
        created: 0,
        updated: 0,
        cancelled: 0,
        skippedDetached: 0,
        errors: [`Template is not active`],
        dryRun,
      };
    }

    // Use a generous future window for reconciliation (60 days from asOf)
    const horizonEnd = new Date(asOf.getTime() + 60 * 24 * 60 * 60 * 1000);

    const desiredDates = generateOccurrences(
      template.recurrenceRule,
      template.startDate,
      horizonEnd,
      { asOf, excludeDates: template.excludeDates, templateId }
    );

    // Load existing future non-detached occurrences for this template
    const model = template.templateType === 'activity' ? 'activity' : 'responsibility';
    const existing: any[] = await (prisma as any)[model].findMany({
      where: {
        recurrenceTemplateId: templateId,
        startDateTime: { gte: asOf },
        detachReason: 'none',
      },
      select: { id: true, startDateTime: true, name: true, duration: true, category: true },
    });

    const existingByTime = new Map<string, any>();
    for (const row of existing) {
      existingByTime.set(row.startDateTime.toISOString(), row);
    }

    const desiredByTime = new Map<string, Date>();
    for (const d of desiredDates) {
      desiredByTime.set(d.toISOString(), d);
    }

    // 1. Cancel obsolete dates (present in existing but not in desired)
    const toCancel = existing.filter((row) => !desiredByTime.has(row.startDateTime.toISOString()));

    if (toCancel.length > 0 && !dryRun) {
      const ids = toCancel.map((r) => r.id);
      const result = await (prisma as any)[model].updateMany({
        where: { id: { in: ids } },
        data: { state: 'Cancelled' },
      });
      cancelled = result.count;
    } else {
      cancelled = toCancel.length;
    }

    // 2. Create missing dates
    const toCreateDates: Date[] = desiredDates.filter(
      (d) => !existingByTime.has(d.toISOString())
    );

    if (toCreateDates.length > 0 && !dryRun) {
      const payloads = toCreateDates.map((start) =>
        buildOccurrenceCreatePayload(template, start, newVersionId)
      );

      const result = await (prisma as any)[model].createMany({
        data: payloads,
        skipDuplicates: true,
      });
      created = result.count;
    } else {
      created = toCreateDates.length;
    }

    // 3. Update data drift on existing rows (name / duration / category changed on template)
    // Only for rows that are still desired.
    const driftCandidates = existing.filter((row) => desiredByTime.has(row.startDateTime.toISOString()));

    const needsUpdate: string[] = [];
    for (const row of driftCandidates) {
      if (
        row.name !== (template.name ?? 'Untitled') ||
        row.duration !== template.duration ||
        row.category !== template.category
      ) {
        needsUpdate.push(row.id);
      }
    }

    if (needsUpdate.length > 0 && !dryRun) {
      // We update one by one because different models; acceptable for small sets
      for (const id of needsUpdate) {
        await (prisma as any)[model].update({
          where: { id },
          data: {
            name: template.name ?? 'Untitled',
            duration: template.duration,
            category: template.category,
            generatedFromTemplateId: newVersionId,
          },
        });
      }
      updated = needsUpdate.length;
    } else {
      updated = needsUpdate.length;
    }

    // Count detached rows we saw (for reporting)
    const allFutureForTemplate: any[] = await (prisma as any)[model].findMany({
      where: {
        recurrenceTemplateId: templateId,
        startDateTime: { gte: asOf },
      },
      select: { detachReason: true },
    });
    skippedDetached = allFutureForTemplate.filter((r) => r.detachReason !== 'none').length;

    // Advance horizon if we did real work
    let newGeneratedUntil: Date | undefined;
    if (!dryRun) {
      newGeneratedUntil = horizonEnd;
      await prisma.recurrenceTemplate.update({
        where: { id: templateId },
        data: { generatedUntil: horizonEnd, lastGeneratedAt: new Date() },
      });
    }

    return {
      templateId,
      created,
      updated,
      cancelled,
      skippedDetached,
      newGeneratedUntil,
      errors,
      dryRun,
    };
  } catch (err: any) {
    errors.push(err?.message ?? String(err));
    return {
      templateId,
      created,
      updated,
      cancelled,
      skippedDetached,
      errors,
      dryRun,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                           INTERNAL HELPERS                                 */
/* -------------------------------------------------------------------------- */

async function loadTemplateSnapshot(
  prisma: PrismaClient,
  templateId: string
): Promise<TemplateSnapshot> {
  const row = await prisma.recurrenceTemplate.findUnique({
    where: { id: templateId },
  });

  if (!row) {
    throw new Error(`RecurrenceTemplate not found: ${templateId}`);
  }
  if (row.status === 'archived') {
    throw new Error(`RecurrenceTemplate is archived: ${templateId}`);
  }

  return {
    id: row.id,
    templateType: row.templateType,
    name: row.name,
    duration: row.duration,
    category: row.category,
    recurrenceRule: row.recurrenceRule,
    startDate: row.startDate,
    endDate: row.endDate,
    excludeDates: row.excludeDates,
    generatedUntil: row.generatedUntil,
    lastGeneratedAt: row.lastGeneratedAt,
    versionSeriesId: row.versionSeriesId,
    version: row.version,
    status: row.status,
  };
}

function buildOccurrenceCreatePayload(
  template: TemplateSnapshot,
  start: Date,
  generatedFromId: string
) {
  const end = computeEndDateTime(start, template.duration);
  const base = {
    name: template.name ?? 'Untitled Recurring',
    startDateTime: start,
    endDateTime: end,
    duration: template.duration,
    category: template.category,
    isRecurring: false,
    recurrenceRule: null,
    recurrenceTemplateId: template.id,
    generatedFromTemplateId: generatedFromId,
    detachReason: 'none' as const,
    state: 'Scheduled',
    // sys_* columns are handled by the Prisma extension when a context is present.
    // For pure generator calls we leave them null (system origin).
  };

  // Activity and Responsibility have almost identical shapes for these fields.
  // The caller decides which model receives the payload.
  return base;
}
