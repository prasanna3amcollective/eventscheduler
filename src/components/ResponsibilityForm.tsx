'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { addMinutes, differenceInMinutes } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { secureFetch } from '@/lib/fetch';
import UserTypeahead from './UserTypeahead';
import {
  CalendarFill as Calendar,
  Clock,
  Repeat,
  AlertTriangle,
  Check,
  Tag,
  X,
  User as UserIcon,
} from '@/components/Icons';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

interface ResponsibilityData {
  id?: string;
  name: string;
  owner?: string;
  startDateTime: string;
  endDateTime: string;
  duration: number;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  category?: string;
}

interface ResponsibilityFormProps {
  onResponsibilityCreated: () => void;
  initialData?: ResponsibilityData;
  onCancel?: () => void;
}

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

function toIcalDtstart(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildRrule(
  start: Date,
  isRecurring: boolean,
  recurrenceDays: string[],
  recurrenceFreq: string,
): string {
  if (!isRecurring || recurrenceDays.length === 0) return '';
  const dtstart = toIcalDtstart(start);
  return `DTSTART:${dtstart}\nRRULE:FREQ=${recurrenceFreq};BYDAY=${recurrenceDays.join(',')}`;
}

export default function ResponsibilityForm({ onResponsibilityCreated, initialData, onCancel }: ResponsibilityFormProps) {
  const initialStartDate = initialData
    ? new Date(initialData.startDateTime)
    : new Date();
  const initialEndDate = initialData
    ? new Date(initialData.endDateTime)
    : addMinutes(new Date(), DEFAULT_DURATION_MINUTES);

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    owner: initialData?.owner ?? '',
    startDateTime: initialStartDate,
    duration: initialData?.duration ?? DEFAULT_DURATION_MINUTES,
    endDateTime: initialEndDate,
    isRecurring: initialData?.isRecurring ?? false,
    recurrenceFreq: 'WEEKLY' as 'WEEKLY' | 'MONTHLY',
    recurrenceDays: (initialData?.recurrenceRule?.split('BYDAY=')[1]?.split(',') as string[]) ?? [],
    category: initialData?.category ?? 'General',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users for the typeahead
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

  const updateEndFromDuration = (newDuration: number) => {
    const newEnd = addMinutes(formData.startDateTime, newDuration);
    setFormData(prev => ({ ...prev, duration: newDuration, endDateTime: newEnd }));
  };

  const updateDurationFromTimes = (start: Date, end: Date) => {
    const diff = Math.max(15, differenceInMinutes(end, start));
    setFormData(prev => ({ ...prev, duration: diff }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const recurrenceRule = buildRrule(
        formData.startDateTime,
        formData.isRecurring,
        formData.recurrenceDays,
        formData.recurrenceFreq
      );

      const payload = {
        name: formData.name.trim(),
        owner: formData.owner.trim() || null,
        startDateTime: formData.startDateTime.toISOString(),
        endDateTime: formData.endDateTime.toISOString(),
        duration: formData.duration,
        isRecurring: formData.isRecurring,
        recurrenceRule: formData.isRecurring ? recurrenceRule : null,
        category: formData.category,
      };

      const res = await secureFetch('/api/responsibilities', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create responsibility');
      }

      setSuccess(true);
      setTimeout(() => {
        onResponsibilityCreated();
        if (onCancel) onCancel();
      }, 800);
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRecurrenceDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter(d => d !== day)
        : [...prev.recurrenceDays, day]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="activity-form">
      <div className="form-grid">
        <div className="form-field full-width">
          <label><Tag size={16} /> Responsibility Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Morning Meditation"
            required
          />
        </div>

        <div className="form-field full-width">
          <UserTypeahead
            label="Owner"
            value={formData.owner}
            onChange={(val) => setFormData(prev => ({ ...prev, owner: val }))}
            icon={<UserIcon size={16} />}
            users={users}
            placeholder="Type 3+ chars to search users..."
          />
        </div>

        <div className="form-field">
          <label><Calendar size={16} /> Start Date & Time</label>
          <DatePicker
            selected={formData.startDateTime}
            onChange={(date: Date | null) => {
              if (date) {
                setFormData(prev => {
                  const newEnd = addMinutes(date, prev.duration);
                  return { ...prev, startDateTime: date, endDateTime: newEnd };
                });
              }
            }}
            showTimeSelect
            dateFormat="MMM d, yyyy h:mm aa"
            className="date-picker-input"
          />
        </div>

        <div className="form-field">
          <label><Clock size={16} /> Duration (minutes)</label>
          <input
            type="number"
            min="15"
            step="15"
            value={formData.duration}
            onChange={(e) => updateEndFromDuration(parseInt(e.target.value) || 15)}
          />
        </div>

        <div className="form-field">
          <label><Calendar size={16} /> End Date & Time</label>
          <DatePicker
            selected={formData.endDateTime}
            onChange={(date: Date | null) => {
              if (date) {
                setFormData(prev => ({ ...prev, endDateTime: date }));
                updateDurationFromTimes(formData.startDateTime, date);
              }
            }}
            showTimeSelect
            dateFormat="MMM d, yyyy h:mm aa"
            className="date-picker-input"
          />
        </div>

        <div className="form-field">
          <label><Tag size={16} /> Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            {ACTIVITY_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-field full-width">
          <label className="recurring-toggle">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
            />
            <Repeat size={16} /> Recurring Event
          </label>
          {formData.isRecurring && (
            <div className="recurrence-options">
              <select
                value={formData.recurrenceFreq}
                onChange={(e) => setFormData(prev => ({ ...prev, recurrenceFreq: e.target.value as 'WEEKLY' | 'MONTHLY' }))}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
              <div className="days-selector">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    type="button"
                    key={day.value}
                    className={`day-btn ${formData.recurrenceDays.includes(day.value) ? 'active' : ''}`}
                    onClick={() => toggleRecurrenceDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-banner"><AlertTriangle size={16} /> {error}</div>}
      {success && <div className="success-banner"><Check size={16} /> Responsibility created successfully!</div>}

      <div className="form-actions">
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary"><X size={16} /> Cancel</button>}
        <button type="submit" disabled={isSubmitting || !formData.name.trim()} className="btn-primary">
          {isSubmitting ? 'Saving...' : initialData ? 'Update Responsibility' : 'Create Responsibility'}
        </button>
      </div>
    </form>
  );
}
