// Use global Date everywhere. No import needed for the type.

export interface RecurringEntity {
  id: string;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
  startDateTime: string | Date;
  endDateTime?: string | Date;
  duration?: number;
  // All other fields (name, category, leaders, etc.) are preserved verbatim
}

export interface ParsedRecurrence {
  recurrenceDays: string[];
  recurrenceFreq: string;
  hasExdates: boolean;
  exdateCount: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
