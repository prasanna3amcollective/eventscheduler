import { toIcalDtstart, formatExdate, normalizeRuleString } from './utils';
import { extractExdates } from './parser';
import type { RecurringEntity } from './types';

/**
 * Build an RRULE string from form state.
 * Preserves any pre-existing EXDATE lines when editing (matches legacy ActivityForm behavior).
 * Returns '' when not recurring or no days selected.
 */
export function buildRecurrenceRule(
  start: Date,
  isRecurring: boolean,
  recurrenceDays: string[],
  recurrenceFreq: string,
  initialData?: { recurrenceRule?: string | null } | RecurringEntity
): string {
  if (!isRecurring || !recurrenceDays || recurrenceDays.length === 0) {
    return '';
  }

  const dtstart = toIcalDtstart(start);
  let rrule = `DTSTART:${dtstart}\nRRULE:FREQ=${recurrenceFreq.toUpperCase()};BYDAY=${recurrenceDays.join(',')}`;

  // Preserve EXDATE lines from the original rule when editing (legacy logic)
  const initialRule = initialData && 'recurrenceRule' in initialData
    ? initialData.recurrenceRule
    : (initialData as { recurrenceRule?: string | null })?.recurrenceRule;

  if (initialRule && initialRule.includes('EXDATE')) {
    const exdates = extractExdates(initialRule);
    if (exdates.length > 0) {
      rrule += '\n' + exdates.join('\n');
    }
  }

  return rrule;
}

/**
 * Append an EXDATE to an existing rule string.
 * Deduplicates identical EXDATEs and normalizes formatting.
 * Replaces the manual `rule + '\nEXDATE:...' ` hacks in forms.
 */
export function addExdateToRule(
  existingRule: string,
  excludeDate: Date
): string {
  const normalized = normalizeRuleString(existingRule);
  const exdateValue = formatExdate(excludeDate);
  const newExdateLine = `EXDATE:${exdateValue}`;

  const existingExdates = extractExdates(normalized);
  const alreadyPresent = existingExdates.some((line) =>
    line.toUpperCase().includes(exdateValue.toUpperCase())
  );

  if (alreadyPresent) {
    return normalized; // no change
  }

  if (!normalized) {
    // Edge case: brand new rule with only an exdate? Unlikely, but preserve semantics.
    return newExdateLine;
  }

  // Append to the end (after any existing EXDATEs or RRULE)
  return normalized + '\n' + newExdateLine;
}
