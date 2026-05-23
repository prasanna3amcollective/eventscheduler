'use client';

import { useState, useEffect, useRef, type FormEvent, useCallback } from 'react';
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
  Clock,
  Repeat,
  AlertTriangle,
  Check,
  Trash,
  Tag,
  X,
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
    <div className="warning-banner">
      <AlertTriangle size={20} />
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
    <div className="days-selector">
      {DAYS_OF_WEEK.map((day) => (
        <button
          type="button"
          key={day.value}
          className={`day-btn ${selectedDays.includes(day.value) ? 'active' : ''}`}
          onClick={() => toggleDay(day.value)}
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
    <div className="multi-user-select-container">
      <div className="multi-user-header">
        <label>{icon} {label}</label>
        <span className="user-count-badge">{selectedNames.length}</span>
      </div>

      <div className="selected-users-list">
        {selectedNames.length > 0 ? (
          selectedNames.map(name => (
            <div key={name} className="user-chip fade-in">
              <span className="chip-text">{name}</span>
              <button type="button" className="chip-remove" onClick={() => removeUser(name)}>
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="no-users-placeholder">No {label.toLowerCase()}s assigned</div>
        )}
      </div>

      <div className="add-user-trigger">
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
  const defaultRecWeeks = parsedRecurrence.recurrenceInterval || 4;
  const defaultRecUntil = parsedRecurrence.recurrenceUntil || addWeeks(defaultRecStart, defaultRecWeeks);

  // Form state for all activity fields
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
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
    recurrenceUntil: defaultRecUntil,
    recurrenceWeeks: defaultRecWeeks,
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
          setFormData((prev) => ({
            ...prev,
            recurrenceDays: p.recurrenceDays.length ? p.recurrenceDays : prev.recurrenceDays,
            recurrenceFreq: p.recurrenceFreq || prev.recurrenceFreq,
            recurrenceStart: p.recurrenceStart || (tpl.startDate ? new Date(tpl.startDate) : prev.recurrenceStart),
            recurrenceUntil: p.recurrenceUntil || (tpl.endDate ? new Date(tpl.endDate) : prev.recurrenceUntil),
            recurrenceWeeks: p.recurrenceInterval || prev.recurrenceWeeks,
          }));
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
          formData.recurrenceUntil,
          formData.recurrenceWeeks,
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
  }, [formData.startDateTime, formData.recurrenceDays]);

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
    async (e: FormEvent) => {
      e.preventDefault();
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
        formData.recurrenceUntil,
        formData.recurrenceWeeks,
      );

      const payload: any = {
        name: formData.name,
        leader: formData.leader,
        guide: formData.guide,
        observer: formData.observer,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        duration: formData.duration,
        isRecurring: formData.isRecurring,
        recurrenceRule: rruleStr,
        recurrenceStart: formData.recurrenceStart?.toISOString?.() ?? null,
        recurrenceUntil: formData.recurrenceUntil?.toISOString?.() ?? null,
        recurrenceWeeks: formData.recurrenceWeeks,
        category: formData.category,
        // When editing entire series, clear per-occurrence lineage (legacy master path); real series 'all' goes to template endpoint instead.
        recurrenceTemplateId: saveMode === 'all' ? null : formData.recurrenceTemplateId,
        generatedFromTemplateId: saveMode === 'all' ? null : formData.generatedFromTemplateId,
        detachReason: saveMode === 'all' ? 'none' : formData.detachReason,
      };

      try {
        if (isSeriesOccurrence && saveMode === 'this') {
          // PHASE 6 "this only": PUT the real persisted row, mark as edited (no EXDATE, no new row)
          const url = `/api/activities/${initialData!.id}`;
          const method = 'PUT';
          const thisOnlyPayload = {
            ...payload,
            isRecurring: false,
            recurrenceRule: null,
            detachReason: 'edited' as const,
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
            try { errorData = text ? JSON.parse(text) : {}; } catch {}
            console.error(`Save failed (this-only): HTTP ${res.status}`);
            throw new Error(errorData.error || `Save failed (HTTP ${res.status})`);
          }
        } else if (isSeriesOccurrence && saveMode === 'all') {
          // "All in series": update via RecurrenceTemplate endpoint + reconcile.
          // Send a minimal template-shaped payload (with startDate/endDate derived from the recurrence range fields)
          // so that changes to Recurrence Start / Recur Until are persisted to the template row (and used for horizon capping).
          const templateUpdate = {
            recurrenceRule: rruleStr,
            name: formData.name,
            duration: formData.duration,
            category: formData.category,
            startDate: formData.recurrenceStart?.toISOString?.() ?? undefined,
            endDate: formData.recurrenceUntil?.toISOString?.() ?? null,
          };
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
            try { errorData = text ? JSON.parse(text) : {}; } catch {}
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
            try { errorData = text ? JSON.parse(text) : {}; } catch {}
            console.error(`Save failed: HTTP ${res.status}`);
            throw new Error(errorData.error || `Save failed (HTTP ${res.status})`);
          }
        }

        onActivityCreated();
        setIsSubmitting(false);
      } catch (err) {
        console.error(err);
        setConfirmMessage(err instanceof Error ? err.message : ERROR_SAVING_EVENT);
        setConfirmAction(() => () => {});
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, isSeriesOccurrence, saveMode, initialData, onActivityCreated],
  );

  /**
   * Deletes the current activity or excludes the current occurrence from a recurring series.
   * Prompts the user for confirmation before proceeding.
   */
  const handleDelete = useCallback(() => {
    const isThisOnly = isSeriesOccurrence && saveMode === 'this';
    const msg = `Are you sure you want to delete ${isThisOnly ? 'this specific occurrence' : 'the entire series'}?`;
    setConfirmMessage(msg);
    setConfirmAction(() => async () => {
      try {
        if (isSeriesOccurrence && saveMode === 'this') {
          // Real "this" delete: mark the row cancelled (history preserved)
          await secureFetch(`/api/activities/${initialData!.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...initialData!, detachReason: 'cancelled' }),
          });
        } else if (isSeriesOccurrence && saveMode === 'all') {
          await secureFetch(`/api/recurrence-templates/${initialData!.recurrenceTemplateId}`, { method: 'DELETE' });
        } else {
          await secureFetch(`/api/activities/${initialData!.id}`, { method: 'DELETE' });
        }
        onActivityCreated();
      } catch (err) {
        console.error(err);
        setConfirmMessage(ERROR_DELETING_EVENT);
        setConfirmAction(() => () => {});
      }
    });
  }, [isSeriesOccurrence, saveMode, formData.startDateTime, initialData, onActivityCreated]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
    <form className="activity-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{isEditing ? 'Edit Activity' : 'New Activity'}</h2>
      </div>

      <OverlapWarningBanner message={overlapWarning} />

      <div className="form-row" style={{ gridTemplateColumns: '3fr 1fr' }}>
        <div className="form-group">
          <label>
            <Tag size={16} /> Activity Name
          </label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Project Sync-up"
          />
        </div>

        <div className="form-group">
          <label>
            <Tag size={16} /> Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="premium-select"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            {ACTIVITY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-section-divider">
        <span>Participants & Staff</span>
      </div>

      <div className="staff-related-list">
        <MultiUserSelect
          label="Leaders"
          selectedNames={formData.leader}
          onChange={(names) => setFormData({ ...formData, leader: names })}
          icon={<UserIcon size={16} />}
          users={users}
        />
        <MultiUserSelect
          label="Guides"
          selectedNames={formData.guide}
          onChange={(names) => setFormData({ ...formData, guide: names })}
          icon={<Users size={16} />}
          users={users}
        />
        <MultiUserSelect
          label="Observers"
          selectedNames={formData.observer}
          onChange={(names) => setFormData({ ...formData, observer: names })}
          icon={<Eye size={16} />}
          users={users}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>
            <Calendar size={16} /> Activity start
          </label>
          <DatePicker
            selected={formData.startDateTime}
            onChange={(date: Date | null) =>
              date && setFormData({ ...formData, startDateTime: date })
            }
            showTimeSelect
            dateFormat="MMMM d, yyyy h:mm aa"
            className="premium-datepicker"
            placeholderText="Select start date and time"
          />
        </div>
        <div className="form-group">
          <label>
            <Repeat size={16} /> Duration (mins)
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
          />
        </div>
      </div>

      <div className="form-group">
        <label>Activity end (Calculated)</label>
        <div className="read-only-field">
          {format(formData.endDateTime, 'MMMM d, yyyy h:mm aa')}
        </div>
      </div>

      <div className="form-group recurring-section">
        <label className="checkbox-label">
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
          <div className="recurring-options fade-in" style={{ marginTop: '16px' }}>
            <label style={{ marginBottom: '8px' }}>Repeat on specific days:</label>
            <DaySelector
              selectedDays={formData.recurrenceDays}
              onChange={(days) => setFormData({ ...formData, recurrenceDays: days })}
            />

            {/* New recurrence range fields (visible only for non-series recurrence) */}
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px' }}>how many weeks recurrence?</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.recurrenceWeeks}
                  onChange={(e) => {
                    const w = Math.max(1, parseInt(e.target.value) || 1);
                    const newUntil = addWeeks(formData.recurrenceStart, w);
                    setFormData((prev) => ({ ...prev, recurrenceWeeks: w, recurrenceUntil: newUntil }));
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '13px' }}>Recurrence Start</label>
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
                    const w = formData.recurrenceWeeks || 1;
                    const newU = addWeeks(date, w);
                    setFormData((prev) => ({ ...prev, recurrenceStart: date, recurrenceUntil: newU }));
                  }}
                  showTimeSelect
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="premium-datepicker"
                  placeholderText="Recurrence start"
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '13px' }}>Recur until</label>
              <DatePicker
                selected={formData.recurrenceUntil}
                onChange={(date: Date | null) => {
                  if (!date) return;
                  const start = formData.recurrenceStart;
                  const diffDays = Math.max(7, Math.round((date.getTime() - start.getTime()) / (1000 * 3600 * 24)));
                  const w = Math.max(1, Math.round(diffDays / 7));
                  setFormData((prev) => ({ ...prev, recurrenceUntil: date, recurrenceWeeks: w }));
                }}
                showTimeSelect
                dateFormat="MMM d, yyyy h:mm aa"
                className="premium-datepicker"
                placeholderText="Recur until"
              />
            </div>
            {recurrenceWarning && (
              <div style={{ color: '#d97706', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> {recurrenceWarning}
              </div>
            )}
          </div>
        )}
      </div>

      {isSeriesOccurrence && (
        <div className="edit-choice-container">
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            This is part of a recurring series.
          </p>
          <div className="edit-choice-buttons">
            <button
              type="button"
              className={`nav-tab ${saveMode === 'this' ? 'active' : ''}`}
              onClick={() => setSaveMode('this')}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              This occurrence only
            </button>
            <button
              type="button"
              className={`nav-tab ${saveMode === 'all' ? 'active' : ''}`}
              onClick={() => setSaveMode('all')}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              All activities in series
            </button>
           </div>
         </div>
       )}

      {/* Detach Reason dropdown - only for lineage tracking (IDs are backend-only per spec) */}
      {(isSeriesOccurrence || formData.recurrenceTemplateId || formData.detachReason !== 'none') && (
        <div className="form-group" style={{ marginTop: '12px' }}>
          <label htmlFor="detach-reason">Detach Reason</label>
          <select
            id="detach-reason"
            value={formData.detachReason || 'none'}
            onChange={(e) =>
              setFormData({
                ...formData,
                detachReason: e.target.value as 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created',
              })
            }
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
          >
            <option value="none">none (part of series)</option>
            <option value="edited">edited</option>
            <option value="cancelled">cancelled</option>
            <option value="rescheduled">rescheduled</option>
            <option value="manually_created">manually_created</option>
          </select>
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            System-tracked reason this occurrence was detached from its recurrence template.
          </small>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Save Changes'
              : 'Confirm Schedule'}
          {!isSubmitting && <Check size={18} />}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger"
          >
            <Trash size={18} />
          </button>
        )}
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          style={{ marginTop: '12px' }}
        >
          <X size={18} />
          Cancel
        </button>
      )}
    </form>

      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ marginBottom: '20px', fontWeight: 500 }}>{confirmMessage}</p>
            <div className="flex justify-center gap-3">
              <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => { confirmAction(); setConfirmAction(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}