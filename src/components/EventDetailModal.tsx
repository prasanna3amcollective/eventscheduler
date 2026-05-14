'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { X, CalendarFill as Calendar, Clock, User as UserIcon, Users, Eye, CheckCircle, Edit } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventData {
  id: string;
  originalId?: string;
  name: string;
  startDateTime: string;
  endDateTime?: string;
  duration?: number;
  leader?: string;
  guide?: string;
  observer?: string;
  participantCount?: number;
  participants?: { userId: string }[];
}

interface UserData {
  id: string;
  name?: string;
  email?: string;
}

interface EventDetailModalProps {
  event: EventData | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  currentUser: UserData | null;
  userRoles?: string[];
  onRegisterSuccess: () => void;
  onSwitchToRegister: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ERROR_MESSAGES = {
  NOT_LOGGED_IN: 'Please login to register.',
  REGISTRATION_FAILED: 'Registration failed',
  UNREGISTER_FAILED: 'Unregister failed',
  NETWORK_ERROR: 'An error occurred',
} as const;

const GOOGLE_MAPS_LINK = '3am Tea Cigaz, 18th Cross St, GOCHS Colony, Besant Nagar, Chennai, Tamil Nadu 600090, India';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toGoogleCalendarDate(date: Date): string {
  if (isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function buildGoogleCalendarUrl(event: EventData, isLoggedIn: boolean): string {
  const startDate = new Date(event.startDateTime);
  if (isNaN(startDate.getTime())) return '';

  const durationMs = (event.duration ?? 60) * 60_000;
  const endMs = event.endDateTime
    ? new Date(event.endDateTime).getTime()
    : startDate.getTime() + durationMs;
  const endDate = new Date(endMs);

  const start = toGoogleCalendarDate(startDate);
  const end = toGoogleCalendarDate(endDate);
  if (!start || !end) return '';

  const details = isLoggedIn
    ? `Leader: ${event.leader}\nGuide: ${event.guide}\nObserver: ${event.observer}`
    : '';

  const query = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(event.name)}`,
    `dates=${start}/${end}`,
    details ? `details=${encodeURIComponent(details)}` : '',
    `location=${encodeURIComponent(GOOGLE_MAPS_LINK)}`,
    'sf=true',
    'output=xml',
  ]
    .filter(Boolean)
    .join('&');

  return `https://www.google.com/calendar/render?${query}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ErrorBanner({
  error,
  onSwitchToRegister,
}: {
  error: string;
  onSwitchToRegister: () => void;
}) {
  const isLoginPrompt = error === ERROR_MESSAGES.NOT_LOGGED_IN;

  return (
    <p className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {isLoginPrompt ? (
        <>
          {error}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none', border: 'none', color: '#1d4ed8',
              textDecoration: 'underline', cursor: 'pointer', padding: 0,
              font: 'inherit', fontWeight: 'bold',
            }}
          >
            Register as a new user?
          </button>
        </>
      ) : (
        error
      )}
    </p>
  );
}

