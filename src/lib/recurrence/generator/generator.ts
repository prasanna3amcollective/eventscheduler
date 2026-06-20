import { PrismaClient } from '@/generated/prisma/client';
import {
  CompareResult,
  GenerateOccurrencesOptions,
  GeneratorContext,
  MaterializeOptions,
  MaterializeResult,
  ReconcileOptions,
  ReconcileResult,
  TemplateSnapshot,
} from './types';

// Stable recurrence library (read-only reuse — never modify during PHASE 4)
import { generateOccurrenceDates } from '../expander';
import { computeEndDateTime } from '../utils';


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
 * - Re-uses the stable `generateOccurrenceDates` (which already respects embedded EXDATE lines).
 * - Automatically filters the result to dates >= `asOf` (default = now()).
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
  const dates = generateOccurrenceDates(recurrenceRule, rangeStart, rangeEnd);

  // 2. Generator is asOf-aware: only return dates at/after the reference point (future materialization)
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
  const ctx = options.context;
  const errors: string[] = [];

  try {
    const template = await loadTemplateSnapshot(prisma, templateId, ctx);

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
    const effectiveHorizon = template.endDate && template.endDate < horizonEnd
      ? template.endDate
      : horizonEnd;

    // Generate all candidate dates in the window (asOf-aware)
    // effectiveHorizon respects template.endDate (from Recur Until) so materialization stops at user's chosen series end
    const desiredDates = generateOccurrences(
      template.recurrenceRule,
      template.startDate,
      effectiveHorizon,
      {
        asOf,
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
          ...(ctx ? { _context: ctx } : {}),
        } as any);
      }
      return {
        templateId,
        created: 0,
        skipped: 0,
        newGeneratedUntil: effectiveHorizon,
        errors,
        dryRun,
      };
    }

    // For each desired date, prepare the payload for the correct model
    const payloads = desiredDates.map((start) =>
      buildOccurrenceCreatePayload(template, start, template.id)
    );

    let created = 0;

    if (dryRun) {
      // Dry run — just count how many would have been new
      // We can't easily know without querying, so we report the full desired set size
      created = desiredDates.length;
    } else {
      // We perform the write inside a transaction for atomicity with the horizon update
      await prisma.$transaction(async (tx) => {
        if (template.templateType === 'activity') {
          const result = await tx.activity.createMany({
            data: payloads as any,
            skipDuplicates: true,
            ...(ctx ? { _context: ctx } : {}),
          } as any);
          created = result.count;
        } else {
          const result = await tx.responsibility.createMany({
            data: payloads as any,
            skipDuplicates: true,
            ...(ctx ? { _context: ctx } : {}),
          } as any);
          created = result.count;
        }

        await tx.recurrenceTemplate.update({
          where: { id: templateId },
          data: {
            generatedUntil: effectiveHorizon,
            lastGeneratedAt: new Date(),
          },
          ...(ctx ? { _context: ctx } : {}),
        } as any);
      });
    }

    return {
      templateId,
      created,
      skipped: desiredDates.length - created,
      newGeneratedUntil: effectiveHorizon,
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

async function handleCancelObsolete(
  prismaAny: any,
  model: string,
  toCancel: any[],
  dryRun: boolean,
  ctx?: GeneratorContext
): Promise<number> {
  if (toCancel.length === 0) return 0;
  if (dryRun) return toCancel.length;

  const ids = toCancel.map((r) => r.id);
  const result = await prismaAny[model].updateMany({
    where: { id: { in: ids } },
    data: { state: 'Cancelled', detachReason: 'cancelled' },
    ...(ctx ? { _context: ctx } : {}),
  });
  return result.count;
}

async function handleCreateMissing(
  prismaAny: any,
  model: string,
  toCreateDates: Date[],
  template: TemplateSnapshot,
  newVersionId: string,
  dryRun: boolean,
  ctx?: GeneratorContext
): Promise<number> {
  if (toCreateDates.length === 0) return 0;
  if (dryRun) return toCreateDates.length;

  const payloads = toCreateDates.map((start) =>
    buildOccurrenceCreatePayload(template, start, newVersionId)
  );

  const result = await prismaAny[model].createMany({
    data: payloads,
    skipDuplicates: true,
    ...(ctx ? { _context: ctx } : {}),
  });
  return result.count;
}

async function handleUpdateDrifting(
  prismaAny: any,
  model: string,
  driftCandidates: any[],
  template: TemplateSnapshot,
  newVersionId: string,
  dryRun: boolean,
  ctx?: GeneratorContext
): Promise<number> {
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

  if (needsUpdate.length === 0) return 0;
  if (dryRun) return needsUpdate.length;

  for (const id of needsUpdate) {
    await prismaAny[model].update({
      where: { id },
      data: {
        name: template.name ?? 'Untitled',
        duration: template.duration,
        category: template.category,
        generatedFromTemplateId: newVersionId,
      },
      ...(ctx ? { _context: ctx } : {}),
    });
  }
  return needsUpdate.length;
}

export async function reconcileFutureOccurrences(
  prisma: PrismaClient,
  templateId: string,
  options: ReconcileOptions = {}
): Promise<ReconcileResult> {
  const asOf = options.asOf ?? new Date();
  const dryRun = options.dryRun ?? false;
  const newVersionId = options.newVersionId ?? templateId;
  const ctx = options.context;
  const errors: string[] = [];

  let created = 0;
  let updated = 0;
  let cancelled = 0;
  let skippedDetached = 0;

  try {
    const template = await loadTemplateSnapshot(prisma, templateId, ctx);

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

    // Use a generous future window for reconciliation
    const horizonDays = options.horizonDays ?? 60;
    const horizonEnd = new Date(asOf.getTime() + horizonDays * 24 * 60 * 60 * 1000);
    const effectiveHorizon = template.endDate && template.endDate < horizonEnd
      ? template.endDate
      : horizonEnd;

    const desiredDates = generateOccurrences(
      template.recurrenceRule,
      template.startDate,
      effectiveHorizon,
      { asOf, templateId }
    );

    // Load existing future non-detached occurrences for this template
    const model = template.templateType === 'activity' ? 'activity' : 'responsibility';
    const prismaAny = prisma as any;
    const existing: any[] = await prismaAny[model].findMany({
      where: {
        recurrenceTemplateId: templateId,
        startDateTime: { gte: asOf },
        detachReason: 'none',
      },
      select: { id: true, startDateTime: true, name: true, duration: true, category: true },
      ...(ctx ? { _context: ctx } : {}),
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
    cancelled = await handleCancelObsolete(prismaAny, model, toCancel, dryRun, ctx);

    // 2. Create missing dates
    const toCreateDates: Date[] = desiredDates.filter((d) => !existingByTime.has(d.toISOString()));
    created = await handleCreateMissing(prismaAny, model, toCreateDates, template, newVersionId, dryRun, ctx);

    // 3. Update data drift on existing rows
    const driftCandidates = existing.filter((row) => desiredByTime.has(row.startDateTime.toISOString()));
    updated = await handleUpdateDrifting(prismaAny, model, driftCandidates, template, newVersionId, dryRun, ctx);

    // Count detached rows we saw (for reporting)
    const allFutureForTemplate: any[] = await prismaAny[model].findMany({
      where: {
        recurrenceTemplateId: templateId,
        startDateTime: { gte: asOf },
      },
      select: { detachReason: true },
      ...(ctx ? { _context: ctx } : {}),
    });
    skippedDetached = allFutureForTemplate.filter((r) => r.detachReason !== 'none').length;

    // Advance horizon if we did real work
    let newGeneratedUntil: Date | undefined;
    if (!dryRun) {
      newGeneratedUntil = effectiveHorizon;
      await prisma.recurrenceTemplate.update({
        where: { id: templateId },
        data: { generatedUntil: effectiveHorizon, lastGeneratedAt: new Date() },
        ...(ctx ? { _context: ctx } : {}),
      } as any);
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
  templateId: string,
  context?: GeneratorContext
): Promise<TemplateSnapshot> {
  const row = await prisma.recurrenceTemplate.findUnique({
    where: { id: templateId },
    ...(context ? { _context: context } : {}),
  } as any);

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

/* -------------------------------------------------------------------------- */
/*                     PHASE 5 — SHADOW COMPARISON UTILITY                    */
/* -------------------------------------------------------------------------- */

/**
 * Compares the dates that the legacy virtual expander would produce for a
 * RecurrenceTemplate’s rule against the concrete rows that have been
 * materialized by the generator for that template.
 *
 * This is executed automatically on every shadow creation (best-effort) and
 * serves as the continuous validation that the new generator path is
 * bit-for-bit compatible with the old expansion logic before we cut over.
 *
 * All dates are normalized to ISO strings for safe Set membership across
 * time-zone/DST boundaries. End-date stamping is also verified via
 * computeEndDateTime for drift detection.
 */
export async function compareVirtualToMaterialized(
  prisma: PrismaClient,
  templateId: string,
  options: { asOf?: Date; horizonDays?: number; context?: GeneratorContext } = {}
): Promise<CompareResult> {
  const asOf = options.asOf ?? new Date();
  const horizonDays = options.horizonDays ?? 60;
  const ctx = options.context;
  const errors: string[] = [];
  const virtualDates: Date[] = [];
  const materializedDates: Date[] = [];
  let dataDrift: any[] = [];

  try {
    const template = await loadTemplateSnapshot(prisma, templateId, ctx);

    const horizonEnd = new Date(asOf.getTime() + horizonDays * 24 * 60 * 60 * 1000);

    // 1. What the legacy expander (virtual path) would have shown
    virtualDates.push(
      ...generateOccurrences(
        template.recurrenceRule,
        template.startDate,
        horizonEnd,
        {
          asOf,
          templateId,
        }
      )
    );

    // 2. What the generator actually wrote (only non-detached future rows for this template)
    const model = template.templateType === 'activity' ? 'activity' : 'responsibility';
    const prismaAny = prisma as any;
    const materialized: any[] = await prismaAny[model].findMany({
      where: {
        recurrenceTemplateId: templateId,
        startDateTime: { gte: asOf },
        detachReason: 'none',
      },
      select: {
        startDateTime: true,
        name: true,
        duration: true,
        category: true,
        endDateTime: true,
        generatedFromTemplateId: true,
      },
      ...(ctx ? { _context: ctx } : {}),
    });

    materializedDates.push(...materialized.map((m: any) => new Date(m.startDateTime)));

    // Normalize for comparison (DST-safe)
    const virtIso = new Set(virtualDates.map((d) => d.toISOString()));
    const matIso = new Set(materializedDates.map((d) => d.toISOString()));

    const missingInMaterialized = virtualDates.filter((d) => !matIso.has(d.toISOString()));
    const extraInMaterialized = materializedDates.filter((d) => !virtIso.has(d.toISOString()));

    // 3. Data drift on the overlapping slots (name / duration / category / endDate)
    const matByIso = new Map<string, any>();
    for (const m of materialized) {
      matByIso.set(new Date(m.startDateTime).toISOString(), m);
    }
    const drift: any[] = [];
    for (const d of virtualDates) {
      const iso = d.toISOString();
      const m = matByIso.get(iso);
      if (m) {
        const expectedEnd = computeEndDateTime(d, template.duration);
        if (
          (m.name ?? 'Untitled Recurring') !== (template.name ?? 'Untitled Recurring') ||
          m.duration !== template.duration ||
          m.category !== template.category ||
          new Date(m.endDateTime).getTime() !== expectedEnd.getTime()
        ) {
          drift.push({
            start: iso,
            template: { name: template.name, duration: template.duration, category: template.category, end: expectedEnd },
            materialized: { name: m.name, duration: m.duration, category: m.category, end: m.endDateTime },
          });
        }
      }
    }
    dataDrift = drift;

    const dateMatch = missingInMaterialized.length === 0 && extraInMaterialized.length === 0;
    const driftMatch = dataDrift.length === 0;
    const match = dateMatch && driftMatch;

    return {
      templateId,
      virtualDates,
      materializedDates,
      match,
      missingInMaterialized,
      extraInMaterialized,
      dataDrift,
      errors,
    };
  } catch (err: any) {
    errors.push(err?.message ?? String(err));
    return {
      templateId,
      virtualDates,
      materializedDates,
      match: false,
      missingInMaterialized: [],
      extraInMaterialized: [],
      dataDrift,
      errors,
    };
  }
}
