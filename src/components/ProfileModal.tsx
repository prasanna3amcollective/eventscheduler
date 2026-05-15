'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { X, User, Mail, Phone, Save, Loader } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  groups?: { group: { name: string } }[];
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserData | null;
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
// ProfileModal
// ---------------------------------------------------------------------------

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdate,
}: ProfileModalProps) {
  const [formData, setFormData] = useState({
    name: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    phone: currentUser?.phone ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Escape key handler + body scroll lock — always called (hooks are invariant)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Reset form data when modal opens or user changes
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        name: currentUser.name ?? '',
        email: currentUser.email ?? '',
        phone: currentUser.phone ?? '',
      });
    }
  }, [isOpen, currentUser]);

  // ── Submit handler ──────────────────────────────────────────────────────
  // (defined BEFORE early return so hook order is stable)

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

  // Guard — AFTER all hooks
  if (!isOpen) return null;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-actions">
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: 600 }}>
            Edit Profile
          </h2>

          <form onSubmit={handleSubmit} className="profile-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>
                <User size={16} /> Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={16} /> Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isSaving}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Save Changes
              </button>
            </div>
          </form>

          {/* Groups Section (Read-only) */}
          {currentUser?.groups && currentUser.groups.length > 0 && (
            <div className="profile-groups-section" style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Groups
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentUser.groups.map((g, i) => (
                  <span 
                    key={i} 
                    style={{ 
                      padding: '4px 12px', 
                      background: 'var(--bg-color)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '16px', 
                      fontSize: '13px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {g.group.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}