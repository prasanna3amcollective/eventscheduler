import type { RecurrenceTemplateType, RecurrenceStatus } from '@prisma/client';

/**
 * Options for the low-level date generator.
 * The generator is "asOf-aware" per the PHASE 4 spec: it automatically
 * filters results to dates >= asOf (default = now).
 */
export interface GenerateOccurrencesOptions {
  asOf?: Date;
  excludeDates?: Date[];
  /** For logging / correlation only — not used in computation */
  templateId?: string;
}

/**
 * Structured result returned by materializeTemplateWindow.
 */
export interface MaterializeResult {
  templateId: string;
  created: number;
  skipped: number;
  newGeneratedUntil: Date;
  errors: string[];
  dryRun: boolean;
}

/**
 * Structured result returned by reconcileFutureOccurrences.
 */
export interface ReconcileResult {
  templateId: string;
  created: number;
  updated: number;
  cancelled: number;
  skippedDetached: number;
  newGeneratedUntil?: Date;
  errors: string[];
  dryRun: boolean;
}

/**
 * Options controlling the rolling materialization window.
 */
export interface MaterializeOptions {
  horizonDays?: number; // default 60
  asOf?: Date;
  dryRun?: boolean;
}

/**
 * Options for reconciliation (usually called after a template version bump or rule edit).
 */
export interface ReconcileOptions {
  newVersionId?: string; // when a new version row exists, stamp generatedFromTemplateId with it
  asOf?: Date;
  dryRun?: boolean;
}

/**
 * Lightweight view of a RecurrenceTemplate row as needed by the generator.
 * (We intentionally do not depend on the full generated Prisma type in the public API.)
 */
export interface TemplateSnapshot {
  id: string;
  templateType: RecurrenceTemplateType;
  name: string | null;
  duration: number;
  category: string;
  recurrenceRule: string;
  startDate: Date;
  endDate: Date | null;
  excludeDates: Date[];
  generatedUntil: Date | null;
  lastGeneratedAt: Date | null;
  versionSeriesId: string;
  version: number;
  status: RecurrenceStatus;
}
