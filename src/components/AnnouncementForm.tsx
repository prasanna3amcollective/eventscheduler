'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface AnnouncementFormProps {
  initialData?: any;
  onSuccess: (announcement: any) => void;
  onCancel: () => void;
}

export default function AnnouncementForm({ initialData, onSuccess, onCancel }: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [type, setType] = useState(initialData?.type || 'General Info');
  const [expiresAt, setExpiresAt] = useState<Date | null>(initialData?.expiresAt ? new Date(initialData.expiresAt) : null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = isEdit ? `/api/announcements/${initialData.id}` : '/api/announcements';
      const method = isEdit ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          type,
          expiresAt: expiresAt ? expiresAt.toISOString() : null
        })
      });
      if (res.ok) {
        const resultAnnouncement = await res.json();
        onSuccess(resultAnnouncement);
      } else {
        const data = await res.json();
        setError(data.error || `Failed to ${isEdit ? 'update' : 'create'} announcement`);
      }
    } catch (err) {
      console.error(err);
      setError(`Error ${isEdit ? 'updating' : 'creating'} announcement`);
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
        <label className="neo-label">Headline</label>
        <input 
          type="text" 
          className="neo-input" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
          placeholder="What's happening?"
        />
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Category</label>
        <select
          className="neo-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        >
          <option value="General Info">General Info</option>
          <option value="Event Update">Event Update</option>
          <option value="Community Call">Community Call</option>
          <option value="Urgent">Urgent Alert</option>
        </select>
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Details</label>
        <textarea 
          className="neo-input neo-textarea" 
          rows={4}
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          required 
          placeholder="Share the details with the community..."
        />
      </div>

      <div className="neo-form-group">
        <label className="neo-label">Expiration Date (Optional)</label>
        <DatePicker
          selected={expiresAt}
          onChange={(date: Date | null) => setExpiresAt(date)}
          className="neo-input"
          placeholderText="When should this disappear?"
          isClearable
          showTimeSelect
          dateFormat="Pp"
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <button type="submit" className="yellow-btn" disabled={submitting}>
          {submitting ? 'Weaving...' : (isEdit ? 'Update Announcement' : 'Co-Create Announcement')}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
