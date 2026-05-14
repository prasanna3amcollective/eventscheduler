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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  name: string;
  type: string;
}

interface ActivityData {
  id: string;
  originalId?: string;
  name: string;
  leader: string;
  guide: string;
  observer: string;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  isRecurring: boolean;
  recurrenceRule?: string | null;
}

interface ActivityFormProps {
  onActivityCreated: () => void;
  initialData?: ActivityData;
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

function OverlapWarningBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="warning-banner">
      <AlertTriangle size={20} />
      <span>{message}</span>
    </div>
  );
}

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

// ---------------------------------------------------------------------------
// ActivityForm
// ---------------------------------------------------------------------------

export default function ActivityForm({ onActivityCreated, initialData, onCancel }: ActivityFormProps) {
  const isEditing = !!initialData;
  const isInstance = !!initialData?.originalId;

  const initialStartDate = initialData
    ? new Date(initialData.startDateTime)
    : new Date();
  const initialEndDate = initialData
    ? new Date(initialData.endDateTime)
    : addMinutes(new Date(), DEFAULT_DURATION_MINUTES);

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    leader: initialData?.leader ?? '',
    guide: initialData?.guide ?? '',
    observer: initialData?.observer ?? '',
    startDateTime: initialStartDate,
    duration: initialData?.duration ?? DEFAULT_DURATION_MINUTES,
    endDateTime: initialEndDate,
    isRecurring: initialData?.isRecurring ?? false,
    recurrenceFreq: 'WEEKLY',
    recurrenceDays:
      (initialData?.recurrenceRule?.split('BYDAY=')[1]?.split(',') as string[]) ?? [],
  });

  const [users, setUsers] = useState<User[]>([]);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMode, setSaveMode] = useState<'this' | 'all'>(
    isInstance ? 'this' : 'all',
  );

  // Fetch users for typeahead
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

  // Check for overlapping activities
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

  // Auto-set recurrence day to the selected start date's day
  useEffect(() => {
    if (formData.startDateTime && formData.recurrenceDays.length === 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const day = dayMap[formData.startDateTime.getDay()];
      setFormData((prev) => ({ ...prev, recurrenceDays: [day] }));
    }
  }, [formData.startDateTime]);

  // Sync end time from start + duration; check overlap
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
      };

      try {
        if (isInstance && saveMode === 'this') {
          // Create a non-recurring copy of this specific occurrence
          const createRes = await fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, isRecurring: false, recurrenceRule: null }),
          });
          if (!createRes.ok) throw new Error(ERROR_SAVING_EVENT);

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
          if (!res.ok) throw new Error(ERROR_SAVING_EVENT);
        }

        onActivityCreated();
        setIsSubmitting(false);
      } catch (err) {
        console.error(err);
        alert(ERROR_SAVING_EVENT);
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, isInstance, saveMode, initialData, onActivityCreated],
  );

  const handleDelete = useCallback(async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${isInstance && saveMode === 'this'
          ? 'this specific occurrence'
          : 'the entire series'
        }?`,
      )
    ) {
      return;
    }

    try {
      if (isInstance && saveMode === 'this') {
        const exdate = toIcalDtstart(formData.startDateTime);
        const newRRule =
          initialData!.recurrenceRule + '\n' + `EXDATE:${exdate}`;

        await secureFetch(`/api/activities/${initialData!.originalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...initialData!, recurrenceRule: newRRule }),
        });
      } else {
        await secureFetch(
          `/api/activities/${initialData!.originalId || initialData!.id}`,
          { method: 'DELETE' },
        );
      }

      onActivityCreated();
    } catch (err) {
      console.error(err);
      alert(ERROR_DELETING_EVENT);
    }
  }, [isInstance, saveMode, formData.startDateTime, initialData, onActivityCreated]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{isEditing ? 'Edit Activity' : 'New Activity'}</h2>
      </div>

      <OverlapWarningBanner message={overlapWarning} />

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

      <div className="form-row">
        <UserTypeahead
          label="Leader"
          required
          value={formData.leader}
          onChange={(val) => setFormData({ ...formData, leader: val })}
          icon={<UserIcon size={16} />}
          users={users}
        />
        <UserTypeahead
          label="Guide"
          value={formData.guide}
          onChange={(val) => setFormData({ ...formData, guide: val })}
          icon={<Users size={16} />}
          users={users}
        />
        <UserTypeahead
          label="Observer"
          value={formData.observer}
          onChange={(val) => setFormData({ ...formData, observer: val })}
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

      <div className="form-row" style={{ marginTop: '20px' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
          style={{ flex: 2 }}
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
            style={{ flex: 0.5 }}
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
  );
}