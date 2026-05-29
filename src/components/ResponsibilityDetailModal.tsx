'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { X, CalendarFill as Calendar, Clock, User as UserIcon, Tag, CheckCircle, Loader, Edit, XCircle } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';
import { buildGoogleCalendarUrl } from '@/lib/calendar';

interface ResponsibilityData {
  id: string;
  name: string;
  startDateTime: string;
  endDateTime?: string;
  duration?: number;
  category?: string;
  state?: string;
  owner?: string;
}

interface ResponsibilityDetailModalProps {
  responsibility: ResponsibilityData | null;
  isOpen: boolean;
  onClose: () => void;
  onStateChange?: (id: string, newState: string) => void;
}

export default function ResponsibilityDetailModal({
  responsibility,
  isOpen,
  onClose,
  onStateChange,
}: ResponsibilityDetailModalProps) {
  const googleCalendarUrl = useMemo(
    () => (responsibility ? buildGoogleCalendarUrl(responsibility) : ''),
    [responsibility],
  );

  const router = useRouter();

  const handleCancel = async () => {
    if (!responsibility) return;
    const confirm = window.confirm('Are you sure you want to cancel this responsibility?');
    if (!confirm) return;
    try {
      const res = await secureFetch(`/api/responsibilities/${responsibility.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detachReason: 'cancelled', state: 'Cancelled' })
      });
      if (res.ok) {
        onStateChange?.(responsibility.id, 'Cancelled');
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel responsibility');
      }
    } catch (err) {
      console.error('Cancel error', err);
      alert('Error cancelling responsibility');
    }
  };

  const startDate = useMemo(
    () => (responsibility ? new Date(responsibility.startDateTime) : new Date()),
    [responsibility],
  );

  const [completing, setCompleting] = useState(false);

  const handleComplete = useCallback(async () => {
    if (!responsibility || completing) return;
    setCompleting(true);
    try {
      const res = await secureFetch(`/api/responsibilities/${responsibility.id}/complete`, {
        method: 'PATCH',
      });
      if (res.ok) {
        onStateChange?.(responsibility.id, 'Completed');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to complete responsibility');
      }
    } catch (err) {
      console.error('Failed to complete responsibility', err);
      alert('An error occurred while completing the responsibility');
    } finally {
      setCompleting(false);
    }
  }, [responsibility, completing, onStateChange]);

  const handleSyncCalendar = useCallback(() => {
    if (googleCalendarUrl) {
      window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    }
  }, [googleCalendarUrl]);

  if (!isOpen || !responsibility) return null;

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div
        className="modal-content activity-detail-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-actions">
          <button onClick={() => router.push(`/responsibilities/${responsibility.id}/edit`)} className="edit-btn-flat" title="Edit responsibility">
            <Edit size={20} />
          </button>
          {/* <button onClick={handleCancel} className="cancel-button" title="Cancel responsibility">
            <XCircle size={20} />
          </button> */}
          <button onClick={onClose} className="modal-close" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="detail-header-flat">
          <div className="detail-category">Responsibility</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="detail-title" style={{ margin: 0 }}>{responsibility.name}</h2>
            {responsibility.state && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: responsibility.state === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                color: responsibility.state === 'Completed' ? '#10b981' : '#3b82f6',
                border: `1px solid ${responsibility.state === 'Completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              }}>
                {responsibility.state === 'Completed' ? <CheckCircle size={12} /> : null}
                {responsibility.state}
              </span>
            )}
          </div>
        </div>

        <div className="detail-body-flat">
          <div className="detail-datetime-row">
            <span className="detail-label"><Clock size={12} /> {format(startDate, 'EEEE')}</span>
            <span className="detail-value">{format(startDate, 'MMM d, yyyy')} · {format(startDate, 'hh:mm aa')} ({responsibility.duration} mins)</span>
          </div>

          <div className="detail-staff-section" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {responsibility.owner && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                <UserIcon size={14} color="var(--primary-color)" style={{ marginTop: '3px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Owner</div>
                  <div style={{ color: 'var(--text-primary)' }}>{responsibility.owner}</div>
                </div>
              </div>
            )}
            {responsibility.category && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                <Tag size={14} color="var(--text-secondary)" style={{ marginTop: '3px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Category</div>
                  <div style={{ color: 'var(--text-primary)' }}>{responsibility.category}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="detail-footer-flat">
          {responsibility.state !== 'Completed' && (
            <button
              onClick={handleComplete}
              className="btn-secondary"
              disabled={completing}
            >
              {completing ? <Loader size={16} /> : <CheckCircle size={16} />}
              {completing ? 'Completing...' : 'Complete Responsibility'}
            </button>
          )}
          <button
            onClick={handleSyncCalendar}
            className="btn-secondary"
            disabled={!googleCalendarUrl}
          >
            <Calendar size={16} /> Sync
          </button>
        </div>
      </div>
    </div>
  );
}