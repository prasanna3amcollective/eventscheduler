/**
 * Isolated Recurrence Generator Service — Public API (PHASE 5 shadow mode active)
 *
 * This barrel re-exports the stable contract for the generator.
 * Production call sites are now the two POST handlers via the thin shadow wrapper
 * (best-effort, never user-visible). Internal files remain private.
 */

export {
  generateOccurrences,
  materializeTemplateWindow,
  reconcileFutureOccurrences,
  compareVirtualToMaterialized,
} from './generator';

export type {
  CompareResult,
  GenerateOccurrencesOptions,
  GeneratorContext,
  MaterializeOptions,
  MaterializeResult,
  ReconcileOptions,
  ReconcileResult,
  TemplateSnapshot,
} from './types';
