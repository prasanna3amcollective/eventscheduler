import { PrismaClient } from '@prisma/client';
import {
  materializeTemplateWindow,
  reconcileFutureOccurrences,
  type GeneratorContext,
  type MaterializeResult,
  type ReconcileResult,
} from '@/lib/recurrence/generator';

export interface MaintenanceOptions {
  horizonDays?: number;      // target rolling horizon (default 45)
  gapThresholdDays?: number; // templates with lastGeneratedAt older than this get reconciliation (default 7)
  asOf?: Date;
}

export interface TemplateActionDetail {
  templateId: string;
  templateName: string | null;
  action: 'horizon' | 'reconcile' | 'both' | 'skipped';
  materializeResult?: MaterializeResult;
  reconcileResult?: ReconcileResult;
  error?: string;
}

export interface MaintenanceResult {
  asOf: string;
  horizonDays: number;
  gapThresholdDays: number;
  templatesProcessed: number;
  horizonAdvanced: number;
  gapsClosed: number;
  totalCreated: number;
  totalReconciled: number;
  errors: string[];
  details: TemplateActionDetail[];
}

/**
 * Daily maintenance job for the recurrence materialization system.
 *
 * Responsibilities:
 * 1. Advance the rolling materialization window (default 45 days) for active templates.
 * 2. Close generation gaps for templates that have not been processed recently
 *    by calling reconcileFutureOccurrences.
 *
 * This function is designed to be called by both:
 * - The HTTP cron endpoint (with a real system-cron security context)
 * - The standalone CLI script (same)
 */
export async function runDailyMaterializationMaintenance(
  prisma: PrismaClient,
  context: GeneratorContext,
  options: MaintenanceOptions = {}
): Promise<MaintenanceResult> {
  const asOf = options.asOf ?? new Date();
  const horizonDays = options.horizonDays ?? 45;
  const gapThresholdDays = options.gapThresholdDays ?? 7;

  const result: MaintenanceResult = {
    asOf: asOf.toISOString(),
    horizonDays,
    gapThresholdDays,
    templatesProcessed: 0,
    horizonAdvanced: 0,
    gapsClosed: 0,
    totalCreated: 0,
    totalReconciled: 0,
    errors: [],
    details: [],
  };

  console.log(`[Maintenance] Starting daily run — asOf=${result.asOf}, horizon=${horizonDays}d, gapThreshold=${gapThresholdDays}d`);

  // ------------------------------------------------------------------
  // 1. Find templates that need horizon advancement
  // ------------------------------------------------------------------
  const horizonCutoff = new Date(asOf.getTime() + (horizonDays - 5) * 24 * 60 * 60 * 1000);

  const horizonCandidates = await prisma.recurrenceTemplate.findMany({
    where: {
      status: 'active',
      OR: [
        { generatedUntil: null },
        { generatedUntil: { lt: horizonCutoff } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { sys_created_at: 'asc' },
  });

  // ------------------------------------------------------------------
  // 2. Find templates that are very stale (need gap closing / reconciliation)
  // ------------------------------------------------------------------
  const gapCutoff = new Date(asOf.getTime() - gapThresholdDays * 24 * 60 * 60 * 1000);

  const staleCandidates = await prisma.recurrenceTemplate.findMany({
    where: {
      status: 'active',
      OR: [
        { lastGeneratedAt: null },
        { lastGeneratedAt: { lt: gapCutoff } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { sys_created_at: 'asc' },
  });

  // Combine and dedupe
  const templateMap = new Map<string, { id: string; name: string | null; needsHorizon: boolean; needsReconcile: boolean }>();

  for (const t of horizonCandidates) {
    templateMap.set(t.id, {
      id: t.id,
      name: t.name,
      needsHorizon: true,
      needsReconcile: false,
    });
  }

  for (const t of staleCandidates) {
    if (templateMap.has(t.id)) {
      templateMap.get(t.id)!.needsReconcile = true;
    } else {
      templateMap.set(t.id, {
        id: t.id,
        name: t.name,
        needsHorizon: false,
        needsReconcile: true,
      });
    }
  }

  const allTemplates = Array.from(templateMap.values());
  result.templatesProcessed = allTemplates.length;

  console.log(`[Maintenance] Found ${allTemplates.length} template(s) requiring work`);

  // ------------------------------------------------------------------
  // 3. Process each template
  // ------------------------------------------------------------------
  for (const tpl of allTemplates) {
    const detail: TemplateActionDetail = {
      templateId: tpl.id,
      templateName: tpl.name,
      action: 'skipped',
    };

    try {
      if (tpl.needsHorizon) {
        const matRes = await materializeTemplateWindow(prisma, tpl.id, {
          horizonDays,
          asOf,
          context,
        });

        detail.action = tpl.needsReconcile ? 'both' : 'horizon';
        detail.materializeResult = matRes;

        result.horizonAdvanced += 1;
        result.totalCreated += matRes.created;

        console.log(
          `[Maintenance] [Horizon] ${tpl.name || tpl.id} → created=${matRes.created}, skipped=${matRes.skipped}, until=${matRes.newGeneratedUntil}`
        );
      }

      if (tpl.needsReconcile) {
        const recRes = await reconcileFutureOccurrences(prisma, tpl.id, {
          asOf,
          context,
        });

        if (detail.action === 'horizon') detail.action = 'both';
        else if (detail.action === 'skipped') detail.action = 'reconcile';

        detail.reconcileResult = recRes;

        result.gapsClosed += 1;
        result.totalReconciled += recRes.created + recRes.updated + recRes.cancelled;

        console.log(
          `[Maintenance] [Reconcile] ${tpl.name || tpl.id} → created=${recRes.created}, updated=${recRes.updated}, cancelled=${recRes.cancelled}`
        );
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      detail.error = msg;
      result.errors.push(`${tpl.id}: ${msg}`);
      console.error(`[Maintenance] Error processing ${tpl.name || tpl.id}:`, msg);
    }

    result.details.push(detail);
  }

  console.log(
    `[Maintenance] Completed. horizonAdvanced=${result.horizonAdvanced}, gapsClosed=${result.gapsClosed}, totalCreated=${result.totalCreated}, errors=${result.errors.length}`
  );

  return result;
}