function ParticipantCount({ count }: { count: number }) {
  return (
    <div className="detail-section-divider">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
        <Users size={18} />
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          {count} {count === 1 ? 'Participant' : 'Participants'}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  isLoggedIn,
  currentUser,
  userRoles = [],
  onRegisterSuccess,
  onSwitchToRegister,
}: EventDetailModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const eventId = event ? event.originalId ?? event.id : '';
  const canEdit = userRoles.includes('core') || userRoles.includes('inhouse');
  const isLeader = isLoggedIn && currentUser?.name === event?.leader;
  const googleCalendarUrl = useMemo(
    () => (event ? buildGoogleCalendarUrl(event, isLoggedIn) : ''),
    [event, isLoggedIn],
  );

  const startDate = useMemo(
    () => (event ? new Date(event.startDateTime) : new Date()),
    [event?.startDateTime],
  );

  const isLeaderRole = currentUser?.name === event?.leader;
  const isGuideRole = currentUser?.name === event?.guide;
  const isObserverRole = currentUser?.name === event?.observer;
  const isStaffForEvent = isLoggedIn && (isLeaderRole || isGuideRole || isObserverRole);

  const isRegistered = isLoggedIn && event?.participants?.some(p => p.userId === currentUser?.id);

  const handleRegister = useCallback(async () => {
    if (!isLoggedIn) {
      setError(ERROR_MESSAGES.NOT_LOGGED_IN);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    let succeeded = false;
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser!.id }),
      });
      if (res.ok) {
        onRegisterSuccess();
        setSuccessMessage('Registered successfully!');
        succeeded = true;
        setIsSubmitting(false);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error ?? ERROR_MESSAGES.REGISTRATION_FAILED);
      }
    } catch (_err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      if (!succeeded) {
        setIsSubmitting(false);
      }
    }
  }, [isLoggedIn, eventId, currentUser, onRegisterSuccess, onClose]);

  const handleUnregister = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    let succeeded = false;
    try {
      const res = await fetch(`/api/events/${eventId}/unregister`, {
        method: 'POST',
      });
      if (res.ok) {
        onRegisterSuccess();
        setSuccessMessage('Unregistered successfully!');
        succeeded = true;
        setIsSubmitting(false);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error ?? ERROR_MESSAGES.UNREGISTER_FAILED);
      }
    } catch (_err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      if (!succeeded) {
        setIsSubmitting(false);
      }
    }
  }, [isLoggedIn, eventId, onRegisterSuccess, onClose]);


  const handleEdit = useCallback(() => {
    onClose();
    sessionStorage.setItem('editEventId', eventId);
    router.push('/?tab=scheduler');
  }, [eventId, onClose, router]);

  const handleSyncCalendar = useCallback(() => {
    if (googleCalendarUrl) {
      window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    }
  }, [googleCalendarUrl]);

  if (!isOpen || !event) return null;

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div
        className="modal-content event-detail-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-actions">
          {canEdit && (
            <button onClick={handleEdit} className="edit-btn-flat" title="Edit Event">
              <Edit size={20} />
            </button>
          )}
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ---------- Intimate header: no colored block, just event name ---------- */}
        <div className="detail-header-flat">
          <div className="detail-header-row">
            <div className="detail-category">Event</div>
          </div>
          <h2 className="detail-title">{event.name}</h2>
        </div>

        {/* ---------- Body ---------- */}
        <div className="detail-body-flat">
          {/* Date & time — inline, no big separator */}
          <div className="detail-datetime-row">
            <span className="detail-label"><Clock size={12} /> {format(startDate, 'EEEE')}</span>
            <span className="detail-value">{format(startDate, 'MMM d, yyyy')} · {format(startDate, 'hh:mm aa')} ({event.duration} mins)</span>
          </div>

          {/* Staff — compact, no icons */}
          {isLoggedIn && (
            <>
              <div className="detail-staff-flat">
                <div className="detail-staff-row">
                  <span className="detail-label">Leader</span>
                  <span className="detail-value">{event.leader}</span>
                </div>
                <div className="detail-staff-row">
                  <span className="detail-label">Guide</span>
                  <span className="detail-value">{event.guide}</span>
                </div>
                <div className="detail-staff-row">
                  <span className="detail-label">Observer</span>
                  <span className="detail-value">{event.observer}</span>
                </div>
              </div>

              {event.participantCount !== undefined && (
                <ParticipantCount count={event.participantCount} />
              )}
            </>
          )}

          {error && <ErrorBanner error={error} onSwitchToRegister={onSwitchToRegister} />}
        </div>

        {/* ---------- Footer / actions ---------- */}
        <div className="detail-footer-flat">
          {successMessage && (
            <div style={{
              flex: '0 0 100%',
              textAlign: 'center',
              color: '#22c55e',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              {successMessage}
            </div>
          )}

          <button
            onClick={handleSyncCalendar}
            className="btn-outline"
            disabled={!googleCalendarUrl}
          >
            <Calendar size={16} /> Sync
          </button>

          {isLeader && (
            <a href={`/events/${eventId}`} className="btn-outline">
              <Users size={16} /> Manage
            </a>
          )}

          {isStaffForEvent ? (
            <button className="btn-secondary" onClick={() => {
              onClose();
            }}>
              Switch Responsibility
            </button>
          ) : isRegistered ? (
            <button className="btn-danger" onClick={handleUnregister} disabled={isSubmitting}>
              {isSubmitting ? 'Unregistering...' : 'Unregister'}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleRegister} disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}