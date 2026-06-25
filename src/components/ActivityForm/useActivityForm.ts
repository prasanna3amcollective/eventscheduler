import { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityFormProps, ActivityData, User } from './ActivityForm.types';
import { addMinutes, addWeeks } from 'date-fns';
import { secureFetch } from '@/lib/fetch';
import { buildRecurrenceRule, parseRecurrenceForForm } from '@/lib/recurrence';
import { submitActivity } from '@/lib/submitActivity'; // assume this utility exists

export const useActivityForm = (props: ActivityFormProps) => {
  const { onActivityCreated, initialData } = props;

  const isEditing = !!initialData?.id;
  const isSeriesOccurrence = !!initialData?.recurrenceTemplateId && (initialData?.detachReason ?? 'none') === 'none';

  const initialStartDate = initialData ? new Date(initialData.startDateTime) : new Date();
  const initialEndDate = initialData ? new Date(initialData.endDateTime) : addMinutes(new Date(), 60);

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

  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    leader: initialData?.leaders ?? [],
    guide: initialData?.guides ?? [],
    observer: initialData?.observers ?? [],
    startDateTime: initialStartDate,
    duration: initialData?.duration ?? 60,
    endDateTime: initialEndDate,
    isRecurring: initialData?.isRecurring ?? false,
    recurrenceFreq: (parsedRecurrence.recurrenceFreq as any) || 'WEEKLY',
    recurrenceDays: parsedRecurrence.recurrenceDays,
    recurrenceStart: defaultRecStart,
    recurrenceUntil: initialUntil,
    recurrenceWeeks: initialWeeks,
    category: initialData?.category ?? 'General',
    recurrenceTemplateId: initialData?.recurrenceTemplateId ?? null,
    generatedFromTemplateId: initialData?.generatedFromTemplateId ?? null,
    detachReason: initialData?.detachReason ?? 'none',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [recurrenceWarning, setRecurrenceWarning] = useState<string | null>(null);
  const [weeksError, setWeeksError] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<'this' | 'all'>(isSeriesOccurrence ? 'this' : 'all');

  const hasLoadedTemplateRef = useRef(false);

  // Fetch users once on mount
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
    return () => {
      cancelled = true;
    };
  }, []);

  // Overlap checking logic
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
          formData.recurrenceUntil ?? undefined,
        );
        const res = await secureFetch('/api/activities/check-overlap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDateTime: start.toISOString(),
            endDateTime: end.toISOString(),
            duration: (end.getTime() - start.getTime()) / 60000,
            isRecurring: formData.isRecurring,
            recurrenceRule: rruleStr,
            excludeActivityId: isEditing ? initialData?.id : undefined,
            recurrenceTemplateId: formData.recurrenceTemplateId ?? undefined,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.overlap) return;
        if (data.activities.length > 0) {
          const names = (data.activities as ActivityData[]).map(e => e.name).join(', ');
          setOverlapWarning(`Warning: This schedule overlaps with: ${names}`);
        }
      } catch (e) {
        console.error('Failed to check overlap', e);
      }
    },
    [formData.isRecurring, formData.recurrenceDays, formData.recurrenceFreq, formData.recurrenceStart, formData.recurrenceUntil, isEditing, initialData],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formData.leader || formData.leader.length === 0) {
        alert('At least one Leader is required.');
        return;
      }
      setIsSubmitting(true);
      try {
        await submitActivity({
          formData,
          isEditing,
          isSeriesOccurrence,
          saveMode,
          initialData,
          onActivityCreated,
        });
      } catch (err) {
        console.error(err);
        setConfirmMessage(err instanceof Error ? err.message : 'An error occurred while saving');
        setConfirmAction(() => () => {});
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, isSeriesOccurrence, saveMode, initialData, onActivityCreated],
  );

  return {
    formData,
    setFormData,
    users,
    overlapWarning,
    isSubmitting,
    confirmMessage,
    setConfirmMessage,
    confirmAction,
    setConfirmAction,
    recurrenceWarning,
    setRecurrenceWarning,
    weeksError,
    setWeeksError,
    saveMode,
    setSaveMode,
    checkOverlap,
    handleSubmit,
    isSeriesOccurrence,
  };
};
