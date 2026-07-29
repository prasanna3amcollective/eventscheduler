'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { CalendarFill as Calendar, Clock, MapPin, Users, CheckCircle, X } from '@/components/Icons';

interface EventBannerModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function EventBannerModal({ event, isOpen, onClose, onRefresh }: EventBannerModalProps) {
  const { isLoggedIn, currentUser, setShowSignInPanel } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subRegistering, setSubRegistering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const isRegistered = isLoggedIn && currentUser && Array.isArray(event.participants) &&
    event.participants.some((p: any) => p.userId === currentUser.id);

  const participantCount = Array.isArray(event.participants) ? event.participants.length : 0;

  const handleRegister = async () => {
    if (!isLoggedIn) {
      setShowSignInPanel(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Successfully registered for event!');
        if (onRefresh) onRefresh();
      } else {
        setError(data.error || 'Failed to register');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    if (!isLoggedIn) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/events/${event.id}/unregister`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Successfully unregistered from event!');
        if (onRefresh) onRefresh();
      } else {
        setError(data.error || 'Failed to unregister');
      }
    } catch (err: any) {
      console.error('Unregistration error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubActivityRegister = async (activityId: string) => {
    if (!isLoggedIn) {
      setShowSignInPanel(true);
      return;
    }
    setSubRegistering(activityId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/events/${event.id}/activities/${activityId}/register`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Registered for activity!');
        if (onRefresh) onRefresh();
      } else {
        setError(data.error || 'Failed to register for activity');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during activity registration.');
    } finally {
      setSubRegistering(null);
    }
  };

  const handleSubActivityUnregister = async (activityId: string) => {
    if (!isLoggedIn) return;
    setSubRegistering(activityId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/events/${event.id}/activities/${activityId}/unregister`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Unregistered from activity!');
        if (onRefresh) onRefresh();
      } else {
        setError(data.error || 'Failed to unregister from activity');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during activity unregistration.');
    } finally {
      setSubRegistering(null);
    }
  };

  return (
    <div className="modal-overlay fade-in" onClick={onClose} style={{ zIndex: 2000 }}>
      <div 
        className="modal-content activity-detail-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '650px', width: '90%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header-actions" style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="detail-header-flat" style={{ marginBottom: '20px' }}>
          <div className="detail-category" style={{ background: '#0891b2', color: '#fff', padding: '4px 10px', display: 'inline-block', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '12px', border: '2px solid #000' }}>
            Event / Activity
          </div>
          <h2 className="detail-title" style={{ margin: 0, fontFamily: 'var(--heading-font)', fontSize: '28px' }}>
            {event.name || event.title}
          </h2>
        </div>

        <div className="detail-body-flat">
          <div className="detail-datetime-row" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            <span>
              {new Date(event.startDateTime).toLocaleDateString()} · {new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {(event.eventPlace || event.eventLocation) && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)' }}>
              <MapPin size={16} />
              <span>
                <strong>{event.eventPlace}</strong> {event.eventLocation ? `(${event.eventLocation})` : ''}
              </span>
            </div>
          )}

          {event.description && (
            <div style={{ color: 'var(--text-color)', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              {event.description}
            </div>
          )}

          {/* Participant badge */}
          <div style={{ marginBottom: '20px' }}>
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
              boxShadow: '3px 3px 0 #000000',
            }}>
              <Users size={16} />
              <span>{participantCount} {participantCount === 1 ? 'Participant' : 'Participants'}</span>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', padding: '10px 14px', border: '2px solid #ff4444', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ background: 'rgba(76, 232, 25, 0.15)', color: '#4CE819', padding: '10px 14px', border: '2px solid #4CE819', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold' }}>
              {successMessage}
            </div>
          )}

          {/* Sub-activities section */}
          <div style={{ marginTop: '24px', borderTop: '2px solid var(--border-color)', paddingTop: '16px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontFamily: 'var(--mono-font)', textTransform: 'uppercase', fontSize: '16px' }}>
              Activities ({event.activities?.length || 0})
            </h3>
            {event.activities && event.activities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {event.activities.map((act: any) => {
                  const isSubRegistered = isLoggedIn && currentUser && Array.isArray(act.participants) &&
                    act.participants.some((p: any) => p.userId === currentUser.id);
                  const subCount = Array.isArray(act.participants) ? act.participants.length : 0;
                  const isProcessing = subRegistering === act.id;

                  return (
                    <div 
                      key={act.id} 
                      style={{ 
                        padding: '12px', 
                        border: '2px solid #000', 
                        background: 'var(--surface-color)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{act.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-color-muted)', marginTop: '2px' }}>
                          {new Date(act.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {subCount} participants
                        </div>
                      </div>

                      {!isLoggedIn ? (
                        <button
                          onClick={() => setShowSignInPanel(true)}
                          style={{ padding: '6px 12px', background: 'var(--primary-color)', color: '#000', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Register
                        </button>
                      ) : isSubRegistered ? (
                        <button
                          onClick={() => handleSubActivityUnregister(act.id)}
                          disabled={isProcessing}
                          style={{ padding: '6px 12px', background: '#ff4444', color: '#fff', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {isProcessing ? '...' : 'Unregister'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubActivityRegister(act.id)}
                          disabled={isProcessing}
                          style={{ padding: '6px 12px', background: 'var(--primary-color)', color: '#000', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {isProcessing ? '...' : 'Register'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text-color-muted)' }}>No sub-activities under this event.</p>
            )}
          </div>
        </div>

        <div className="detail-footer-flat" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          {!isLoggedIn ? (
            <button
              className="btn-secondary-brutal"
              onClick={() => setShowSignInPanel(true)}
              style={{ padding: '10px 20px', fontWeight: 'bold' }}
            >
              Sign In to Register Event
            </button>
          ) : isRegistered ? (
            <button
              className="btn-secondary-brutal"
              onClick={handleUnregister}
              disabled={isSubmitting}
              style={{ padding: '10px 20px', fontWeight: 'bold', background: '#ff4444', color: '#fff' }}
            >
              {isSubmitting ? 'Unregistering...' : 'Unregister Event'}
            </button>
          ) : (
            <button
              className="btn-secondary-brutal"
              onClick={handleRegister}
              disabled={isSubmitting}
              style={{ padding: '10px 20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isSubmitting ? 'Registering...' : 'Register Event'}
              <CheckCircle size={16} />
            </button>
          )}
          <button className="btn-outline" onClick={onClose} style={{ padding: '10px 20px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
