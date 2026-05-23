import { rrulestr, RRule } from 'rrule';
import { normalizeRuleString } from './utils';
import type { ParsedRecurrence, ValidationResult } from './types';

/**
 * Safely parse an RRULE string. Never throws to callers.
 * On failure: logs and returns null (preserves legacy console.error behavior).
 */
export function safeRrulestr(ruleStr: string | null | undefined): RRule | null {
  const normalized = normalizeRuleString(ruleStr);
  if (!normalized) return null;

  try {
    return rrulestr(normalized);
  } catch (e) {
    console.error('Error parsing rrule:', e);
    return null;
  }
}

/**
 * Extract EXDATE lines from a full rule string (for preservation / inspection).
 */
export function extractExdates(rule: string | null | undefined): string[] {
  const normalized = normalizeRuleString(rule);
  if (!normalized) return [];
  return normalized
    .split('\n')
    .filter((line) => line.trim().toUpperCase().startsWith('EXDATE:'))
    .map((l) => l.trim());
}

/**
 * Extract BYDAY values as string array (e.g. ['MO', 'WE']).
 * Uses parsed options when possible for robustness.
 */
export function extractByDays(rule: string | null | undefined): string[] {
  const rrule = safeRrulestr(rule);
  if (rrule && rrule.options.byweekday != null) {
    // rrule options.byweekday can be number | number[] | Weekday[] - dynamic interop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const days: any = rrule.options.byweekday;
    const map: Record<number, string> = { 0: 'MO', 1: 'TU', 2: 'WE', 3: 'TH', 4: 'FR', 5: 'SA', 6: 'SU' };
    if (Array.isArray(days)) {
      return days
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((d: any) => {
          const num = typeof d === 'number' ? d : d?.weekday ?? d;
          return map[num] ?? String(d);
        })
        .filter(Boolean);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const num = typeof days === 'number' ? days : (days as any)?.weekday ?? days;
    return map[num] ? [map[num]] : [];
  }

  // Fallback to string parsing (for malformed or before parse succeeds)
  const normalized = normalizeRuleString(rule);
  const bydayMatch = normalized.match(/BYDAY=([^;\n]+)/i);
  if (bydayMatch && bydayMatch[1]) {
    return bydayMatch[1].split(',').map((d) => d.trim().toUpperCase()).filter(Boolean);
  }
  return [];
}

/**
 * Extract FREQ (defaults to WEEKLY to match UI).
 */
export function extractFreq(rule: string | null | undefined): string {
  const rrule = safeRrulestr(rule);
  if (rrule && rrule.options.freq != null) {
    // RRule.FREQUENCIES is internal; map common values
    const freqMap: Record<number, string> = { 0: 'YEARLY', 1: 'MONTHLY', 2: 'WEEKLY', 3: 'DAILY' };
    return freqMap[rrule.options.freq] ?? 'WEEKLY';
  }
  const normalized = normalizeRuleString(rule);
  const freqMatch = normalized.match(/FREQ=([^;,\n]+)/i);
  return freqMatch ? freqMatch[1].toUpperCase() : 'WEEKLY';
}

/**
 * Extract DTSTART date from rule (for separate Recurrence Start field).
 */
export function extractRecurrenceStart(rule: string | null | undefined): Date | undefined {
  const rrule = safeRrulestr(rule);
  if (rrule && rrule.options.dtstart) {
    return rrule.options.dtstart;
  }
  return undefined;
}

/**
 * Extract UNTIL date from rule (for Recur until field).
 */
export function extractRecurrenceUntil(rule: string | null | undefined): Date | null {
  const rrule = safeRrulestr(rule);
  if (rrule && rrule.options.until) {
    return rrule.options.until;
  }
  return null;
}

/**
 * Extract INTERVAL (defaults to 1).
 */
export function extractRecurrenceInterval(rule: string | null | undefined): number {
  const rrule = safeRrulestr(rule);
  if (rrule && typeof rrule.options.interval === 'number' && rrule.options.interval > 0) {
    return rrule.options.interval;
  }
  return 1;
}

/**
 * High-level parser for form initialization. Replaces all `split('BYDAY=')` hacks.
 */
export function parseRecurrenceForForm(
  recurrenceRule: string | null | undefined
): ParsedRecurrence {
  const normalized = normalizeRuleString(recurrenceRule);
  const exdates = extractExdates(normalized);
  const days = extractByDays(normalized);
  const freq = extractFreq(normalized);
  const recStart = extractRecurrenceStart(normalized);
  const recUntil = extractRecurrenceUntil(normalized);
  const recInterval = extractRecurrenceInterval(normalized);

  return {
    recurrenceDays: days,
    recurrenceFreq: freq,
    hasExdates: exdates.length > 0,
    exdateCount: exdates.length,
    recurrenceStart: recStart,
    recurrenceUntil: recUntil,
    recurrenceInterval: recInterval,
  };
}

/**
 * Lightweight validation. Currently just attempts parse.
 * Returns {valid: true} for empty rule (non-recurring is valid).
 */
export function validateRecurrenceRule(rule: string | null | undefined): ValidationResult {
  if (!rule || !normalizeRuleString(rule)) {
    return { valid: true };
  }
  const parsed = safeRrulestr(rule);
  if (!parsed) {
    return { valid: false, error: 'Invalid RRULE string' };
  }
  return { valid: true };
}
