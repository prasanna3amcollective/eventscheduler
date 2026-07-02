'use client';

import { useState } from 'react';
import EventActivityForm from './EventActivityForm';
import EventResponsibilityForm from './EventResponsibilityForm';

interface EventDetailModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onRefresh: () => void;
}

export default function EventDetailModal({ event, isOpen, onClose, currentUser, onRefresh }: EventDetailModalProps) {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showResponsibilityForm, setShowResponsibilityForm] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleRegister = async (activityId: string) => {
    setRegistering(activityId);
    try {
      const res = await fetch(`/api/events/${event.id}/activities/${activityId}/register`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to register');
      } else {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during registration.');
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '800px', width: '90%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: 'var(--text-color)', margin: 0 }}>{event.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-color)' }}>×</button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: 'var(--text-color-muted)' }}>{new Date(event.startDateTime).toLocaleString()} - {new Date(event.endDateTime).toLocaleString()}</p>
          <p style={{ color: 'var(--text-color)', marginTop: '8px' }}><strong>Place:</strong> {event.eventPlace}</p>
          {event.eventLocation && <p style={{ color: 'var(--text-color)' }}><strong>Location:</strong> {event.eventLocation}</p>}
          <p style={{ color: 'var(--text-color)', marginTop: '16px' }}>{event.description}</p>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button className="yellow-btn" onClick={() => setShowActivityForm(true)}>Add Event Activity</button>
          <button className="pink-btn" onClick={() => setShowResponsibilityForm(true)}>Add Event Responsibility</button>
        </div>

        {/* Forms */}
        {showActivityForm && (
          <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0 }}>New Activity</h3>
            <EventActivityForm 
              eventId={event.id} 
              onSuccess={() => { setShowActivityForm(false); onRefresh(); }} 
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
              onSuccess={() => { setShowResponsibilityForm(false); onRefresh(); }} 
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
    </div>
  );
}
