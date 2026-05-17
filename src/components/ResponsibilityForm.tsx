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
  ownerId?: string;
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
  const isEditing = !!initialData?.id;
  const initialStartDate = initialData
    ? new Date(initialData.startDateTime)
    : new Date();
  const initialEndDate = initialData
    ? new Date(initialData.endDateTime)
    : addMinutes(new Date(), DEFAULT_DURATION_MINUTES);

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    owner: initialData?.owner ?? '',
    ownerId: initialData?.ownerId ?? '',
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
    const diffMs = end.getTime() - start.getTime();
    const diffMin = Math.max(15, Math.round(diffMs / 60000));
    setFormData(prev => ({ ...prev, duration: diffMin }));
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
        ownerId: formData.ownerId || null,
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
    <form onSubmit={handleSubmit} className="responsibility-form">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Responsibility' : 'New Responsibility'}</h2>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label><Tag size={16} aria-hidden="true" /> Responsibility Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Morning Meditation"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <UserTypeahead
            label="Owner"
            value={formData.owner}
            onChange={(val) => setFormData(prev => ({ ...prev, owner: val }))}
            onSelect={(user) => setFormData(prev => ({ ...prev, ownerId: user.id }))}
            icon={<UserIcon size={16} />}
            users={users}
            placeholder="Type 3+ chars to search users..."
          />
        </div>

        <div className="form-group">
          <label><Calendar size={16} aria-hidden="true" /> Start Date & Time</label>
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

<div className="form-group">
          <label><Clock size={16} aria-hidden="true" /> Duration (minutes)</label>
          <input
            type="number"
            min="15"
            step="15"
            value={formData.duration}
            onChange={(e) => updateEndFromDuration(parseInt(e.target.value) || 15)}
          />
        </div>

        <div className="form-group">
          <label><Tag size={16} aria-hidden="true" /> Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          >
            {ACTIVITY_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

        <div className="form-group">
          <label><Calendar size={16} aria-hidden="true" /> End Date & Time</label>
          <DatePicker
            selected={formData.endDateTime}
            onChange={(date: Date | null) => {
              if (date) {
                setFormData(prev => {
                  const newDuration = Math.max(15, Math.round((date.getTime() - prev.startDateTime.getTime()) / 60000));
                  return { ...prev, endDateTime: date, duration: newDuration };
                });
              }
            }}
            showTimeSelect
            dateFormat="MMM d, yyyy h:mm aa"
            className="date-picker-input"
          />
        </div>

        <div className="form-group">
          <label className="recurring-toggle">
            <input
              id="recurring-toggle"
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
            />
            <Repeat size={16} aria-hidden="true" /> Recurring Event
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
      {error && <div role="alert" aria-live="assertive" className="error-banner"><AlertTriangle size={16} aria-hidden="true" /> {error}</div>}
      {success && <div role="status" aria-live="polite" className="success-banner"><Check size={16} aria-hidden="true" /> Responsibility created successfully!</div>}

      <div className="form-actions">
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary"><X size={16} aria-hidden="true" /> Cancel</button>}
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          aria-busy={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Responsibility' : 'Create Responsibility'}
        </button>
      </div>
    </form>
  );
}
