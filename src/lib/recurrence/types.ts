// Use global Date everywhere. No import needed for the type.

export interface RecurringEntity {
  id: string;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
  recurrenceTemplateId?: string | null;
  generatedFromTemplateId?: string | null;
  detachReason?: 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created';
  startDateTime: string | Date;
  endDateTime?: string | Date;
  duration?: number;
  // All other fields (name, category, leaders, etc.) are preserved verbatim
  // The three recurrence lineage fields enable tracking of template vs. detached instances.
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
