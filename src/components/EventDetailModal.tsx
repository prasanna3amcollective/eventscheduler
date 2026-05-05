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
}

export default function EventDetailModal({ event, isOpen, onClose, isLoggedIn, currentUser, onRegisterSuccess }: EventDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleRegister = async () => {
    if (!isLoggedIn) {
      alert('Please login first to register for this event.');
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

          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="detail-footer">
          <button 
            className="btn-primary register-btn" 
            onClick={handleRegister} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register for Event'}
            <CheckCircle size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
