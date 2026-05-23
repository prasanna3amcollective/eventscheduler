/**
 * Isolated Recurrence Generator Service — Public API (PHASE 4)
 *
 * This barrel re-exports the stable contract for the generator.
 * Nothing outside src/lib/recurrence/generator/ should import the internal
 * files directly.
 */

export {
  generateOccurrences,
  materializeTemplateWindow,
  reconcileFutureOccurrences,
} from './generator';

export type {
  GenerateOccurrencesOptions,
  MaterializeOptions,
  MaterializeResult,
  ReconcileOptions,
  ReconcileResult,
  TemplateSnapshot,
} from './types';
