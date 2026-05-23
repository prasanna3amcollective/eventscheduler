'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { addMinutes, differenceInMinutes, addWeeks } from 'date-fns';
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
import {
  buildRecurrenceRule,
  parseRecurrenceForForm,
} from '@/lib/recurrence';

// Types
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
  recurrenceTemplateId?: string | null;
  generatedFromTemplateId?: string | null;
  detachReason?: 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created';
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

export default function ResponsibilityForm({ onResponsibilityCreated, initialData, onCancel }: ResponsibilityFormProps) {
  const isEditing = !!initialData?.id;
  const isSeriesOccurrence = !!initialData?.recurrenceTemplateId &&
    (initialData?.detachReason ?? 'none') === 'none';

  const [saveMode, setSaveMode] = useState<'this' | 'all'>(
    isSeriesOccurrence ? 'this' : 'all'
  );

  const initialStartDate = initialData
    ? new Date(initialData.startDateTime)
    : new Date();
  const initialEndDate = initialData
    ? new Date(initialData.endDateTime)
    : addMinutes(new Date(), DEFAULT_DURATION_MINUTES);

  // Compute recurrence defaults (parsed from rule if present)
  const parsedRecurrence = parseRecurrenceForForm(initialData?.recurrenceRule);
  const defaultRecStart = parsedRecurrence.recurrenceStart || initialStartDate;
  const defaultRecWeeks = parsedRecurrence.recurrenceInterval || 4;
  const defaultRecUntil = parsedRecurrence.recurrenceUntil || addWeeks(defaultRecStart, defaultRecWeeks);

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    owner: initialData?.owner ?? '',
    ownerId: initialData?.ownerId ?? '',
    startDateTime: initialStartDate,
    duration: initialData?.duration ?? DEFAULT_DURATION_MINUTES,
    endDateTime: initialEndDate,
    isRecurring: initialData?.isRecurring ?? false,
    recurrenceFreq: (parsedRecurrence.recurrenceFreq as 'WEEKLY' | 'MONTHLY') || 'WEEKLY',
    recurrenceDays: parsedRecurrence.recurrenceDays,
    recurrenceStart: defaultRecStart,
    recurrenceUntil: defaultRecUntil,
    recurrenceWeeks: defaultRecWeeks,
    category: initialData?.category ?? 'General',
    // Lineage (forwarded on submit; IDs backend-driven)
    recurrenceTemplateId: initialData?.recurrenceTemplateId ?? null,
    generatedFromTemplateId: initialData?.generatedFromTemplateId ?? null,
    detachReason: initialData?.detachReason ?? 'none',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [recurrenceWarning, setRecurrenceWarning] = useState<string | null>(null);

  // Guard so we fetch the authoritative template data only once on mount for series edits
  const hasLoadedTemplateRef = useRef(false);

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

  // For series (edit this or all), fetch live RecurrenceTemplate to populate freq/days + start/until/weeks
  // from the real rule + template.startDate/endDate (instead of child row defaults)
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
            recurrenceFreq: (p.recurrenceFreq as 'WEEKLY' | 'MONTHLY') || prev.recurrenceFreq,
            recurrenceStart: p.recurrenceStart || (tpl.startDate ? new Date(tpl.startDate) : prev.recurrenceStart),
            recurrenceUntil: p.recurrenceUntil || (tpl.endDate ? new Date(tpl.endDate) : prev.recurrenceUntil),
            recurrenceWeeks: p.recurrenceInterval || prev.recurrenceWeeks,
          }));
        }
      })
      .catch((err) => console.error('Failed to load series template for responsibility edit:', err));
  }, [isSeriesOccurrence, initialData]);

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
      const recurrenceRule = buildRecurrenceRule(
        formData.startDateTime,
        formData.isRecurring,
        formData.recurrenceDays,
        formData.recurrenceFreq,
        undefined,
        formData.recurrenceStart,
        formData.recurrenceUntil,
        formData.recurrenceWeeks
      );

      const payload: any = {
        name: formData.name.trim(),
        owner: formData.owner.trim() || null,
        ownerId: formData.ownerId || null,
        startDateTime: formData.startDateTime.toISOString(),
        endDateTime: formData.endDateTime.toISOString(),
        duration: formData.duration,
        isRecurring: formData.isRecurring,
        recurrenceRule: formData.isRecurring ? recurrenceRule : null,
        recurrenceStart: formData.recurrenceStart?.toISOString?.() ?? null,
        recurrenceUntil: formData.recurrenceUntil?.toISOString?.() ?? null,
        recurrenceWeeks: formData.recurrenceWeeks,
        category: formData.category,
        recurrenceTemplateId: formData.recurrenceTemplateId,
        generatedFromTemplateId: formData.generatedFromTemplateId,
        detachReason: formData.detachReason,
      };

      let url = '/api/responsibilities';
      let method: 'POST' | 'PUT' = 'POST';

      if (isEditing) {
        if (isSeriesOccurrence && saveMode === 'this') {
          url = `/api/responsibilities/${initialData!.id}`;
          method = 'PUT';
          payload.detachReason = 'edited';
          payload.isRecurring = false;
          payload.recurrenceRule = null;
        } else if (isSeriesOccurrence && saveMode === 'all') {
          url = `/api/recurrence-templates/${initialData!.recurrenceTemplateId}`;
          method = 'PUT';
        } else {
          url = `/api/responsibilities/${initialData!.id}`;
          method = 'PUT';
        }
      }

      // For series 'all' saves, send a clean template update payload (maps recurrence range -> startDate/endDate)
      // so edits to Recurrence Start/Until/weeks are persisted and used by generator for capping.
      let submitBody: any = payload;
      if (url.includes('recurrence-templates')) {
        submitBody = {
          recurrenceRule,
          name: formData.name.trim(),
          duration: formData.duration,
          category: formData.category,
          startDate: formData.recurrenceStart?.toISOString?.() ?? undefined,
          endDate: formData.recurrenceUntil?.toISOString?.() ?? null,
        };
      }

      const res = await secureFetch(url, {
        method,
        body: JSON.stringify(submitBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (method === 'PUT' ? 'Failed to update responsibility' : 'Failed to create responsibility'));
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
           <label><Calendar size={16} aria-hidden="true" /> Responsibility start</label>
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
           <label><Calendar size={16} aria-hidden="true" /> Responsibility end</label>
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

              {/* Recurrence range controls (auto-sync weeks <-> until) */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>how many weeks recurrence?</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={formData.recurrenceWeeks}
                      onChange={(e) => {
                        const w = Math.max(1, parseInt(e.target.value) || 1);
                        const newUntil = addWeeks(formData.recurrenceStart, w);
                        setFormData(prev => ({ ...prev, recurrenceWeeks: w, recurrenceUntil: newUntil }));
                      }}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Recurrence Start</label>
                    <DatePicker
                      selected={formData.recurrenceStart}
                      onChange={(date: Date | null) => {
                        if (!date) return;
                        const today = new Date(); today.setHours(0, 0, 0, 0);
                        const d0 = new Date(date); d0.setHours(0, 0, 0, 0);
                        if (d0.getTime() < today.getTime()) {
                          setRecurrenceWarning('Recurrence start is in the past');
                        } else {
                          setRecurrenceWarning(null);
                        }
                        const w = formData.recurrenceWeeks || 1;
                        const newU = addWeeks(date, w);
                        setFormData(prev => ({ ...prev, recurrenceStart: date, recurrenceUntil: newU }));
                      }}
                      showTimeSelect
                      dateFormat="MMM d, yyyy h:mm aa"
                      className="date-picker-input"
                    />
                  </div>
                </div>
                <div style={{ marginTop: '6px' }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Recur until</label>
                  <DatePicker
                    selected={formData.recurrenceUntil}
                    onChange={(date: Date | null) => {
                      if (!date) return;
                      const start = formData.recurrenceStart;
                      const diffDays = Math.max(7, Math.round((date.getTime() - start.getTime()) / (1000 * 3600 * 24)));
                      const w = Math.max(1, Math.round(diffDays / 7));
                      setFormData(prev => ({ ...prev, recurrenceUntil: date, recurrenceWeeks: w }));
                    }}
                    showTimeSelect
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="date-picker-input"
                  />
                </div>
                {recurrenceWarning && (
                  <div style={{ color: '#d97706', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <AlertTriangle size={11} /> {recurrenceWarning}
                  </div>
                )}
              </div>
             </div>
            )}
           </div>

        {(isEditing && isSeriesOccurrence) && (
          <div className="edit-choice-container" style={{ margin: '12px 0' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              This is part of a recurring series.
            </p>
            <div className="edit-choice-buttons" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`nav-tab ${saveMode === 'this' ? 'active' : ''}`}
                onClick={() => setSaveMode('this')}
                style={{ flex: 1 }}
              >
                This occurrence only
              </button>
              <button
                type="button"
                className={`nav-tab ${saveMode === 'all' ? 'active' : ''}`}
                onClick={() => setSaveMode('all')}
                style={{ flex: 1 }}
              >
                All in series
              </button>
            </div>
          </div>
        )}

        {/* Detach Reason dropdown (Responsibility) - IDs never shown in UI */}
        {(formData.recurrenceTemplateId || formData.detachReason !== 'none') && (
         <div className="form-group" style={{ marginTop: '8px' }}>
           <label htmlFor="detach-reason-resp">Detach Reason</label>
           <select
             id="detach-reason-resp"
             value={formData.detachReason || 'none'}
             onChange={(e) =>
               setFormData({
                 ...formData,
                 detachReason: e.target.value as 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created',
               })
             }
             style={{ width: '100%', padding: '6px', borderRadius: '4px' }}
           >
             <option value="none">none (part of series)</option>
             <option value="edited">edited</option>
             <option value="cancelled">cancelled</option>
             <option value="rescheduled">rescheduled</option>
             <option value="manually_created">manually_created</option>
           </select>
         </div>
       )}

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
