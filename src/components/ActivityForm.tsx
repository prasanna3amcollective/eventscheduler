'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { addMinutes, differenceInMinutes, format } from 'date-fns';
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
  originalId?: string;
  name: string;
  leaders?: string[];
  guides?: string[];
  observers?: string[];
  startDateTime: string;
  endDateTime: string;
  duration: number;
  isRecurring: boolean;
  recurrenceRule?: string | null;
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
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date as an iCal DTSTART value, e.g. "20260605T090000Z".
 */
function toIcalDtstart(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Build an RRULE string from the form state.
 * Preserves any pre-existing EXDATE lines when editing a recurring instance.
 */
function buildRrule(
  start: Date,
  isRecurring: boolean,
  recurrenceDays: string[],
  recurrenceFreq: string,
  initialData?: ActivityData,
): string {
  if (!isRecurring || recurrenceDays.length === 0) return '';

  const dtstart = toIcalDtstart(start);
  let rrule = `DTSTART:${dtstart}\nRRULE:FREQ=${recurrenceFreq};BYDAY=${recurrenceDays.join(',')}`;

  // Preserve EXDATE lines from the original rule when editing
  if (initialData?.recurrenceRule?.includes('EXDATE')) {
    const exdates = initialData.recurrenceRule
      .split('\n')
      .filter((l) => l.startsWith('EXDATE'));
    if (exdates.length > 0) {
      rrule += '\n' + exdates.join('\n');
    }
  }

  return rrule;
}

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
  const isInstance = !!initialData?.originalId;

  const initialStartDate = initialData
    ? new Date(initialData.startDateTime)
    : new Date();
  const initialEndDate = initialData
    ? new Date(initialData.endDateTime)
    : addMinutes(new Date(), DEFAULT_DURATION_MINUTES);

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
    recurrenceFreq: 'WEEKLY',
    recurrenceDays:
      (initialData?.recurrenceRule?.split('BYDAY=')[1]?.split(',') as string[]) ?? [],
    category: initialData?.category ?? 'General',
  });

  // Available users for the typeahead dropdowns
  const [users, setUsers] = useState<User[]>([]);
  // Warning message when the activity overlaps with another
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 'this' for single occurrence, 'all' for entire recurring series
  const [saveMode, setSaveMode] = useState<'this' | 'all'>(
    isInstance ? 'this' : 'all',
  );
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');

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

  // Check for overlapping activities with the given time range
  const checkOverlap = useCallback(
    async (start: Date, end: Date) => {
      setOverlapWarning(null);
      try {
        const rruleStr = buildRrule(
          start,
          formData.isRecurring,
          formData.recurrenceDays,
          formData.recurrenceFreq,
          initialData,
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
          ? data.activities.filter(
              (e: ActivityData) =>
                e.id !== initialData.originalId && e.id !== initialData.id,
            )
          : data.activities;

        if (otherActivities.length > 0) {
          const names = (otherActivities as ActivityData[]).map((e) => e.name).join(', ');
          setOverlapWarning(`Warning: This schedule overlaps with: ${names}`);
        }
      } catch (e) {
        console.error('Failed to check overlap', e);
      }
    },
    [formData.isRecurring, formData.recurrenceDays, formData.recurrenceFreq, isEditing, initialData],
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

      const rruleStr = buildRrule(
        start,
        formData.isRecurring,
        formData.recurrenceDays,
        formData.recurrenceFreq,
        initialData,
      );

      const payload = {
        name: formData.name,
        leader: formData.leader,
        guide: formData.guide,
        observer: formData.observer,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        duration: formData.duration,
        isRecurring: formData.isRecurring,
        recurrenceRule: rruleStr,
        category: formData.category,
      };

      try {
        if (isInstance && saveMode === 'this') {
          // Create a non-recurring copy of this specific occurrence
          const createRes = await secureFetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, isRecurring: false, recurrenceRule: null }),
          });
          if (!createRes.ok) {
            const errorData = await createRes.json().catch(() => ({}));
            throw new Error(errorData.error || ERROR_SAVING_EVENT);
          }

          // Exclude this occurrence from the original series
          const exdate = toIcalDtstart(start);
          const newRRule = initialData!.recurrenceRule + '\n' + `EXDATE:${exdate}`;

          await fetch(`/api/activities/${initialData!.originalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...initialData!, recurrenceRule: newRRule }),
          });
        } else {
          const url = isEditing
            ? `/api/activities/${initialData!.originalId || initialData!.id}`
            : '/api/activities';
          const method = isEditing ? 'PUT' : 'POST';

          const res = await secureFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Save failed:', errorData);
            throw new Error(errorData.error || errorData.message || ERROR_SAVING_EVENT);
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
    [formData, isEditing, isInstance, saveMode, initialData, onActivityCreated],
  );

  /**
   * Deletes the current activity or excludes the current occurrence from a recurring series.
   * Prompts the user for confirmation before proceeding.
   */
  const handleDelete = useCallback(() => {
    const msg = `Are you sure you want to delete ${isInstance && saveMode === 'this' ? 'this specific occurrence' : 'the entire series'}?`;
    setConfirmMessage(msg);
    setConfirmAction(() => async () => {
      try {
        if (isInstance && saveMode === 'this') {
          const exdate = toIcalDtstart(formData.startDateTime);
          const newRRule = initialData!.recurrenceRule + '\n' + `EXDATE:${exdate}`;
          await secureFetch(`/api/activities/${initialData!.originalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...initialData!, recurrenceRule: newRRule }),
          });
        } else {
          await secureFetch(`/api/activities/${initialData!.originalId || initialData!.id}`, { method: 'DELETE' });
        }
        onActivityCreated();
      } catch (err) {
        console.error(err);
        setConfirmMessage(ERROR_DELETING_EVENT);
        setConfirmAction(() => () => {});
      }
    });
  }, [isInstance, saveMode, formData.startDateTime, initialData, onActivityCreated]);

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
            <Calendar size={16} /> Date & Time
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
        <label>End Time (Calculated)</label>
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

        {formData.isRecurring && !isInstance && (
          <div className="recurring-options fade-in" style={{ marginTop: '16px' }}>
            <label style={{ marginBottom: '8px' }}>Repeat on specific days:</label>
            <DaySelector
              selectedDays={formData.recurrenceDays}
              onChange={(days) => setFormData({ ...formData, recurrenceDays: days })}
            />
          </div>
        )}
      </div>

      {isInstance && (
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

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
          style={{ flex: 1 }}
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
              <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => { confirmAction(); setConfirmAction(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}