import { safeRrulestr, extractExdates } from './parser';
import { computeEndDateTime, normalizeRuleString } from './utils';
import type { RecurringEntity } from './types';

/**
 * Generate occurrence dates for a recurrence rule within [rangeStart, rangeEnd].
 * Respects EXDATEs embedded in the rule (via rrule).
 * On parse failure: console.error (legacy), returns [].
 * This is the primary low-level expansion primitive.
 */
export function generateOccurrenceDates(
  recurrenceRule: string | null | undefined,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const normalized = normalizeRuleString(recurrenceRule);
  if (!normalized) return [];

  const rule = safeRrulestr(normalized);
  if (!rule) {
    return [];
  }

  try {
    return rule.between(rangeStart, rangeEnd, true);
  } catch (e) {
    console.error('Error expanding rrule between dates', e);
    return [];
  }
}

/**
 * Filter a list of dates against EXDATE lines (or a full rule containing them).
 * Provided for completeness and future non-rrule engines.
 * (generateOccurrenceDates already applies EXDATEs; this is a standalone filter.)
 */
export function applyExdates(
  dates: ReadonlyArray<Date>,
  exdateInput: string | string[] | null | undefined
): Date[] {
  if (!exdateInput) return [...dates];

  let exdateValues: string[] = [];
  if (typeof exdateInput === 'string') {
    exdateValues = extractExdates(exdateInput);
  } else if (Array.isArray(exdateInput)) {
    exdateValues = exdateInput
      .flatMap((item) => (typeof item === 'string' ? extractExdates(item) : []));
  }

  if (exdateValues.length === 0) return [...dates];

  // Normalize to compare only the date-time portion (ignore "EXDATE:" prefix)
  const exSet = new Set(
    exdateValues.map((line) =>
      line.replace(/^EXDATE:/i, '').trim().toUpperCase()
    )
  );

  return dates.filter((d) => {
    const ical = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return !exSet.has(ical.toUpperCase());
  });
}

/**
 * @deprecated PHASE 6: virtual expansion no longer used by list APIs or forms.
 * Real rows from DB (with recurrenceTemplateId) replace the need for this.
 * Kept only for any external/legacy callers; will be removed in future.
 *
 * Highest-level helper: expand a recurring entity (Activity or Responsibility)
 * into concrete instances for a date range.
 *
 * - If not recurring or no rule → returns a single normalized entry (lineage preserved or defaulted).
 * - Otherwise → one entry per generated date (end computed via duration).
 * - Preserves every other field + sets recurrence lineage defaults for generated occurrences
 *   (recurrenceTemplateId = master, generatedFromTemplateId = master, detachReason = 'none').
 * - Does NOT synthesize _inst_ ids (caller responsibility, per plan).
 */
export function expandRecurringActivity<T extends RecurringEntity>(
  entity: T,
  rangeStart?: Date,
  rangeEnd?: Date
): Array<T & { startDateTime: Date; endDateTime: Date }> {
  const start = entity.startDateTime instanceof Date
    ? entity.startDateTime
    : new Date(entity.startDateTime);

  const isRec = Boolean(entity.isRecurring && entity.recurrenceRule);

  if (!isRec) {
    const end = entity.endDateTime
      ? (entity.endDateTime instanceof Date ? entity.endDateTime : new Date(entity.endDateTime))
      : computeEndDateTime(start, entity.duration);
    return [
      {
        ...entity,
        startDateTime: start,
        endDateTime: end,
        // Preserve or default lineage fields for non-recurring / template rows
        recurrenceTemplateId: entity.recurrenceTemplateId ?? null,
        generatedFromTemplateId: entity.generatedFromTemplateId ?? null,
        detachReason: entity.detachReason ?? 'none',
      } as unknown as T & { startDateTime: Date; endDateTime: Date },
    ];
  }

  // Recurring path
  const defaultRangeStart = rangeStart ?? new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000);
  const defaultRangeEnd = rangeEnd ?? new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);

  const dates = generateOccurrenceDates(entity.recurrenceRule, defaultRangeStart, defaultRangeEnd);

  return dates.map((date) => {
    const end = computeEndDateTime(date, entity.duration);
    return {
      ...entity,
      startDateTime: date,
      endDateTime: end,
      // For synthetically generated occurrences from a template/master
      recurrenceTemplateId: entity.recurrenceTemplateId ?? entity.id,
      generatedFromTemplateId: entity.id,
      detachReason: 'none',
    } as unknown as T & { startDateTime: Date; endDateTime: Date };
  });
}
