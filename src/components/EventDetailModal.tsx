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
  NETWORK_ERROR: 'An error occurred',
} as const;

const GOOGLE_MAPS_LINK = '3am Tea Cigaz, 18th Cross St, GOCHS Colony, Besant Nagar, Chennai, Tamil Nadu 600090, India';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely produce a Google Calendar date string from a Date.
 * Returns an empty string for invalid dates instead of throwing.
 * Example: "2026-06-05T09:00:00.000Z" → "20260605T090000Z".
 */
function toGoogleCalendarDate(date: Date): string {
  if (isNaN(date.getTime())) return '';
  // Remove separators and milliseconds: "2026-06-05T09:00:00.000Z" → "20260605T090000Z"
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

/**
 * Build a Google Calendar event URL. Returns '' for missing/invalid dates.
 */
function buildGoogleCalendarUrl(event: EventData, isLoggedIn: boolean): string {
  const startDate = new Date(event.startDateTime);
  if (isNaN(startDate.getTime())) return '';

  // Compute the end date – prefer explicit endDateTime, fall back to duration.
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

  // Build the URL manually — URLSearchParams encodes newlines differently
  // across browsers, so we use encodeURIComponent explicitly.
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
    <p
      className="error-message"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {isLoginPrompt ? (
        <>
          {error}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#1d4ed8',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
              fontWeight: 'bold',
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
    <div
      style={{
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--primary-color)',
        }}
      >
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

  // ----- Derived values (ALWAYS called before any early return) ----------

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

  // ----- Handlers (ALWAYS called before any early return) -----------------

  const handleRegister = useCallback(async () => {
    if (!isLoggedIn) {
      setError(ERROR_MESSAGES.NOT_LOGGED_IN);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser!.id }),
      });

      if (res.ok) {
        onRegisterSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error ?? ERROR_MESSAGES.REGISTRATION_FAILED);
      }
    } catch (_err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }, [isLoggedIn, eventId, currentUser, onRegisterSuccess, onClose]);

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

  // ----- Guard: modal closed or no event (AFTER all hooks) ---------------

  if (!isOpen || !event) {
    return null;
  }

  // ----- Render ----------------------------------------------------------

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content event-detail-card slide-up">
        {/* ---------- Close button ---------- */}
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* ---------- Header ---------- */}
        <div className="detail-header">
          <div className="detail-header-content">
            <div>
              <div className="detail-category">Event Details</div>
              <h2>{event.name}</h2>
            </div>

            {canEdit && (
              <button onClick={handleEdit} className="edit-button" title="Edit Event">
                <Edit size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ---------- Body ---------- */}
        <div className="detail-body">
          {/* Date & time */}
          <div className="detail-row">
            <div className="detail-item">
              <label>
                <Calendar size={14} /> Date
              </label>
              <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="detail-item">
              <label>
                <Clock size={14} /> Time
              </label>
              <span>
                {format(startDate, 'hh:mm aa')} ({event.duration} mins)
              </span>
            </div>
          </div>

          {/* Staff details (logged-in only) */}
          {isLoggedIn && (
            <>
              <div className="detail-staff">
                <div className="staff-item">
                  <UserIcon size={16} />
                  <div className="staff-info">
                    <label>Leader</label>
                    <span>{event.leader}</span>
                  </div>
                </div>
                <div className="staff-item">
                  <Users size={16} />
                  <div className="staff-info">
                    <label>Guide</label>
                    <span>{event.guide}</span>
                  </div>
                </div>
                <div className="staff-item">
                  <Eye size={16} />
                  <div className="staff-info">
                    <label>Observer</label>
                    <span>{event.observer}</span>
                  </div>
                </div>
              </div>

              {event.participantCount !== undefined && (
                <ParticipantCount count={event.participantCount} />
              )}
            </>
          )}

          {/* Error message */}
          {error && <ErrorBanner error={error} onSwitchToRegister={onSwitchToRegister} />}
        </div>

        {/* ---------- Footer / actions ---------- */}
        <div
          className="detail-footer"
          style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
        >
          {/* Google Calendar button */}
          <button
            onClick={handleSyncCalendar}
            className="btn-secondary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minWidth: '200px',
              cursor: googleCalendarUrl ? 'pointer' : 'not-allowed',
              opacity: googleCalendarUrl ? 1 : 0.5,
            }}
            disabled={!googleCalendarUrl}
          >
            <Calendar size={18} />
            Sync to Google Calendar
          </button>

          {/* Manage Event (leader only) */}
          {isLeader && (
            <a
              href={`/events/${eventId}`}
              className="btn-primary"
              style={{
                flex: 1,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minWidth: '200px',
              }}
            >
              <Users size={18} />
              Manage Event
            </a>
          )}

          {/* Register */}
          <button
            className="btn-primary register-btn"
            onClick={handleRegister}
            disabled={isSubmitting}
            style={{ flex: 1, minWidth: '200px' }}
          >
            {isSubmitting ? 'Registering...' : 'Register for Event'}
            <CheckCircle size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}