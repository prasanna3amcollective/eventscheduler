'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';

interface EventResponsibilityFormProps {
  eventId: string;
  onSuccess: () => void;
  onCancel: () => void;
  currentUser: any;
}

export default function EventResponsibilityForm({ eventId, onSuccess, onCancel, currentUser }: EventResponsibilityFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/responsibilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          duration,
          owner: currentUser?.name,
          ownerId: currentUser?.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event responsibility');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="neo-form">
      {error && (
        <div className="neo-form-group" style={{ background: 'rgba(255, 60, 60, 0.1)', padding: '12px', borderLeft: '4px solid #ff3c3c', borderRadius: '0', color: '#ff3c3c', border: '2px solid #000' }}>
          {error}
        </div>
      )}
      
      <div className="neo-form-group">
        <label className="neo-label">Responsibility Name</label>
        <input 
          type="text" 
          className="neo-input"
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
        />
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Category</label>
        <select 
          className="neo-input"
          value={category} 
          onChange={e => setCategory(e.target.value)}
        >
          {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="neo-form-row">
        <div className="neo-form-group">
          <label className="neo-label">Start Date & Time</label>
          <div className="neo-datepicker-wrapper">
            <DatePicker 
              selected={startDateTime}
              onChange={(date: Date | null) => date && setStartDateTime(date)}
              showTimeSelect
              dateFormat="Pp"
              className="neo-input"
              wrapperClassName="w-full"
            />
          </div>
        </div>
        <div className="neo-form-group">
          <label className="neo-label">End Date & Time</label>
          <div className="neo-datepicker-wrapper">
            <DatePicker 
              selected={endDateTime}
              onChange={(date: Date | null) => date && setEndDateTime(date)}
              showTimeSelect
              dateFormat="Pp"
              className="neo-input"
              wrapperClassName="w-full"
            />
          </div>
        </div>
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Description</label>
        <textarea 
          className="neo-input neo-textarea"
          value={description} 
          onChange={e => setDescription(e.target.value)} 
        />
      </div>

      <div className="neo-form-actions">
        <button type="button" onClick={onCancel} className="neo-btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="neo-btn-primary">
          {submitting ? 'Creating...' : 'Own Responsibility'}
        </button>
      </div>
    </form>
  );
}
