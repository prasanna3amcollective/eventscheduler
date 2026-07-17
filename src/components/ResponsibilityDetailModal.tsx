'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { X, CalendarFill as Calendar, Clock, User as UserIcon, Tag, CheckCircle, Loader, Edit, XCircle, Share2 } from '@/components/Icons';
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
  onClose?: () => void;
  onStateChange?: (id: string, newState: string) => void;
  inline?: boolean;
}

export default function ResponsibilityDetailModal({
  responsibility,
  isOpen,
  onClose,
  onStateChange,
  inline = false,
}: ResponsibilityDetailModalProps) {
  const googleCalendarUrl = useMemo(
    () => (responsibility ? buildGoogleCalendarUrl(responsibility) : ''),
    [responsibility],
  );

  const [showShareModal, setShowShareModal] = useState(false);
  const shareLink = typeof window !== 'undefined' && responsibility ? `${window.location.origin}/responsibility/${responsibility.id}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert('Link copied to clipboard!');
      setShowShareModal(false);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareTo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Responsibility: ${responsibility?.name}`,
          url: shareLink
        });
        setShowShareModal(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Error sharing:', err);
      }
    } else {
      alert('Share API is not supported in this browser. Please copy the link instead.');
    }
  };

  const router = useRouter();

  const handleCancel = async () => {
    if (!responsibility) return;
    const confirm = globalThis.confirm('Are you sure you want to cancel this responsibility?');
    if (!confirm) return;
    try {
      const res = await secureFetch(`/api/responsibilities/${responsibility.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detachReason: 'cancelled', state: 'Cancelled' })
      });
      if (res.ok) {
        onStateChange?.(responsibility.id, 'Cancelled');
        onClose?.();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to  ponsibility');
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
      globalThis.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    }
  }, [googleCalendarUrl]);

  if ((!isOpen && !inline) || !responsibility) return null;

  return (
    <div className={inline ? '' : 'modal-overlay fade-in'} onClick={inline ? undefined : onClose}>
      <div
        className={`modal-content activity-detail-card ${inline ? 'inline-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={inline ? { width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative', top: 'auto', left: 'auto', transform: 'none' } : {}}
      >
        <div className="modal-header-actions" style={inline ? { position: 'static', marginBottom: '24px', justifyContent: 'flex-start' } : {}}>
          {inline ? (
            <button className="btn-outline" onClick={() => router.push('/')} style={{ fontSize: '14px', padding: '6px 12px' }}>
              ← Back to Home
            </button>
          ) : (
            <button onClick={onClose} className="modal-close" title="Close">
              <X size={20} />
            </button>
          )}
          {!inline && (
            <button onClick={() => { onClose?.(); router.push(`/responsibilities/${responsibility.id}/edit`); }} className="edit-btn-flat" title="Edit responsibility">
              <Edit size={20} />
            </button>
          )}
          <button onClick={() => setShowShareModal(true)} className="edit-btn-flat" title="Share responsibility" style={{ marginLeft: '8px' }}>
            <Share2 size={20} />
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
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', width: '100%', justifyContent: 'flex-end' }}>
            {responsibility.state !== 'Completed' && (
              <button
                onClick={handleComplete}
                className="pink-btn"
                disabled={completing}
                style={{ whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  {completing ? <Loader size={16} /> : <CheckCircle size={16} />}
                  {completing ? 'Completing...' : 'Complete Responsibility'}
                </span>
              </button>
            )}
            <button
              onClick={handleSyncCalendar}
              className="yellow-btn green-btn"
              disabled={!googleCalendarUrl}
              style={{ whiteSpace: 'nowrap' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Calendar size={16} />
                Sync
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay fade-in" style={{ zIndex: 3000 }} onClick={() => setShowShareModal(false)}>
          <div className="modal-content activity-detail-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
            <div className="modal-header-actions">
              <button onClick={() => setShowShareModal(false)} className="modal-close" title="Close">
                <X size={20} />
              </button>
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: 'var(--mono-font)', fontWeight: 800, textTransform: 'uppercase' }}>Share Responsibility</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', border: '2px solid #000', padding: '8px 12px', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap', fontSize: '14px', fontFamily: 'var(--mono-font)' }}>
              {shareLink}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleCopyLink} className="btn-primary-brutal" style={{ flex: 1, padding: '10px', fontSize: '14px' }}>
                Copy Link
              </button>
              <button onClick={handleShareTo} className="btn-secondary-brutal" style={{ flex: 1, padding: '10px', fontSize: '14px' }}>
                Share To...
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}