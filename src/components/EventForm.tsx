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
  Calendar, 
  Clock, 
  Repeat, 
  AlertTriangle, 
  Check, 
  Trash2,
  Tag,
  X
} from 'lucide-react';

interface EventFormProps {
  onEventCreated: () => void;
  initialData?: any;
  onCancel?: () => void;
}

export default function EventForm({ onEventCreated, initialData, onCancel }: EventFormProps) {
  const isEditing = !!initialData;
  const isInstance = !!initialData?.originalId;

  const initialStartDate = initialData ? new Date(initialData.startDateTime) : new Date();
  const initialEndDate = initialData ? new Date(initialData.endDateTime) : addMinutes(new Date(), 60);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    leader: initialData?.leader || '',
    guide: initialData?.guide || '',
    observer: initialData?.observer || '',
    startDateTime: initialStartDate,
    duration: initialData?.duration || 60,
    endDateTime: initialEndDate,
    isRecurring: initialData?.isRecurring || false,
    recurrenceFreq: 'WEEKLY',
    recurrenceDays: initialData?.recurrenceRule?.split('BYDAY=')[1]?.split(',') || [] as string[]
  });

  const [users, setUsers] = useState<any[]>([]);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMode, setSaveMode] = useState<'this' | 'all'>(isInstance ? 'this' : 'all');

  // Fetch users for typeahead
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  const checkOverlap = useCallback(async (start: Date, end: Date) => {
    setOverlapWarning(null);
    try {
      let rruleStr = '';
      if (formData.isRecurring && formData.recurrenceDays.length > 0) {
        rruleStr = `DTSTART:${format(start, "yyyyMMdd'T'HHmmss'Z'")}\nRRULE:FREQ=${formData.recurrenceFreq};BYDAY=${formData.recurrenceDays.join(',')}`;
      }

      const res = await secureFetch('/api/events/check-overlap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          duration: differenceInMinutes(end, start),
          isRecurring: formData.isRecurring,
          recurrenceRule: rruleStr
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.overlap) {
          const otherEvents = isEditing 
            ? data.events.filter((e: any) => e.id !== initialData.originalId && e.id !== initialData.id)
            : data.events;
            
          if (otherEvents.length > 0) {
            const names = otherEvents.map((e: any) => e.name).join(', ');
            setOverlapWarning(`Warning: This schedule overlaps with: ${names}`);
          }
        }
      }
    } catch (e) {
      console.error('Failed to check overlap', e);
    }
  }, [formData.isRecurring, formData.recurrenceDays, formData.recurrenceFreq, isEditing, initialData]);

  useEffect(() => {
    if (formData.startDateTime) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const day = dayMap[formData.startDateTime.getDay()];
      setFormData(prev => {
        if (prev.recurrenceDays.length === 0) {
          return { ...prev, recurrenceDays: [day] };
        }
        return prev;
      });
    }
  }, [formData.startDateTime]);

  useEffect(() => {
    if (formData.startDateTime && formData.duration > 0) {
      const end = addMinutes(formData.startDateTime, formData.duration);
      setFormData(prev => {
        if (prev.endDateTime.getTime() === end.getTime()) return prev;
        return { ...prev, endDateTime: end };
      });
      checkOverlap(formData.startDateTime, end);
    }
  }, [formData.startDateTime, formData.duration, checkOverlap]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const start = formData.startDateTime;
    const end = formData.endDateTime;

    let rruleStr = '';
    if (formData.isRecurring && formData.recurrenceDays.length > 0) {
      const dtstart = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rruleStr = `DTSTART:${dtstart}\nRRULE:FREQ=${formData.recurrenceFreq};BYDAY=${formData.recurrenceDays.join(',')}`;
      
      if (isEditing && initialData.recurrenceRule?.includes('EXDATE')) {
        const exdates = initialData.recurrenceRule.split('\n').filter((l: string) => l.startsWith('EXDATE'));
        if (exdates.length > 0) {
          rruleStr += '\n' + exdates.join('\n');
        }
      }
    }

    const payload = {
      name: formData.name,
      leader: formData.leader,
      guide: formData.guide,
      observer: formData.observer,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      duration: formData.duration,
      isRecurring: formData.isRecurring,
      recurrenceRule: rruleStr
    };

    try {
      if (isInstance && saveMode === 'this') {
        const createRes = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, isRecurring: false, recurrenceRule: null })
        });
        if (!createRes.ok) throw new Error('Failed to create separate instance');

        const exdate = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const newRRule = initialData.recurrenceRule + '\n' + `EXDATE:${exdate}`;
        
        await fetch(`/api/events/${initialData.originalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...initialData,
            recurrenceRule: newRRule,
          })
        });
      } else {
        const url = isEditing ? `/api/events/${initialData.originalId || initialData.id}` : '/api/events';
        const method = isEditing ? 'PUT' : 'POST';
        
        const res = await secureFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save event');
      }
      onEventCreated();
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${isInstance && saveMode === 'this' ? 'this specific occurrence' : 'the entire series'}?`)) return;
    try {
      if (isInstance && saveMode === 'this') {
        const exdate = formData.startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const newRRule = initialData.recurrenceRule + '\n' + `EXDATE:${exdate}`;
        await secureFetch(`/api/events/${initialData.originalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...initialData, recurrenceRule: newRRule })
        });
      } else {
        await secureFetch(`/api/events/${initialData.originalId || initialData.id}`, { method: 'DELETE' });
      }
      onEventCreated();
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  const daysOfWeek = [
    { label: 'Sun', value: 'SU' }, { label: 'Mon', value: 'MO' }, { label: 'Tue', value: 'TU' },
    { label: 'Wed', value: 'WE' }, { label: 'Thu', value: 'TH' }, { label: 'Fri', value: 'FR' },
    { label: 'Sat', value: 'SA' }
  ];

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{isEditing ? 'Edit Event' : 'New Schedule'}</h2>
      </div>
      
      {overlapWarning && (
        <div className="warning-banner">
          <AlertTriangle size={20} />
          <span>{overlapWarning}</span>
        </div>
      )}

      <div className="form-group">
        <label><Tag size={16} /> Event Name</label>
        <input 
          required 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          placeholder="e.g. Project Sync-up" 
        />
      </div>

      <div className="form-row">
        <UserTypeahead 
          label="Leader" 
          required
          value={formData.leader} 
          onChange={val => setFormData({...formData, leader: val})} 
          icon={<UserIcon size={16} />} 
          users={users} 
        />
        <UserTypeahead 
          label="Guide" 
          value={formData.guide} 
          onChange={val => setFormData({...formData, guide: val})} 
          icon={<Users size={16} />} 
          users={users} 
        />
        <UserTypeahead 
          label="Observer" 
          value={formData.observer} 
          onChange={val => setFormData({...formData, observer: val})} 
          icon={<Eye size={16} />} 
          users={users} 
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label><Calendar size={16} /> Date & Time</label>
          <DatePicker
            selected={formData.startDateTime}
            onChange={(date: Date | null) => date && setFormData({...formData, startDateTime: date})}
            showTimeSelect
            dateFormat="MMMM d, yyyy h:mm aa"
            className="premium-datepicker"
            placeholderText="Select start date and time"
          />
        </div>
        <div className="form-group">
          <label><Repeat size={16} /> Duration (mins)</label>
          <input 
            type="number" 
            min="1" 
            required 
            value={formData.duration} 
            onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})} 
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
          <input type="checkbox" checked={formData.isRecurring} onChange={e => setFormData({...formData, isRecurring: e.target.checked})} />
          Enable Recurrence
        </label>
        
        {formData.isRecurring && !isInstance && (
          <div className="recurring-options fade-in" style={{ marginTop: '16px' }}>
            <label style={{ marginBottom: '8px' }}>Repeat on specific days:</label>
            <div className="days-selector">
              {daysOfWeek.map(day => (
                <button 
                  type="button" 
                  key={day.value} 
                  className={`day-btn ${formData.recurrenceDays.includes(day.value) ? 'active' : ''}`}
                  onClick={() => {
                    const days = formData.recurrenceDays.includes(day.value) 
                      ? formData.recurrenceDays.filter((d: string) => d !== day.value)
                      : [...formData.recurrenceDays, day.value];
                    setFormData({...formData, recurrenceDays: days});
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isInstance && (
        <div className="edit-choice-container">
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>This is part of a recurring series.</p>
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
              All events in series
            </button>
          </div>
        </div>
      )}

      <div className="form-row" style={{ marginTop: '20px' }}>
        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 2 }}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Confirm Schedule'}
          {!isSubmitting && <Check size={18} />}
        </button>
        {isEditing && (
          <button type="button" onClick={handleDelete} className="btn-danger" style={{ flex: 0.5 }}>
            <Trash2 size={18} />
          </button>
        )}
      </div>
      
      {onCancel && (
        <button type="button" onClick={onCancel} className="btn-secondary" style={{ marginTop: '12px' }}>
          <X size={18} />
          Cancel
        </button>
      )}
    </form>
  );
}
