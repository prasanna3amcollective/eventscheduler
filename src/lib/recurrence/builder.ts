import { toIcalDtstart } from './utils';
import type { RecurringEntity } from './types';

/**
 * Build an RRULE string from form state.
 * Supports optional recurrenceStart (for DTSTART), recurrenceInterval (INTERVAL), recurrenceUntil (UNTIL).
 * Returns '' when not recurring or no days selected.
 */
export function buildRecurrenceRule(
  start: Date,
  isRecurring: boolean,
  recurrenceDays: string[],
  recurrenceFreq: string,
  initialData?: { recurrenceRule?: string | null } | RecurringEntity,
  recurrenceStart?: Date,
  recurrenceUntil?: Date,
  recurrenceInterval?: number
): string {
  if (!isRecurring || !recurrenceDays || recurrenceDays.length === 0) {
    return '';
  }

  const dtstartDate = recurrenceStart || start;
  const dtstart = toIcalDtstart(dtstartDate);
  let rrule = `DTSTART:${dtstart}\nRRULE:FREQ=${recurrenceFreq.toUpperCase()};BYDAY=${recurrenceDays.join(',')}`;

  const interval = recurrenceInterval && recurrenceInterval > 1 ? recurrenceInterval : 1;
  if (interval > 1) {
    rrule += `;INTERVAL=${interval}`;
  }

  if (recurrenceUntil) {
    const u = recurrenceUntil;
    const y = u.getUTCFullYear();
    const m = String(u.getUTCMonth() + 1).padStart(2, '0');
    const d = String(u.getUTCDate()).padStart(2, '0');
    rrule += `;UNTIL=${y}${m}${d}`;
  }

  return rrule;
}
