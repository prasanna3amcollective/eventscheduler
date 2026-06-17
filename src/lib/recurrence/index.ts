/**
 * Recurrence Module - Public API
 *
 * Stable contract for all recurrence logic.
 * - RRULE parsing, EXDATE handling, occurrence expansion.
 * - Engine (rrule) is fully encapsulated; can be swapped internally without changing callers.
 *
 * Primary exports (as specified in architecture plan):
 *   generateOccurrenceDates, applyExdates
 *   + expandRecurringActivity (deprecated in PHASE 6; real rows replace virtual expansion)
 *   + supporting builder/parser helpers for forms and mutation flows.
 */

export { generateOccurrenceDates, applyExdates, expandRecurringActivity } from './expander';
export { buildRecurrenceRule } from './builder';
export { parseRecurrenceForForm, validateRecurrenceRule } from './parser';

export type { RecurringEntity, ParsedRecurrence, ValidationResult } from './types';

// Re-export the low-level iCal formatter for any rare direct needs (still stable)
export { toIcalDtstart, formatExdate } from './utils';
