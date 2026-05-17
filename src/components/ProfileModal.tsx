'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { X, User, Mail, Phone, Save, Loader } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the user profile for display and editing */
interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  groups?: { group: { name: string } }[];
}

/** Props for the profile edit modal */
interface ProfileModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called to close the modal */
  onClose: () => void;
  /** The current user's profile data */
  currentUser: UserData | null;
  /** Called with the updated user data after a successful save */
  onProfileUpdate: (updatedUser: UserData) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ERROR_MESSAGES = {
  UPDATE_FAILED: 'Failed to update profile',
  NETWORK_ERROR: 'Network error',
} as const;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Modal for editing the current user's profile (name, email, phone).
 * Handles Escape key, body scroll lock, server-side update via PUT,
 * and displays the user's read-only group memberships.
 */
export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdate,
}: ProfileModalProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Escape key handler + body scroll lock — always active while open
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Reset form data when the modal opens or when currentUser changes
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({ name: currentUser.name ?? '', email: currentUser.email ?? '', phone: currentUser.phone ?? '' });
    }
  }, [isOpen, currentUser]);

  /** Submits the updated profile via PUT to /api/user/profile */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setError('');

      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updatedUser: UserData = await response.json();
          onProfileUpdate(updatedUser);
          onClose();
        } else {
          const err = await response.json();
          setError(err.error ?? ERROR_MESSAGES.UPDATE_FAILED);
        }
      } catch (_err) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      } finally {
        setIsSaving(false);
      }
    },
    [formData, onProfileUpdate, onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '500px', padding: '40px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-actions">
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="form-header">
          <h2>Edit Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Update your personal information.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '32px' }}>
          <div className="form-group">
            <label htmlFor="name">
              <User size={14} /> Full Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={14} /> Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              <Phone size={14} /> Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          {currentUser?.groups && currentUser.groups.length > 0 && (
            <div className="form-group">
              <label style={{ marginBottom: '12px' }}>Member of Groups</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentUser.groups.map((g, idx) => (
                  <span key={idx} className="category-badge">
                    {g.group.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <div className="error-banner" style={{ margin: 0 }}>{error}</div>}

          <button type="submit" className="flex items-center justify-center gap-[10px] rounded-[8px] bg-[#b4533d] px-[28px] py-[14px] text-[16px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(180,83,61,0.15)] disabled:opacity-60" disabled={isSaving} style={{ marginTop: '8px' }}>
            {isSaving ? <Loader size={18} className="spinning" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}