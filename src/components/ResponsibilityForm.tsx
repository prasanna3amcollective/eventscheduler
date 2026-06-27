'use client';

import React, { useState, useEffect, useRef } from 'react';
import { addMinutes, addWeeks } from 'date-fns';
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
  description?: string;
  category?: string;
  detachReason?: string;
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

export default function ResponsibilityForm({ onResponsibilityCreated, initialData, onCancel }: Readonly<ResponsibilityFormProps>) {
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



  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [recurrenceWarning, setRecurrenceWarning] = useState<string | null>(null);
  // Form state for responsibility fields
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    owner: initialData?.owner ?? '',
    ownerId: initialData?.ownerId ?? '',
    startDateTime: initialStartDate,
    endDateTime: initialEndDate,
    duration: initialData?.duration ?? DEFAULT_DURATION_MINUTES,
    isRecurring: initialData?.isRecurring ?? false,
    recurrenceFreq: (parsedRecurrence.recurrenceFreq as 'WEEKLY' | 'MONTHLY') || 'WEEKLY',
    recurrenceDays: parsedRecurrence.recurrenceDays,
    recurrenceStart: defaultRecStart,
    recurrenceUntil: defaultRecUntil,
    recurrenceWeeks: defaultRecWeeks,
    category: initialData?.category ?? 'General',
    detachReason: initialData?.detachReason ?? 'none',
    recurrenceTemplateId: initialData?.recurrenceTemplateId ?? null,
    generatedFromTemplateId: initialData?.generatedFromTemplateId ?? null,
  });

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
        if (tpl?.recurrenceRule) {
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


  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
        formData.recurrenceUntil
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
        description: formData.description.trim(),
        generatedFromTemplateId: formData.generatedFromTemplateId,
        detachReason: formData.detachReason,
      };

      let url = '/api/responsibilities';
      let method: 'POST' | 'PUT' = 'POST';

      if (isEditing) {
        if (isSeriesOccurrence && saveMode === 'this') {
          url = `/api/responsibilities/${initialData.id}`;
          method = 'PUT';
          payload.detachReason = 'edited';
          payload.isRecurring = false;
          payload.recurrenceRule = null;
        } else if (isSeriesOccurrence && saveMode === 'all') {
          url = `/api/recurrence-templates/${initialData.recurrenceTemplateId}`;
          method = 'PUT';
        } else {
          url = `/api/responsibilities/${initialData.id}`;
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
    <form onSubmit={handleSubmit} className="responsibility-form bg-white rounded-xl p-6 md:p-8 w-full max-w-xl mx-auto space-y-6">
      <div className="form-header mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Edit Responsibility' : 'New Responsibility'}</h2>
      </div>

      <div className="form-row grid grid-cols-[2fr_1fr] gap-6">
        <div className="form-group space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Tag size={16} className="text-primary" aria-hidden="true" /> Responsibility Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Morning Meditation"
            required
            autoFocus
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div className="form-group space-y-2">
          <UserTypeahead
            label="Owner"
            value={formData.owner}
            onChange={(val) => setFormData(prev => ({ ...prev, owner: val }))}
            onSelect={(user) => setFormData(prev => ({ ...prev, ownerId: user.id }))}
            icon={<UserIcon size={16} className="text-primary" />}
            users={users}
            placeholder="Type 3+ chars to search users..."
            className="w-full"
          />
        </div>
      </div>
      <div className="form-row grid grid-cols-[1fr_1fr] gap-6">
        <div className="form-group space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Calendar size={16} className="text-primary" aria-hidden="true" /> Responsibility start
          </label>
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div className="form-group space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Clock size={16} className="text-primary" aria-hidden="true" /> Duration (minutes)
          </label>
          <input
            type="number"
            min="15"
            step="15"
            value={formData.duration}
            onChange={(e) => updateEndFromDuration(Number.parseInt(e.target.value) || 15)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="form-row grid grid-cols-[1fr_1fr] gap-6">
        <div className="form-group space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Tag size={16} className="text-primary" aria-hidden="true" /> Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-right-[12px] bg-center no-repeat"
          >
            {ACTIVITY_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Calendar size={16} className="text-primary" aria-hidden="true" /> Responsibility end
          </label>
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="form-group space-y-2">
        <label className="recurring-toggle flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            id="recurring-toggle"
            type="checkbox"
            checked={formData.isRecurring}
            onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
          />
          <Repeat size={16} className="text-primary" aria-hidden="true" /> Recurring Event
        </label>
        {formData.isRecurring && (
          <div className="recurrence-options space-y-4 mt-4">
            <div className="flex items-center gap-3 mb-2">
              <label htmlFor="recurrence-freq" className="text-xs font-medium text-gray-500">Repeat every</label>
              <select
                id="recurrence-freq"
                value={formData.recurrenceFreq}
                onChange={(e) => setFormData(prev => ({ ...prev, recurrenceFreq: e.target.value as 'WEEKLY' | 'MONTHLY' }))}
                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all w-[100px]"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
              <span className="text-xs font-medium text-gray-500">on</span>
            </div>

            <div className="days-selector">
              {DAYS_OF_WEEK.map(day => (
                <button
                  type="button"
                  key={day.value}
                  className={`day-btn ${formData.recurrenceDays.includes(day.value) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleRecurrenceDay(day.value);
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* Recurrence range controls (auto-sync weeks <-> until) */}
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-1">
                  <label htmlFor="recurrence-weeks" className="block text-xs font-medium text-gray-500">how many weeks recurrence?</label>
                  <input
                    id="recurrence-weeks"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.recurrenceWeeks}
                    onChange={(e) => {
                      const w = Math.max(1, parseInt(e.target.value) || 1);
                      const newUntil = addWeeks(formData.recurrenceStart, w);
                      setFormData(prev => ({ ...prev, recurrenceWeeks: w, recurrenceUntil: newUntil }));
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Recurrence Start</label>
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">Recur until</label>
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              {recurrenceWarning && (
                <div className="flex items-center gap-2 text-xs font-medium bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="text-yellow-500" />
                  {recurrenceWarning}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {(isEditing && isSeriesOccurrence) && (
        <div className="edit-choice-container bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
          <p className="text-sm font-medium text-gray-600 mb-3">
            This is part of a recurring series.
          </p>
          <div className="edit-choice-buttons flex gap-3">
            <button
              type="button"
              className={`nav-link-btn flex-1 items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-all ${saveMode === 'this' ? 'active text-black bg-primary' : ''}`}
              onClick={() => setSaveMode('this')}
            >
              This occurrence only
            </button>
            <button
              type="button"
              className={`nav-link-btn flex-1 items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-all ${saveMode === 'all' ? 'active text-black bg-primary' : ''}`}
              onClick={() => setSaveMode('all')}
            >
              All in series
            </button>
          </div>
        </div>
      )}

      {/* Detach Reason dropdown (Responsibility) - IDs never shown in UI */}
      {(formData.recurrenceTemplateId || formData.detachReason !== 'none') && (
        <div className="form-group space-y-2">
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

      {error && <div role="alert" aria-live="assertive" className="error-banner flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"><AlertTriangle size={16} className="text-red-500" aria-hidden="true" /> {error}</div>}
      {success && <div role="status" aria-live="polite" className="success-banner flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg"><Check size={16} className="text-green-500" aria-hidden="true" /> Responsibility created successfully!</div>}

      <div className="form-actions flex items-center justify-end gap-3 mt-6 pt-4">
        {onCancel && <button type="button" onClick={onCancel} className="orange-btn flex items-center gap-3 px-5 py-3 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-all">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>

            <X size={16} aria-hidden="true" />
            Cancel
          </span>
        </button>}
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          aria-busy={isSubmitting}
          className="pink-btn flex items-center gap-3 px-5 py-3 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-all "
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Responsibility' : 'Create Responsibility'}
        </button>
      </div>
    </form>
  );
}