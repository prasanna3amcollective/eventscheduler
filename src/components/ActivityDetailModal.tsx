'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { X, CalendarFill as Calendar, Clock, User as UserIcon, Users, Eye, CheckCircle, Edit } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';
import { GOOGLE_MAPS_LINK } from '@/lib/constants';
import { buildGoogleCalendarUrl } from '@/lib/calendar';
import EditActivityModal from '@/components/EditActivityModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of an activity record from the API or internal calendar events */
interface ActivityData {
  id: string;
  name: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  duration?: number;
  leaders?: string[];
  guides?: string[];
  observers?: string[];
  leader?: string;
  guide?: string;
  observer?: string;
  participantCount?: number;
  participants?: { userId: string, type?: string }[];
  category?: string;
  state?: string;
  recurrenceTemplateId?: string | null;
  generatedFromTemplateId?: string | null;
  detachReason?: 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created';
}

/** Minimal user profile used in the modal */
interface UserData {
  id: string;
  name?: string;
  email?: string;
}

/** Props accepted by the activity detail modal */
interface ActivityDetailModalProps {
  /** The activity to display; null hides the modal */
  activity: ActivityData | null;
  /** Controls modal visibility */
  isOpen: boolean;
  /** Called to close the modal */
  onClose: () => void;
  /** Whether the current user is authenticated */
  isLoggedIn: boolean;
  /** The current user's profile data */
  currentUser: UserData | null;
  /** Roles of the current user */
  userRoles?: string[];
  /** Called after a successful registration */
  onRegisterSuccess: () => void;
  /** Called to switch UI to the registration form */
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Renders an inline error banner with an optional "Register" link.
 * @param error - The error message to display
 * @param onSwitchToRegister - Callback to switch to registration mode
 */
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
              background: 'none', border: 'none', color: 'var(--primary-color)',
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

/** Displays a participant count badge in a neo-brutalist style */
function ParticipantCount({ count }: { count: number }) {
  return (
    <div className="detail-section-divider">
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        border: '2px solid #000000',
        background: 'var(--primary-color)',
        color: '#000000',
        fontFamily: 'var(--mono-font)',
        fontWeight: 800,
        fontSize: '12px',
        textTransform: 'uppercase',
        boxShadow: '4px 4px 0 #000000',
      }}>
        <Users size={16} />
        <span>
          {count} {count === 1 ? 'Participant' : 'Participants'}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Modal dialog displaying detailed information about a single activity.
 * Shows date/time, staff (leaders/guides/observers), and action buttons:
 * - Sync: opens a Google Calendar link to add the event
 * - Manage: links to the staff management page (leaders only)
 * - Switch Responsibility: closes the modal so the user can re-assign roles
 */
export default function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
  isLoggedIn,
  currentUser,
  userRoles = [],
  onRegisterSuccess,
  onSwitchToRegister,
}: ActivityDetailModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // The activity ID to use for API calls (real UUID post-PHASE 6)
  const activityId = activity ? activity.id : '';

  // Whether the current user is a leader of this activity
  const isLeader = useMemo(() => {
    if (!isLoggedIn || !currentUser || !activity?.participants) return false;
    return activity.participants.some(p => p.userId === currentUser.id && p.type === 'Leader');
  }, [isLoggedIn, currentUser, activity?.participants]);

  // Whether the current user is any kind of staff for this activity
  const isStaffForActivity = useMemo(() => {
    if (!isLoggedIn || !currentUser || !activity?.participants) return false;
    return activity.participants.some(p =>
      p.userId === currentUser.id && ['Leader', 'Guide', 'Observer'].includes(p.type || '')
    );
  }, [isLoggedIn, currentUser, activity?.participants]);

  const canEdit = userRoles.includes('core') || userRoles.includes('inhouse') || isLeader;

  // Pre-computed Google Calendar URL for the Sync button
  const googleCalendarUrl = useMemo(
    () => (activity ? buildGoogleCalendarUrl(activity) : ''),
    [activity?.startDateTime, activity?.endDateTime, activity?.duration, activity?.name],
  );

  const startDate = useMemo(
    () => (activity ? new Date(activity.startDateTime) : new Date()),
    [activity?.startDateTime],
  );

  // Whether the current user is already registered for this activity
  const isRegistered = isLoggedIn && activity?.participants?.some(p => p.userId === currentUser?.id);

  /** Handles user registration: POSTs to the register endpoint and shows success/error feedback */
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
      const res = await secureFetch(`/api/activities/${activityId}/register`, {
        method: 'POST',
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
  }, [isLoggedIn, activityId, currentUser, onRegisterSuccess, onClose]);

  /** Handles user unregistration: POSTs to the unregister endpoint */
  const handleUnregister = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    let succeeded = false;
    try {
      const res = await secureFetch(`/api/activities/${activityId}/unregister`, {
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
  }, [isLoggedIn, activityId, onRegisterSuccess, onClose]);

  /** Navigates to the scheduler tab in edit mode for this activity */
  // Open the edit modal inline without navigation
  const [showEditModal, setShowEditModal] = useState(false);
  const handleEdit = useCallback(() => {
    onClose(); // close the activity detail modal first
    setShowEditModal(true); // open the edit modal
  }, [onClose]);

  /** Opens the Google Calendar URL in a new tab */
  const handleSyncCalendar = useCallback(() => {
    if (googleCalendarUrl) {
      globalThis.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
    }
  }, [googleCalendarUrl]);

  if (!activity) return null;
  if (!isOpen && !showEditModal) return null;

  return (
    <>
      {isOpen && (
        <div className="modal-overlay fade-in" onClick={onClose}>
          <div className="modal-content activity-detail-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-actions">
              {canEdit && (
                <button onClick={handleEdit} className="edit-btn-flat" title="Edit Activity">
                  <Edit size={20} />
                </button>
              )}
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <div className="detail-header-flat">
              <div className="detail-category">{activity.category || 'ACTIVITY'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 className="detail-title" style={{ margin: 0 }}>{activity.name}</h2>
                {activity.description && (
                  <p className="detail-description" style={{ marginTop: '8px', marginBottom: '12px', color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                    {activity.description}
                  </p>
                )}
                {activity.state && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '0',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontFamily: 'var(--mono-font)',
                    background: activity.state === 'Completed' ? '#4CE819' : '#EBFF00',
                    color: '#000000',
                    border: '2px solid #000000',
                    boxShadow: '3px 3px 0 #000000',
                  }}>
                    {activity.state === 'Completed' && <CheckCircle size={10} />}
                    {activity.state}
                  </span>
                )}
              </div>
            </div>

            {/* ---------- Body ---------- */}
            <div className="detail-body-flat">
              {/* Date & time — brutalist block */}
              <div className="detail-datetime-row">
                <span className="detail-label"><Clock size={12} /> {format(startDate, 'EEEE')}</span>
                <span className="detail-value">{format(startDate, 'MMM d, yyyy')} · {format(startDate, 'hh:mm aa')} ({activity.duration} mins)</span>
              </div>

              {/* Participant count — neo-brutalist badge */}
              {isLoggedIn && activity.participantCount !== undefined && (
                <ParticipantCount count={activity.participantCount} />
              )}

              {/* Staff Section — neo-brutalist blocks */}
              <div className="detail-staff-section" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(activity.leaders?.length || 0) > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '14px',
                    padding: '10px 14px',
                    border: '2px solid #000000',
                    background: 'var(--surface-color)',
                    boxShadow: '4px 4px 0 #000000',
                  }}>
                    <UserIcon size={14} color="var(--primary-color)" style={{ marginTop: '3px' }} />
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--mono-font)', letterSpacing: '0.1em' }}>Leaders</div>
                      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)', fontSize: '12px', marginTop: '4px' }}>{activity.leaders?.join(', ')}</div>
                    </div>
                  </div>
                )}
                {(activity.guides?.length || 0) > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '14px',
                    padding: '10px 14px',
                    border: '2px solid #000000',
                    background: 'var(--surface-color)',
                    boxShadow: '4px 4px 0 #000000',
                  }}>
                    <Users size={14} color="#10b981" style={{ marginTop: '3px' }} />
                    <div>
                      <div style={{ fontWeight: 800, color: '#10b981', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--mono-font)', letterSpacing: '0.1em' }}>Guides</div>
                      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)', fontSize: '12px', marginTop: '4px' }}>{activity.guides?.join(', ')}</div>
                    </div>
                  </div>
                )}
                {(activity.observers?.length || 0) > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '14px',
                    padding: '10px 14px',
                    border: '2px solid #000000',
                    background: 'var(--surface-color)',
                    boxShadow: '4px 4px 0 #000000',
                  }}>
                    <Eye size={14} color="var(--text-secondary)" style={{ marginTop: '3px' }} />
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--mono-font)', letterSpacing: '0.1em' }}>Observers</div>
                      <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)', fontSize: '12px', marginTop: '4px' }}>{activity.observers?.join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>

              {error && <ErrorBanner error={error} onSwitchToRegister={onSwitchToRegister} />}
            </div>

            {/* ---------- Footer / actions ---------- */}
            <div className="detail-footer-flat">
              {successMessage && (
                <div style={{
                  flex: '0 0 100%',
                  textAlign: 'center',
                  color: '#4CE819',
                  fontSize: '14px',
                  fontWeight: 800,
                  fontFamily: 'var(--mono-font)',
                  marginBottom: '8px',
                  padding: '8px 16px',
                  border: '2px solid #000000',
                  background: 'rgba(76, 232, 25, 0.1)',
                  boxShadow: '3px 3px 0 #000000',
                }}>
                  {successMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', width: '100%', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSyncCalendar}
                  className="yellow-btn green-btn"
                  disabled={!googleCalendarUrl}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <Calendar size={16} />
                    Sync
                  </span>
                </button>

                {isLeader && (
                  <button
                    onClick={() => router.push(`/activities/${activityId}`)}
                    className="yellow-btn"
                    style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      <Users size={16} /> Manage
                    </span>
                  </button>
                )}

                {isStaffForActivity ? null : isRegistered ? (
                  <button
                    className="btn-secondary-brutal"
                    onClick={handleUnregister}
                    disabled={isSubmitting}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isSubmitting ? 'Unregistering...' : 'Unregister'}
                  </button>
                ) : (
                  <button
                    className="btn-secondary-brutal"
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isSubmitting ? 'Registering...' : 'Register'}
                    <CheckCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Inline Edit Activity Modal */}
      {showEditModal && (
        <EditActivityModal
          activityId={activityId}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}