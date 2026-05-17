'use client';

import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { X, CalendarFill as Calendar, Clock, User as UserIcon, Tag, CheckCircle, Loader } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

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

const GOOGLE_MAPS_LINK = '3am Tea Cigaz, 18th Cross St, GOCHS Colony, Besant Nagar, Chennai, Tamil Nadu 600090, India';

function toGoogleCalendarDate(date: Date): string {
  if (isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function buildGoogleCalendarUrl(responsibility: ResponsibilityData): string {
  const startDate = new Date(responsibility.startDateTime);
  if (isNaN(startDate.getTime())) return '';

  const durationMs = (responsibility.duration ?? 60) * 60_000;
  const endMs = responsibility.endDateTime
    ? new Date(responsibility.endDateTime).getTime()
    : startDate.getTime() + durationMs;
  const endDate = new Date(endMs);

  const start = toGoogleCalendarDate(startDate);
  const end = toGoogleCalendarDate(endDate);
  if (!start || !end) return '';

  const query = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(responsibility.name)}`,
    `dates=${start}/${end}`,
    `location=${encodeURIComponent(GOOGLE_MAPS_LINK)}`,
    'sf=true',
    'output=xml',
  ]
    .filter(Boolean)
    .join('&');

  return `https://www.google.com/calendar/render?${query}`;
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
          <button className="modal-close" onClick={onClose}>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            {responsibility.state !== 'Completed' && (
              <button
                onClick={handleComplete}
                className="btn-primary"
                disabled={completing}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {completing ? <Loader size={16} /> : <CheckCircle size={16} />}
                {completing ? 'Completing...' : 'Complete Responsibility'}
              </button>
            )}
            <button
              onClick={handleSyncCalendar}
              className="btn-outline"
              disabled={!googleCalendarUrl}
            >
              <Calendar size={16} /> Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}