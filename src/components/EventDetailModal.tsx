'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, User as UserIcon, Users, Eye, CheckCircle } from 'lucide-react';

interface EventDetailModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  currentUser: any;
  onRegisterSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function EventDetailModal({ 
  event, 
  isOpen, 
  onClose, 
  isLoggedIn, 
  currentUser, 
  onRegisterSuccess,
  onSwitchToRegister
}: EventDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleRegister = async () => {
    if (!isLoggedIn) {
      setError('Please login to register.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.originalId || event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (res.ok) {
        onRegisterSuccess();
        alert('You have successfully registered for this event!');
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGoogleCalendarUrl = () => {
    const start = new Date(event.startDateTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(event.endDateTime || new Date(new Date(event.startDateTime).getTime() + (event.duration || 60) * 60000)).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const details = `Leader: ${event.leader}\nGuide: ${event.guide}\nObserver: ${event.observer}`;
    const location = "https://maps.app.goo.gl/wPcbensawTCQm3Qi6";
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content event-detail-card slide-up">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="detail-header">
          <div className="detail-category">Event Details</div>
          <h2>{event.name}</h2>
        </div>

        <div className="detail-body">
          <div className="detail-row">
            <div className="detail-item">
              <label><Calendar size={14} /> Date</label>
              <span>{format(new Date(event.startDateTime), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="detail-item">
              <label><Clock size={14} /> Time</label>
              <span>{format(new Date(event.startDateTime), 'hh:mm aa')} ({event.duration} mins)</span>
            </div>
          </div>

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

          {error && (
            <p className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {error === 'Please login to register.' ? (
                <>
                  {error} <button 
                    type="button" 
                    onClick={onSwitchToRegister}
                    style={{ background: 'none', border: 'none', color: '#1d4ed8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 'bold' }}
                  >
                    Register as a new user?
                  </button>
                </>
              ) : error}
            </p>
          )}
        </div>

        <div className="detail-footer" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a 
            href={getGoogleCalendarUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '200px' }}
          >
            <Calendar size={18} />
            Sync to Google Calendar
          </a>
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
