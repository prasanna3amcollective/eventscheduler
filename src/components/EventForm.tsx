'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface EventFormProps {
  onSuccess: (newEvent: any) => void;
  onCancel: () => void;
}

export default function EventForm({ onSuccess, onCancel }: EventFormProps) {
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventPlace, setEventPlace] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStart, setEventStart] = useState(new Date());
  const [eventEnd, setEventEnd] = useState(new Date(Date.now() + 60*60*1000));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          description: eventDescription,
          eventPlace,
          eventLocation,
          startDateTime: eventStart.toISOString(),
          endDateTime: eventEnd.toISOString()
        })
      });
      if (res.ok) {
        const newEvent = await res.json();
        onSuccess(newEvent);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create event');
      }
    } catch (err) {
      console.error(err);
      setError('Error creating event');
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
        <label className="neo-label">Event Name</label>
        <input 
          type="text" 
          className="neo-input" 
          value={eventName} 
          onChange={e => setEventName(e.target.value)} 
          required 
          placeholder="e.g. Annual Community Gathering"
        />
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Event Place</label>
        <input 
          type="text" 
          className="neo-input" 
          value={eventPlace} 
          onChange={e => setEventPlace(e.target.value)} 
          required 
          placeholder="e.g. Main Hall"
        />
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Event Location (Optional)</label>
        <input 
          type="text" 
          className="neo-input" 
          value={eventLocation} 
          onChange={e => setEventLocation(e.target.value)} 
          placeholder="e.g. 123 Main St, Cityville"
        />
      </div>

      <div className="neo-form-row">
        <div className="neo-form-group">
          <label className="neo-label">Start Date & Time</label>
          <div className="neo-datepicker-wrapper">
            <DatePicker
              selected={eventStart}
              onChange={(date: Date | null) => date && setEventStart(date)}
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
              selected={eventEnd}
              onChange={(date: Date | null) => date && setEventEnd(date)}
              showTimeSelect
              dateFormat="Pp"
              className="neo-input"
              wrapperClassName="w-full"
              minDate={eventStart}
            />
          </div>
        </div>
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Description (Optional)</label>
        <textarea 
          className="neo-input neo-textarea" 
          value={eventDescription} 
          onChange={e => setEventDescription(e.target.value)} 
          placeholder="What is this event about?"
        />
      </div>

      <div className="neo-form-actions">
        <button type="button" className="neo-btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="neo-btn-primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
