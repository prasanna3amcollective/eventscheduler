'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FormEvent } from 'react';

import { addMinutes, differenceInMinutes, format, addWeeks } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { secureFetch } from '@/lib/fetch';
import UserTypeahead from './UserTypeahead';
import {
  User as UserIcon,
  Users,
  Eye,
  CalendarFill as Calendar,
  Repeat,
  AlertTriangle,
  Tag,
  X as XIcon,
} from '@/components/Icons';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';
import {
  buildRecurrenceRule,
  parseRecurrenceForForm,
} from '@/lib/recurrence';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents a user in the system */
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

/** Shape of activity data used in the form */
interface ActivityData {
  id?: string;
  name: string;
  description?: string;
  leaders?: string[];
  guides?: string[];
  observers?: string[];
  startDateTime: string;
  endDateTime: string;
  duration: number;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  recurrenceTemplateId?: string | null;
  generatedFromTemplateId?: string | null;
  detachReason?: 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created';
  category?: string;
}

/** Props accepted by the activity form */
interface ActivityFormProps {
  /** Called after an activity is successfully created or updated */
  onActivityCreated: () => void;
  /** Pre-existing activity data when editing */
  initialData?: ActivityData;
  /** Called when the user cancels the form */
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 'SU' },
  { label: 'Mon', value: 'MO' },
  { label: 'Tue', value: 'TU' },
  { label: 'Wed', value: 'WE' },
  { label: 'Thu', value: 'TH' },
  { label: 'Fri', value: 'FR' },
  { label: 'Sat', value: 'SA' },
] as const;

const DEFAULT_DURATION_MINUTES = 60;

const ERROR_SAVING_EVENT = 'An error occurred while saving';
const ERROR_DELETING_EVENT = 'An error occurred';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Displays a warning banner when the new activity overlaps with existing ones */
function OverlapWarningBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="neo-warning-banner">
      <AlertTriangle size={16} />
      <span>{message}</span>
    </div>
  );
}

/**
 * Renders a row of day-of-week toggle buttons for recurrence selection.
 * @param selectedDays - Currently selected day codes (e.g. ['MO', 'WE'])
 * @param onChange - Called with the updated array when a day is toggled
 */
