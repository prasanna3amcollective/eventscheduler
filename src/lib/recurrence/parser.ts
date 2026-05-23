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

/**
 * Parse an EXDATE line (e.g., "EXDATE:20200101T100000Z") into a Date object.
 * Assumes the line is already trimmed and starts with "EXDATE:".
 */
export function parseExdate(exdateLine: string): Date {
  const value = exdateLine.substring('EXDATE:'.length).trim();
  // Handle different formats: YYYYMMDD, YYYYMMDDTHHMMSS, YYYYMMDDTHHMMSSZ
  // We'll parse with JavaScript Date, which handles ISO 8601 and basic formats.
  // If the value is just a date (8 chars), we assume UTC midnight.
  // Otherwise, we let Date.parse handle it (which may be UTC or local depending on format).
  // To be safe, we'll treat as UTC if it ends with 'Z' or has a timezone offset.
  // For simplicity, we'll use Date.parse and assume the string is in a format Date understands.
  // Note: Date.parse is not fully reliable for all formats, but the EXDATE in RRULE should be in ISO 8601.
  // If the value is only 8 characters (YYYYMMDD), we parse as YYYY-MM-DDTHH:mm:ssZ (midnight UTC).
  if (/^\d{8}$/.test(value)) {
    const year = parseInt(value.substring(0, 4), 10);
    const month = parseInt(value.substring(4, 6), 10) - 1; // Month is 0-indexed
    const day = parseInt(value.substring(6, 8), 10);
    return new Date(Date.UTC(year, month, day));
  }
  // Otherwise, try parsing as ISO string (with or without time)
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    // Fallback: try to parse as UTC if ends with Z
    if (value.endsWith('Z')) {
      const withoutZ = value.substring(0, value.length - 1);
      return new Date(withoutZ + 'Z');
    }
    // If still invalid, return an invalid date (caller should handle)
    return date;
  }
  return date;
}
