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
    <div className="warning-banner p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
      <AlertTriangle size={20} className="text-yellow-500 mr-2" />
      <span className="text-yellow-800 text-sm">{message}</span>
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
    <div className="multi-user-select-container space-y-4">
      <div className="multi-user-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <label className="font-medium text-gray-700">{label}</label>
        </div>
        <span className="user-count-badge bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">{selectedNames.length}</span>
      </div>

      <div className="selected-users-list flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 border border-dashed border-gray-300 rounded-md">
        {selectedNames.length > 0 ? (
          selectedNames.map(name => (
            <div key={name} className="user-chip bg-primary/10 text-primary font-medium px-3 py-1 rounded-full flex items-center gap-2">
              <span className="chip-text">{name}</span>
              <button type="button" className="chip-remove text-primary hover:text-primary/80" onClick={() => removeUser(name)}>
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="no-users-placeholder text-gray-500 italic text-sm">No {label.toLowerCase()} assigned</div>
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
          formData.recurrenceUntil
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
    async (e: FormEvent) => {
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
        formData.recurrenceUntil
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
            try { errorData = text ? JSON.parse(text) : {}; } catch { }
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
        setConfirmAction(() => () => { });
      }
    });
  }, [isSeriesOccurrence, saveMode, formData.startDateTime, initialData, onActivityCreated]);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <>
      <form className="activity-form bg-white rounded-xl shadow-lg p-6 md:p-8 w-full max-w-xl mx-auto" onSubmit={handleSubmit}>
        <div className="form-header mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{isEditing ? 'Edit Activity' : 'New Activity'}</h2>
        </div>

        <OverlapWarningBanner message={overlapWarning} />

        <div className="form-row grid grid-cols-[3fr_1fr] gap-4 mb-6">
          <div className="form-group space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Tag size={16} className="text-primary" /> Activity Name
            </label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Project Sync-up"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="form-group space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Tag size={16} className="text-primary" /> Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-right-[12px] bg-center no-repeat"
            >
              {ACTIVITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section-divider flex items-center my-6">
          <span className="px-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">Organisers</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <div className="staff-related-list space-y-4">
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

        <div className="form-row grid grid-cols-[1fr_1fr] gap-4 mb-4">
          <div className="form-group space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Calendar size={16} className="text-primary" /> Activity start
            </label>
            <DatePicker
              selected={formData.startDateTime}
              onChange={(date: Date | null) =>
                date && setFormData({ ...formData, startDateTime: date })
              }
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholderText="Select start date and time"
            />
          </div>
          <div className="form-group space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Repeat size={16} className="text-primary" /> Duration (mins)
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="form-group space-y-2 mb-4">
          <label className="block text-sm font-medium text-gray-600">Activity end (Calculated)</label>
          <div className="read-only-field w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-600">
            {format(formData.endDateTime, 'MMMM d, yyyy h:mm aa')}
          </div>
        </div>

        <div className="form-group recurring-section space-y-3">
          <label className="checkbox-label flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            Enable Recurrence
          </label>

          {formData.isRecurring && (!isSeriesOccurrence || saveMode === 'all') && (
            <div className="recurring-options fade-in space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on specific days:</label>
              <DaySelector
                selectedDays={formData.recurrenceDays}
                onChange={(days) => setFormData({ ...formData, recurrenceDays: days })}
              />

              {/* New recurrence range fields (visible only for non-series recurrence) */}
              <div className="grid grid-cols-[1fr_1fr] gap-4">
                <div className="form-group space-y-1">
                  <label className="block text-xs font-medium text-gray-500">how many weeks recurrence?</label>
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="form-group space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Recurrence Start</label>
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholderText="Recurrence start"
                  />
                </div>
              </div>
              <div className="form-group space-y-1">
                <label className="block text-xs font-medium text-gray-500">Recur until</label>
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholderText="Recur until"
                />
              </div>
              {recurrenceWarning && (
                <div className="flex items-center gap-2 text-xs font-medium bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="text-yellow-500" />
                  {recurrenceWarning}
                </div>
              )}
            </div>
          )}
        </div>

        {isSeriesOccurrence && (
          <div className="edit-choice-container bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300 mb-6">
            <p className="text-sm font-medium text-gray-600 mb-3">
              This is part of a recurring series.
            </p>
            <div className="edit-choice-buttons flex gap-3">
              <button
                type="button"
                className={`nav-tab flex-1 items-center justify-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-all ${saveMode === 'this' ? 'bg-primary text-white' : ''}`}
                onClick={() => setSaveMode('this')}
              >
                This occurrence only
              </button>
              <button
                type="button"
                className={`nav-tab flex-1 items-center justify-center px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-all ${saveMode === 'all' ? 'bg-primary text-white' : ''}`}
                onClick={() => setSaveMode('all')}
              >
                All activities in series
              </button>
            </div>
          </div>
        )}

        {/* Detach Reason dropdown - only for lineage tracking (IDs are backend-only per spec) */}
        {(isSeriesOccurrence || formData.recurrenceTemplateId || formData.detachReason !== 'none') && (
          <div className="form-group space-y-1 mb-4">
            <label className="block text-sm font-medium text-gray-600">Detach Reason</label>
            <select
              value={formData.detachReason || 'none'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  detachReason: e.target.value as 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created',
                })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            >
              <option value="none">none (part of series)</option>
              <option value="edited">edited</option>
              <option value="cancelled">cancelled</option>
              <option value="rescheduled">rescheduled</option>
              <option value="manually_created">manually_created</option>
            </select>
            <small className="block text-xs font-medium text-gray-500 mt-1">
              System-tracked reason this occurrence was detached from its recurrence template.
            </small>
          </div>
        )}

        <div className="form-actions flex items-center justify-end gap-3 mt-6 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="orange-btn"
            >
              {/* <X size={18} className="text-gray-600" /> */}
              Cancel
            </button>
          )}
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="orange-btn"
            >
              {/* <Trash size={18} className="text-red-600" /> */}
              Delete
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
            {!isSubmitting}
          </button>
        </div>
      </form>

      {confirmAction && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setConfirmAction(null)}>
          <div className="modal-content bg-white rounded-xl shadow-xl w-full max-w-md p-6 md:p-8 relative" onClick={(e) => e.stopPropagation()}>
            <p className="mb-4 text-center text-gray-700">{confirmMessage}</p>
            <div className="flex justify-center gap-3">
              <button className="btn-secondary px-5 py-3 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-all" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button className="btn-primary px-5 py-3 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-all" onClick={() => { confirmAction(); setConfirmAction(null); }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}