function DaySelector({
  selectedDays,
  onChange,
}: {
  selectedDays: string[];
  onChange: (days: string[]) => void;
}) {
  const toggleDay = useCallback(
    (value: string) => {
      const next = selectedDays.includes(value)
        ? selectedDays.filter((d) => d !== value)
        : [...selectedDays, value];
      onChange(next);
    },
    [selectedDays, onChange],
  );

  return (
    <div className="days-selector" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {DAYS_OF_WEEK.map((day) => (
        <button
          type="button"
          key={day.value}
          className={`neo-day-btn ${selectedDays.includes(day.value) ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            toggleDay(day.value);
          }}
        >
          {day.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Multi-select dropdown for assigning users to a role (Leader/Guide/Observer).
 * Supports searching through available users and removing selected ones.
 * @param label - Role label displayed as heading
 * @param users - Full list of available users
 * @param selectedNames - Currently selected user names
 * @param onChange - Called with updated names array when selection changes
 * @param icon - Icon displayed next to the label
 */
function MultiUserSelect({
  label,
  users,
  selectedNames,
  onChange,
  icon,
}: {
  label: string;
  users: User[];
  selectedNames: string[];
  onChange: (names: string[]) => void;
  icon: React.ReactNode;
}) {
  const [inputValue, setInputValue] = useState('');

  /** Add a user to the selection by name */
  const addUser = useCallback((name: string) => {
    if (name && !selectedNames.includes(name)) {
      onChange([...selectedNames, name]);
    }
    setInputValue('');
  }, [selectedNames, onChange]);

  /** Remove a user from the selection by name */
  const removeUser = useCallback((name: string) => {
    onChange(selectedNames.filter(n => n !== name));
  }, [selectedNames, onChange]);

  return (
    <div className="neo-multi-user">
      <div className="neo-multi-user-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          <span className="neo-label" style={{ marginBottom: 0 }}>{label}</span>
        </div>
        <span className="neo-user-count">{selectedNames.length}</span>
      </div>

      <div className="neo-selected-users">
        {selectedNames.length > 0 ? (
          selectedNames.map(name => (
            <div key={name} className="neo-user-chip">
              <span>{name}</span>
              <button type="button" className="neo-chip-remove" onClick={() => removeUser(name)}>
                <XIcon size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="neo-placeholder-text">No {label.toLowerCase()} assigned</div>
        )}
      </div>

      <div className="neo-user-typeahead">
        <UserTypeahead
          label=""
          value={inputValue}
          onChange={setInputValue}
          icon={null}
          users={users}
          placeholder={`Search to add ${label.toLowerCase()}...`}
          onSelect={(user: any) => addUser(user.name)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Form for creating a new activity or editing an existing one.
 * Handles activity metadata (name, category, date/time, duration, recurrence),
 * staff assignment (leaders/guides/observers), overlap detection, and submission.
 * Supports editing a single occurrence or an entire recurring series.
 */
export default function ActivityForm({ onActivityCreated, initialData, onCancel }: ActivityFormProps) {
  const isEditing = !!initialData?.id;
  console.log('templateId:', initialData?.recurrenceTemplateId);
  const isSeriesOccurrence = !!initialData?.recurrenceTemplateId &&
    (initialData?.detachReason ?? 'none') === 'none'; // real non-detached series occurrence (PHASE 6)

  const initialStartDate = initialData
    ? new Date(initialData.startDateTime)
    : new Date();
  const initialEndDate = initialData
    ? new Date(initialData.endDateTime)
    : addMinutes(new Date(), DEFAULT_DURATION_MINUTES);

  // Compute recurrence defaults (with support for parsed start/interval/until from rule)
  const parsedRecurrence = parseRecurrenceForForm(initialData?.recurrenceRule);
  const defaultRecStart = parsedRecurrence.recurrenceStart || initialStartDate;

  let initialWeeks: number | string = 4;
  let initialUntil: Date | null = null;

  if (isEditing || isSeriesOccurrence) {
    if (parsedRecurrence.recurrenceUntil) {
      initialUntil = parsedRecurrence.recurrenceUntil;
      const diffDays = Math.max(1, Math.round((initialUntil.getTime() - defaultRecStart.getTime()) / (1000 * 3600 * 24)));
      initialWeeks = Math.round(diffDays / 7);
    } else {
      initialUntil = null;
      initialWeeks = '';
    }
  } else {
    initialUntil = addWeeks(defaultRecStart, 4);
    initialWeeks = 4;
  }

  // Form state for all activity fields
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    leader: initialData?.leaders ?? [],
    guide: initialData?.guides ?? [],
    observer: initialData?.observers ?? [],
    startDateTime: initialStartDate,
    duration: initialData?.duration ?? DEFAULT_DURATION_MINUTES,
    endDateTime: initialEndDate,
    isRecurring: initialData?.isRecurring ?? false,
    recurrenceFreq: (parsedRecurrence.recurrenceFreq as any) || 'WEEKLY',
    recurrenceDays: parsedRecurrence.recurrenceDays,
    recurrenceStart: defaultRecStart,
    recurrenceUntil: initialUntil,
    recurrenceWeeks: initialWeeks,
    category: initialData?.category ?? 'General',
    // Lineage fields (backend-managed for IDs; detachReason may be shown/edited)
    recurrenceTemplateId: initialData?.recurrenceTemplateId ?? null,
    generatedFromTemplateId: initialData?.generatedFromTemplateId ?? null,
    detachReason: initialData?.detachReason ?? 'none',
  });

  // Available users for the typeahead dropdowns
  const [users, setUsers] = useState<User[]>([]);
  // Warning message when the activity overlaps with another
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 'this' for single occurrence, 'all' for entire recurring series
  const [saveMode, setSaveMode] = useState<'this' | 'all'>(
    isSeriesOccurrence ? 'this' : 'all',
  );
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [recurrenceWarning, setRecurrenceWarning] = useState<string | null>(null);
  const [weeksError, setWeeksError] = useState<string | null>(null);

  // Guard so we fetch the authoritative template data only once on mount for series 'all' edits
  const hasLoadedTemplateRef = useRef(false);

  // Fetch users for the typeahead dropdowns on mount
  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data: User[] = await res.json();
          if (!cancelled) setUsers(data);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  // For series occurrences in 'all' mode, fetch the live RecurrenceTemplate so that
  // recurrenceDays/freq + the three range fields (start/until/weeks) come from the
  // authoritative rule + startDate/endDate instead of stale child-derived defaults.
  useEffect(() => {
    if (hasLoadedTemplateRef.current) return;
    if (!isSeriesOccurrence || !initialData?.recurrenceTemplateId) return;
    hasLoadedTemplateRef.current = true;

    const tplId = initialData.recurrenceTemplateId;
    fetch(`/api/recurrence-templates/${tplId}`)
      .then((r) => r.json())
      .then((tpl) => {
        if (tpl && tpl.recurrenceRule) {
          const p = parseRecurrenceForForm(tpl.recurrenceRule);
          setFormData((prev) => {
            const tplStart = p.recurrenceStart || (tpl.startDate ? new Date(tpl.startDate) : prev.recurrenceStart);
            const tplUntil = p.recurrenceUntil || (tpl.endDate ? new Date(tpl.endDate) : null);
            let tplWeeks: number | string = '';
            if (tplUntil) {
              const diffDays = Math.max(1, Math.round((tplUntil.getTime() - tplStart.getTime()) / (1000 * 3600 * 24)));
              tplWeeks = Math.max(1, Math.round(diffDays / 7));
            }

            return {
              ...prev,
              recurrenceDays: p.recurrenceDays.length ? p.recurrenceDays : prev.recurrenceDays,
              recurrenceFreq: p.recurrenceFreq || prev.recurrenceFreq,
              recurrenceStart: tplStart,
              recurrenceUntil: tplUntil,
              recurrenceWeeks: tplWeeks,
            };
          });
        }
      })
      .catch((err) => console.error('Failed to load series template for edit-all:', err));
  }, [isSeriesOccurrence, initialData]);

  // Check for overlapping activities with the given time range
  const checkOverlap = useCallback(
    async (start: Date, end: Date) => {
      setOverlapWarning(null);
      try {
        const rruleStr = buildRecurrenceRule(
          start,
          formData.isRecurring,
          formData.recurrenceDays,
          formData.recurrenceFreq,
          initialData,
          formData.recurrenceStart,
          formData.recurrenceUntil ?? undefined
        );

        const res = await secureFetch('/api/activities/check-overlap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            duration: differenceInMinutes(end, start),
            isRecurring: formData.isRecurring,
            recurrenceRule: rruleStr,
          }),
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.overlap) return;

        const otherActivities = isEditing
          ? data.activities.filter((e: ActivityData) => e.id !== initialData.id)
          : data.activities;

        if (otherActivities.length > 0) {
          const names = (otherActivities as ActivityData[]).map((e) => e.name).join(', ');
          setOverlapWarning(`Warning: This schedule overlaps with: ${names}`);
        }
      } catch (e) {
        console.error('Failed to check overlap', e);
      }
    },
    [formData.isRecurring, formData.recurrenceDays, formData.recurrenceFreq, formData.recurrenceStart, formData.recurrenceUntil, formData.recurrenceWeeks, isEditing, initialData],
  );

  // Auto-select the day of week matching the start date when recurrence is enabled
  useEffect(() => {
    if (formData.startDateTime && formData.recurrenceDays.length === 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const day = dayMap[formData.startDateTime.getDay()];
      setFormData((prev) => ({ ...prev, recurrenceDays: [day] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.startDateTime]);

  // Sync end time from start + duration; also trigger overlap check
  useEffect(() => {
    if (formData.startDateTime && formData.duration > 0) {
      const end = addMinutes(formData.startDateTime, formData.duration);
      setFormData((prev) => {
        if (prev.endDateTime.getTime() === end.getTime()) return prev;
        return { ...prev, endDateTime: end };
      });
      checkOverlap(formData.startDateTime, end);
    }
  }, [formData.startDateTime, formData.duration, checkOverlap]);

  // ── Handlers ───────────────────────────────────────────────────────────

  /**
   * Submits the form to create or update an activity.
   * For recurring instances edited with "this only", creates a new non-recurring copy
   * and excludes the current occurrence from the original series.
   */
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!formData.leader || formData.leader.length === 0) {
        alert("At least one Leader is required.");
        return;
      }

      setIsSubmitting(true);

      const start = formData.startDateTime;
      const end = formData.endDateTime;

      const rruleStr = buildRecurrenceRule(
        start,
        formData.isRecurring,
        formData.recurrenceDays,
        formData.recurrenceFreq,
        initialData,
        formData.recurrenceStart,
        formData.recurrenceUntil ?? undefined
      );

      const payload: any = {
        name: formData.name,
        description: formData.description,
        leader: formData.leader,
        guide: formData.guide,
        observer: formData.observer,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        duration: formData.duration,
        category: formData.category,
        isRecurring: formData.isRecurring,
        recurrenceRule: rruleStr,
        recurrenceStart: formData.recurrenceStart?.toISOString?.() ?? null,
        recurrenceUntil: formData.recurrenceUntil?.toISOString?.() ?? null,
        recurrenceWeeks: formData.recurrenceWeeks === '' ? null : Number(formData.recurrenceWeeks),
        // Lineage fields (backend-managed for IDs; detachReason may be shown/edited)
        recurrenceTemplateId: saveMode === 'all' ? null : formData.recurrenceTemplateId,
        generatedFromTemplateId: saveMode === 'all' ? null : formData.generatedFromTemplateId,
        detachReason: formData.detachReason,
      };

      try {
        if (isSeriesOccurrence && saveMode === 'this') {
          // PHASE 6 "this only": PUT the real persisted row, mark as edited (no EXDATE, no new row)
          const url = `/api/activities/${initialData!.id}`;
          const method = 'PUT';
          const thisOnlyPayload = {
            ...payload,
            description: formData.description,
            isRecurring: false,
            recurrenceRule: null,
            detachReason: 'edited',
            recurrenceTemplateId: initialData!.recurrenceTemplateId,
            generatedFromTemplateId: initialData!.generatedFromTemplateId,
          };
          const res = await secureFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(thisOnlyPayload),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            let errorData: any = {};
            try { errorData = text ? JSON.parse(text) : {}; } catch { }
            console.error(`Save failed (this-only): HTTP ${res.status}`);
            throw new Error(errorData.error || `Save failed (HTTP ${res.status})`);
          }
        } else if (isSeriesOccurrence && saveMode === 'all') {
          // "All in series": update via RecurrenceTemplate endpoint + reconcile.
          const templateUpdate: any = {}; // diff payload for series update
          // Compute diff instead of sending all fields to avoid poisoning the reconciliation process
          if (formData.detachReason && formData.detachReason !== 'none') {
            templateUpdate.detachReason = formData.detachReason;
          }

          if (formData.name !== (initialData!.name || '')) templateUpdate.name = formData.name;
          if (formData.duration !== initialData!.duration) templateUpdate.duration = formData.duration;
          if (formData.category !== (initialData!.category || 'General')) templateUpdate.category = formData.category;

          if (rruleStr !== (initialData!.recurrenceRule || '')) templateUpdate.recurrenceRule = rruleStr;

          const newStartIso = formData.recurrenceStart?.toISOString();
          const initialStartIso = parsedRecurrence.recurrenceStart?.toISOString();
          if (newStartIso !== initialStartIso) templateUpdate.startDate = newStartIso ?? undefined;

          const newUntilIso = formData.recurrenceUntil?.toISOString() ?? null;
          const initialUntilIso = parsedRecurrence.recurrenceUntil?.toISOString() ?? null;
          if (newUntilIso !== initialUntilIso) templateUpdate.endDate = newUntilIso;

          if (Object.keys(templateUpdate).length === 0) {
            onActivityCreated();
            setIsSubmitting(false);
            return;
          }
          const url = `/api/recurrence-templates/${initialData!.recurrenceTemplateId}`;
          const method = 'PUT';
          const res = await secureFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templateUpdate),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            let errorData: any = {};
            try { errorData = text ? JSON.parse(text) : {}; } catch { }
            console.error(`Save failed (series): HTTP ${res.status}`);
            throw new Error(errorData.error || `Save failed (HTTP ${res.status})`);
          }
        } else {
          // Normal create or edit of non-series (or already-detached) item
          const url = isEditing
            ? `/api/activities/${initialData!.id}`
            : '/api/activities';
          const method = isEditing ? 'PUT' : 'POST';

          const res = await secureFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            let errorData: any = {};
            try { errorData = text ? JSON.parse(text) : {}; } catch { }
            console.error(`Save failed: HTTP ${res.status}`);
            throw new Error(errorData.error || `Save failed (HTTP ${res.status})`);
          }
        }

        onActivityCreated();
        setIsSubmitting(false);
      } catch (err) {
        console.error(err);
        setConfirmMessage(err instanceof Error ? err.message : ERROR_SAVING_EVENT);
        setConfirmAction(() => () => { });
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, isSeriesOccurrence, saveMode, initialData, onActivityCreated],
  );

  /**
   * Archives the current activity (sets detachReason to 'cancelled').
   */
  const handleArchive = useCallback(() => {
    const isThisOnly = isSeriesOccurrence && saveMode === 'this';
    // Ensure we have a recurrenceTemplateId when archiving the whole series
    let templateId = initialData?.recurrenceTemplateId ?? formData.recurrenceTemplateId;

    setConfirmMessage(`Are you sure you want to archive ${isThisOnly ? 'this specific occurrence' : (isSeriesOccurrence && saveMode === 'all' ? 'the entire series' : 'this activity')}?`);
    setConfirmAction(() => async () => {
      try {
        if (isSeriesOccurrence && saveMode === 'all') {
          // Attempt to fetch the template ID if not available
          if (!templateId) {
            try {
              const res = await secureFetch(`/api/activities/${initialData?.id}`, { method: 'GET' });
              if (res.ok) {
                const activity = await res.json();
                templateId = activity.recurrenceTemplateId;
              }
            } catch (e) {
              console.error('Failed to fetch recurrenceTemplateId', e);
            }
          }

          // Delete/Archive the entire template using PUT to set status to archived
          if (!templateId) {
            setConfirmMessage('Unable to archive: missing recurrence template ID.');
            setConfirmAction(() => () => { });
            return;
          }
          const res = await secureFetch(`/api/recurrence-templates/${templateId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'archived' }),
          });
          if (!res.ok) {
            let errMsg = 'Failed to archive template';
            try {
              const errorData = await res.json();
              errMsg = errorData.error || errMsg;
            } catch { }
            throw new Error(errMsg);
          }
        } else {
          // Archive a single occurrence or non-recurring activity
          const archivePayload: Record<string, unknown> = {
            name: formData.name,
            leader: formData.leader,
            guide: formData.guide,
            observer: formData.observer,
            startDateTime: formData.startDateTime.toISOString(),
            endDateTime: formData.endDateTime.toISOString(),
            duration: formData.duration,
            isRecurring: false,
            recurrenceRule: null,
            recurrenceStart: null,
            recurrenceUntil: null,
            recurrenceWeeks: null,
            category: formData.category,
            // Only include recurrenceTemplateId if it exists
            ...(initialData?.recurrenceTemplateId ?? formData.recurrenceTemplateId ? {
              recurrenceTemplateId: initialData?.recurrenceTemplateId ?? formData.recurrenceTemplateId,
            } : {}),
            generatedFromTemplateId: initialData?.generatedFromTemplateId ?? formData.generatedFromTemplateId,
            detachReason: 'cancelled',
          };

          const res = await secureFetch(`/api/activities/${initialData!.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(archivePayload),
          });
          if (!res.ok) {
            let errMsg = 'Failed to archive activity';
            try {
              const errorData = await res.json();
              errMsg = errorData.error || errMsg;
            } catch { }
            throw new Error(errMsg);
          }
        }
        onActivityCreated();
      } catch (err) {
        console.error(err);
        setConfirmMessage(err instanceof Error ? err.message : 'Failed to archive. Please try again.');
        setConfirmAction(() => () => { });
      }
    });
  }, [isSeriesOccurrence, saveMode, formData, initialData, onActivityCreated]);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <form className="neo-form w-full mx-auto" onSubmit={handleSubmit}>
        <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: '28px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
            {isEditing ? 'Edit Activity' : 'New Activity'}
          </h2>
          {/* {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              aria-label="Close"
            >
              <X size={24} />
            </button>
          )} */}
        </div>

        <OverlapWarningBanner message={overlapWarning} />

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group">
            <label className="neo-label">
              <Tag size={14} /> Activity Name
            </label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Project Sync-up"
              className="neo-input"
            />
            {/* Description textarea */}
            <label className="neo-label" style={{ marginTop: '12px' }}>
              <Tag size={14} /> Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about the activity..."
              maxLength={1000}
              className="neo-input"
              style={{ height: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="neo-label">
              <Tag size={14} /> Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="neo-select"
            >
              {ACTIVITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="neo-section-divider">
          <span>Organisers</span>
          <div></div>
        </div>

        <div className="staff-related-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--hover-color)', padding: '20px', borderRadius: '0', border: '3px solid #000000', marginBottom: '24px', boxShadow: '4px 4px 0 #000000' }}>
          <MultiUserSelect
            label="Leaders"
            selectedNames={formData.leader}
            onChange={(names) => setFormData({ ...formData, leader: names })}
            icon={<UserIcon size={16} className="text-primary" />}
            users={users}
          />
          <MultiUserSelect
            label="Guides"
            selectedNames={formData.guide}
            onChange={(names) => setFormData({ ...formData, guide: names })}
            icon={<Users size={16} className="text-primary" />}
            users={users}
          />
          <MultiUserSelect
            label="Observers"
            selectedNames={formData.observer}
            onChange={(names) => setFormData({ ...formData, observer: names })}
            icon={<Eye size={16} className="text-primary" />}
            users={users}
          />
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="neo-label">
              <Calendar size={14} /> Activity start
            </label>
            <DatePicker
              selected={formData.startDateTime}
              onChange={(date: Date | null) =>
                date && setFormData({ ...formData, startDateTime: date })
              }
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="neo-input"
              placeholderText="Select start date and time"
            />
          </div>
          <div className="form-group">
            <label className="neo-label">
              <Repeat size={14} /> Duration (mins)
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              className="neo-input"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="neo-label">Activity end (Calculated)</label>
          <div className="neo-readonly-field">
            {format(formData.endDateTime, 'MMMM d, yyyy h:mm aa')}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="neo-checkbox-label">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
            />
            Enable Recurrence
          </label>

          {formData.isRecurring && (!isSeriesOccurrence || saveMode === 'all') && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="neo-label" style={{ marginBottom: '4px' }}>Repeat on specific days:</label>
              <DaySelector
                selectedDays={formData.recurrenceDays}
                onChange={(days) => setFormData({ ...formData, recurrenceDays: days })}
              />

              {/* New recurrence range fields (visible only for non-series recurrence) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="neo-label">Weeks recurrence</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    step="1"
                    value={formData.recurrenceWeeks === '' ? '' : formData.recurrenceWeeks}
                    onChange={(e) => {
                      if (e.target.value === '') {
                        setFormData((prev) => ({ ...prev, recurrenceWeeks: '', recurrenceUntil: null }));
                        setWeeksError(null);
                        return;
                      }
                      const raw = parseInt(e.target.value) || 1;
                      const w = Math.min(52, Math.max(1, raw));
                      const newUntil = addWeeks(formData.recurrenceStart, w);
                      setFormData((prev) => ({ ...prev, recurrenceWeeks: w, recurrenceUntil: newUntil }));
                      setWeeksError(w >= 52 ? 'You can plan only up to 52 weeks ahead.' : null);
                    }}
                    className="neo-input"
                  />
                  {weeksError && (
                    <div style={{ color: 'var(--error-color, #e53935)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} />
                      <span>{weeksError}</span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="neo-label">Recurrence Start</label>
                  <DatePicker
                    selected={formData.recurrenceStart}
                    onChange={(date: Date | null) => {
                      if (!date) return;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const d0 = new Date(date);
                      d0.setHours(0, 0, 0, 0);
                      if (d0.getTime() < today.getTime()) {
                        setRecurrenceWarning('Recurrence start is in the past');
                      } else {
                        setRecurrenceWarning(null);
                      }
                      const w = Number(formData.recurrenceWeeks) || 1;
                      const newU = addWeeks(date, w);
                      setFormData((prev) => ({ ...prev, recurrenceStart: date, recurrenceUntil: newU }));
                    }}
                    showTimeSelect
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="neo-input"
                    placeholderText="Recurrence start"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="neo-label">Recur until</label>
                <DatePicker
                  selected={formData.recurrenceUntil}
                  onChange={(date: Date | null) => {
                    if (!date) return;
                    const start = formData.recurrenceStart;
                    const diffDays = Math.max(7, Math.round((date.getTime() - start.getTime()) / (1000 * 3600 * 24)));
                    const w = Math.min(52, Math.max(1, Math.round(diffDays / 7)));
                    const cappedUntil = addWeeks(start, w);
                    setFormData((prev) => ({ ...prev, recurrenceUntil: cappedUntil, recurrenceWeeks: w }));
                    setWeeksError(w >= 52 ? 'You can plan only up to 52 weeks ahead.' : null);
                  }}
                  showTimeSelect
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="neo-input"
                  placeholderText="Recur until"
                />
              </div>
              {recurrenceWarning && (
                <div className="neo-warning-banner">
                  <AlertTriangle size={14} />
                  <span>{recurrenceWarning}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {isSeriesOccurrence && (
          <div className="neo-series-choice">
            <p>This is part of a recurring series.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`neo-choice-btn ${saveMode === 'this' ? 'neo-choice-btn-active' : ''}`}
                onClick={() => setSaveMode('this')}
              >
                This occurrence only
              </button>
              <button
                type="button"
                className={`neo-choice-btn ${saveMode === 'all' ? 'neo-choice-btn-active' : ''}`}
                onClick={() => setSaveMode('all')}
              >
                All activities in series
              </button>
            </div>
          </div>
        )}

        {/* Detach Reason dropdown - only for lineage tracking (IDs are backend-only per spec) */}
        {!isEditing && (isSeriesOccurrence || formData.recurrenceTemplateId || formData.detachReason !== 'none') && (
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="neo-label">Detach Reason</label>
            <select
              value={formData.detachReason || 'none'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  detachReason: e.target.value as 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created',
                })
              }
              className="neo-select"
            >
              <option value="none" disabled={!!initialData?.detachReason && initialData.detachReason !== 'none'}>none (part of series)</option>
              <option value="edited">edited</option>
              <option value="cancelled">cancelled</option>
              <option value="rescheduled">rescheduled</option>
              <option value="manually_created">manually_created</option>
            </select>
            <div style={{ fontFamily: 'var(--mono-font)', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              System-tracked reason this occurrence was detached from its recurrence template.
            </div>
          </div>
        )}

        <div className="neo-form-actions">
          {isEditing && (
            <button
              type="button"
              onClick={handleArchive}
              className="orange-btn"
            >
              Archive
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="yellow-btn">
            {isSubmitting
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Confirm Schedule'}
          </button>
        </div>
      </form>

      {confirmAction && (
        <div className="neo-confirm-overlay" onClick={() => setConfirmAction(null)}>
          <div className="neo-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p>{confirmMessage}</p>
            <div className="neo-confirm-actions">
              <button className="btn-secondary-brutal" style={{ background: 'transparent !important', backgroundColor: 'transparent !important', color: 'var(--text-primary) !important' } as React.CSSProperties} onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button className="yellow-btn" style={{ margin: 0 }} onClick={() => { confirmAction(); setConfirmAction(null); }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}