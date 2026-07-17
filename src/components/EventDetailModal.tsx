'use client';

import { useState, useRef, useEffect } from 'react';
import EventActivityForm from './EventActivityForm';
import EventResponsibilityForm from './EventResponsibilityForm';
import DatePicker from 'react-datepicker';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { Share2 } from '@/components/Icons';
import 'react-datepicker/dist/react-datepicker.css';

interface EventDetailModalProps {
  event: any;
  isOpen: boolean;
  onClose?: () => void;
  currentUser: any;
  onRefresh?: () => void;
  inline?: boolean;
}

export default function EventDetailModal({ event, isOpen, onClose, currentUser, onRefresh, inline = false }: EventDetailModalProps) {
  const router = useRouter();
  const { setShowRegisterModal } = useAuth();
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showResponsibilityForm, setShowResponsibilityForm] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && event?.activities) {
      const autoId = sessionStorage.getItem('autoRegisterSubActivityId');
      if (autoId) {
        // verify the activity exists in this event
        const exists = event.activities.some((act: any) => act.id === autoId);
        if (exists) {
          sessionStorage.removeItem('autoRegisterSubActivityId');
          handleRegister(autoId);
        }
      }
    }
  }, [currentUser, event?.activities]);

  const [showShareModal, setShowShareModal] = useState(false);
  const shareLink = typeof window !== 'undefined' && event ? `${window.location.origin}/event/${event.id}` : '';

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
          title: `Event: ${event?.name}`,
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

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStart, setEditStart] = useState<Date>(new Date());
  const [editEnd, setEditEnd] = useState<Date>(new Date());
  const [editState, setEditState] = useState('Scheduled');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const prevEventId = useRef<string | null>(null);

  // Auto-enter edit mode for scheduled events, read-only for cancelled/completed
  useEffect(() => {
    if ((!isOpen && !inline) || !event) return;
    if (event.id === prevEventId.current) return;
    prevEventId.current = event.id;

    if (event.state === 'Scheduled') {
      setEditName(event.name || '');
      setEditDescription(event.description || '');
      setEditPlace(event.eventPlace || '');
      setEditLocation(event.eventLocation || '');
      setEditStart(new Date(event.startDateTime));
      setEditEnd(new Date(event.endDateTime));
      setEditState(event.state || 'Scheduled');
      setSaveError(null);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [isOpen, event]);

  if ((!isOpen && !inline) || !event) return null;

  const isOpenEvent = event.state === 'Scheduled';

  const handleRegister = async (activityId: string) => {
    if (!currentUser) {
      sessionStorage.setItem('autoRegisterSubActivityId', activityId);
      setShowRegisterModal(true);
      return;
    }
    setRegistering(activityId);
    try {
      const res = await fetch(`/api/events/${event.id}/activities/${activityId}/register`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to register');
      } else {
        onRefresh?.();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during registration.');
    } finally {
      setRegistering(null);
    }
  };

  const enterEditMode = () => {
    setEditName(event.name || '');
    setEditDescription(event.description || '');
    setEditPlace(event.eventPlace || '');
    setEditLocation(event.eventLocation || '');
    setEditStart(new Date(event.startDateTime));
    setEditEnd(new Date(event.endDateTime));
    setEditState(event.state || 'Scheduled');
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          eventPlace: editPlace,
          eventLocation: editLocation,
          startDateTime: editStart.toISOString(),
          endDateTime: editEnd.toISOString(),
          state: editState
        })
      });
      if (res.ok) {
        setIsEditing(false);
        onRefresh?.();
      } else {
        const data = await res.json();
        setSaveError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error(err);
      setSaveError('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const stateColors: Record<string, string> = {
    Scheduled: 'var(--primary-color)',
    Cancelled: '#ff4444',
    Completed: '#44bb66'
  };

  if (!isOpen && !inline) return null;

  return (
    <div className={inline ? '' : 'modal-overlay'} onClick={inline ? undefined : onClose} style={inline ? {} : { zIndex: 2000 }}>
      <div
        className={`modal-content ${inline ? 'inline-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={inline ? { width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative', top: 'auto', left: 'auto', transform: 'none' } : { maxWidth: '800px', width: '90%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {inline && (
          <div className="modal-header-actions" style={{ position: 'static', marginBottom: '24px', justifyContent: 'flex-start' }}>
            <button className="btn-outline" onClick={() => router.push('/')} style={{ fontSize: '14px', padding: '6px 12px' }}>
              ← Back to Home
            </button>
          </div>
        )}
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: 'var(--bg-color)',
                  border: '2px solid var(--primary-color)',
                  color: 'var(--text-color)',
                  padding: '6px 10px',
                  fontFamily: 'var(--heading-font)',
                  width: '100%',
                  minWidth: '250px'
                }}
              />
            ) : (
              <h2 style={{ color: 'var(--text-color)', margin: 0 }}>{event.name}</h2>
            )}
            <span style={{
              fontSize: '12px',
              fontFamily: 'var(--mono-font)',
              background: stateColors[event.state] || '#888',
              color: event.state === 'Scheduled' ? '#000' : '#fff',
              padding: '3px 10px',
              fontWeight: 'bold',
              border: '1px solid #000',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {event.state}
            </span>
          </div>
          {!inline && (
            <button onClick={onClose} className="modal-close" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              ×
            </button>
          )}
          <button onClick={() => setShowShareModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', marginLeft: '12px' }}>
            <Share2 size={24} />
          </button>
        </div>

        {/* Save Error */}
        {saveError && (
          <div style={{ background: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', padding: '10px 16px', border: '1px solid #ff4444', marginBottom: '16px', fontSize: '14px' }}>
            {saveError}
          </div>
        )}

        {/* Event Details - View or Edit */}
        {isEditing ? (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Start Date & Time</label>
                <DatePicker
                  selected={editStart}
                  onChange={(date: Date | null) => date && setEditStart(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  className="neo-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>End Date & Time</label>
                <DatePicker
                  selected={editEnd}
                  onChange={(date: Date | null) => date && setEditEnd(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  minDate={editStart}
                  className="neo-input"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Place</label>
                <input
                  type="text"
                  value={editPlace}
                  onChange={e => setEditPlace(e.target.value)}
                  className="neo-input"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Location (Optional)</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className="neo-input"
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="neo-input neo-textarea"
                rows={3}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>State</label>
              <select
                value={editState}
                onChange={e => setEditState(e.target.value)}
                className="neo-input"
                style={{ padding: '8px 12px' }}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: 'var(--text-color-muted)' }}>{new Date(event.startDateTime).toLocaleString()} - {new Date(event.endDateTime).toLocaleString()}</p>
            <p style={{ color: 'var(--text-color)', marginTop: '8px' }}><strong>Place:</strong> {event.eventPlace}</p>
            {event.eventLocation && <p style={{ color: 'var(--text-color)' }}><strong>Location:</strong> {event.eventLocation}</p>}
            <p style={{ color: 'var(--text-color)', marginTop: '16px' }}>{event.description}</p>
          </div>
        )}

        <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {isEditing ? (
            <>
              <button
                className="yellow-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {isOpenEvent && (
                <button
                  className="btn-outline"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <>
              <button className="pink-btn" onClick={() => setShowActivityForm(true)}>Add Event Activity</button>
              <button className="pink-btn" onClick={() => setShowResponsibilityForm(true)}>Add Event Responsibility</button>
            </>
          )}
        </div>

        {/* Forms */}
        {showActivityForm && (
          <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0 }}>New Activity</h3>
            <EventActivityForm
              eventId={event.id}
              onSuccess={() => { setShowActivityForm(false); onRefresh?.(); }}
              onCancel={() => setShowActivityForm(false)}
            />
          </div>
        )}

        {showResponsibilityForm && (
          <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0 }}>New Responsibility</h3>
            <EventResponsibilityForm
              eventId={event.id}
              currentUser={currentUser}
              onSuccess={() => { setShowResponsibilityForm(false); onRefresh?.(); }}
              onCancel={() => setShowResponsibilityForm(false)}
            />
          </div>
        )}

        {/* Lists */}
        <div>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Activities</h3>
          {event.activities?.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {event.activities.map((act: any) => {
                const isRegistered = act.participants?.some((p: any) => p.userId === currentUser?.id);
                return (
                  <li key={act.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{act.name}</strong> - {new Date(act.startDateTime).toLocaleTimeString()}
                      <p style={{ fontSize: '0.85em', color: 'var(--text-color-muted)', margin: '4px 0 0 0' }}>{act.participants?.length || 0} participants</p>
                    </div>
                    {isRegistered ? (
                      <span style={{ color: 'var(--primary-color)' }}>Registered</span>
                    ) : (
                      <button
                        onClick={() => handleRegister(act.id)}
                        disabled={registering === act.id}
                        style={{ padding: '6px 12px', background: 'var(--primary-color)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {registering === act.id ? 'Registering...' : 'Register'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : <p style={{ color: 'var(--text-color-muted)' }}>No activities added yet.</p>}
        </div>

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Responsibilities</h3>
          {event.responsibilities?.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {event.responsibilities.map((resp: any) => (
                <li key={resp.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '8px' }}>
                  <strong>{resp.name}</strong> - {new Date(resp.startDateTime).toLocaleTimeString()}
                  <p style={{ fontSize: '0.85em', color: 'var(--text-color-muted)', margin: '4px 0 0 0' }}>Owner: {resp.owner || 'Unassigned'}</p>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: 'var(--text-color-muted)' }}>No responsibilities added yet.</p>}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay fade-in" style={{ zIndex: 3000 }} onClick={() => setShowShareModal(false)}>
          <div className="modal-content activity-detail-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '24px', position: 'relative' }}>
            <div className="modal-header-actions" style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <button onClick={() => setShowShareModal(false)} className="modal-close" title="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>×</span>
              </button>
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: 'var(--mono-font)', fontWeight: 800, textTransform: 'uppercase' }}>Share Event</h3>
            
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