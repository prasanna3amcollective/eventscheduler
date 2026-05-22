import { addMinutes } from 'date-fns';

/**
 * Format a Date as an iCal DTSTART/EXDATE value, e.g. "20260605T090000Z".
 * Single source of truth for iCal formatting (moved from form components).
 */
export function toIcalDtstart(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format a Date as EXDATE line value (same as DTSTART format).
 */
export function formatExdate(date: Date): string {
  return toIcalDtstart(date);
}

/**
 * Normalize a recurrence rule string (trim, ensure consistent newlines).
 */
export function normalizeRuleString(rule: string | null | undefined): string {
  if (!rule) return '';
  return rule.trim().replace(/\r\n/g, '\n');
}

/**
 * Compute end DateTime from start + duration (minutes).
 * Used inside expand* when needed.
 */
export function computeEndDateTime(start: Date, durationMinutes?: number): Date {
  if (!durationMinutes || durationMinutes <= 0) {
    // Fallback: treat as 60 min if missing (matches old form defaults)
    return addMinutes(start, 60);
  }
  return addMinutes(start, durationMinutes);
}
