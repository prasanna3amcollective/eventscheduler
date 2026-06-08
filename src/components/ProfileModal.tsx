'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { X, User, Mail, Phone, Save, Loader, Tag, Lock } from '@/components/Icons';
import { SKILLS, type Skill } from '@/lib/constants';

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
  skills: Skill[];
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
  PASSWORD_CURRENT_REQUIRED: 'Current password is required',
  PASSWORD_NEW_REQUIRED: 'New password is required',
  PASSWORD_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_FORMAT: 'Password must contain at least one uppercase letter and one number',
  PASSWORD_CURRENT_INCORRECT: 'Current password is incorrect',
  PASSWORD_RESET_FAILED: 'Failed to reset password',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
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
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', skills: [] as Skill[] });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
      setFormData({ name: currentUser.name ?? '', email: currentUser.email ?? '', phone: currentUser.phone ?? '', skills: currentUser.skills ?? [] });
    }
  }, [isOpen, currentUser]);

  /** Toggles a skill in the skills array */
  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const skills = [...prev.skills];
      const index = skills.indexOf(skill as Skill);
      if (index === -1) {
        skills.push(skill as Skill);
      } else {
        skills.splice(index, 1);
      }
      return { ...prev, skills };
    });
  };

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

  /** Handles password reset form submission */
  const handlePasswordReset = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setPasswordError('');

      if (!passwordData.currentPassword) {
        setPasswordError(ERROR_MESSAGES.PASSWORD_CURRENT_REQUIRED);
        return;
      }
      if (!passwordData.newPassword) {
        setPasswordError(ERROR_MESSAGES.PASSWORD_NEW_REQUIRED);
        return;
      }
      if (passwordData.newPassword.length < 8) {
        setPasswordError(ERROR_MESSAGES.PASSWORD_LENGTH);
        return;
      }
      if (!/[A-Z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword)) {
        setPasswordError(ERROR_MESSAGES.PASSWORD_FORMAT);
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      setIsResettingPassword(true);

      try {
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        if (response.ok) {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setShowPasswordReset(false);
        } else {
          const err = await response.json();
          setPasswordError(err.error ?? ERROR_MESSAGES.PASSWORD_RESET_FAILED);
        }
      } catch (_err) {
        setPasswordError(ERROR_MESSAGES.NETWORK_ERROR);
      } finally {
        setIsResettingPassword(false);
      }
    },
    [passwordData],
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
          <span >{currentUser?.name}</span> <br />
          <br />

          <h2>Edit Profile</h2>
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

          <div className="form-group">
            <label htmlFor="skills">
              <Tag size={14} /> Skills
            </label>
            <input
              id="skills"
              list="profile-skills-options"
              placeholder="Search and select a skill..."
              onChange={(e) => {
                const skill = e.target.value;
                if (SKILLS.includes(skill as Skill) && !formData.skills.includes(skill as Skill)) {
                  toggleSkill(skill);
                  e.target.value = ''; // Reset selection
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission
                }
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color, #e0e0e0)', marginTop: '4px', background: 'var(--bg-color, #fff)', color: 'var(--text-color, #333)' }}
            />
            <datalist id="profile-skills-options">
              {SKILLS.filter(s => !formData.skills.includes(s)).map((skill, index) => (
                <option key={index} value={skill} />
              ))}
            </datalist>
            <div className="selected-skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {formData.skills.map((skill, index) => (
                <span key={index} className="skill-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface-color, #f0f0f0)', padding: '4px 8px', borderRadius: '16px', fontSize: '13px', border: '1px solid var(--border-color, #ccc)' }}>
                  {skill}
                  <button type="button" onClick={() => toggleSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', color: 'inherit' }} aria-label={`Remove ${skill}`}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
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

          <div className="form-group">
            <button
              type="button"
              onClick={() => setShowPasswordReset(!showPasswordReset)}
              className="btn-secondary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Lock size={16} />
              {showPasswordReset ? 'Cancel Password Reset' : 'Change Password'}
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: '8px', width: '100%' }}>
            {isSaving ? <Loader size={18} className="spinning" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {showPasswordReset && (
          <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <div className="form-group">
              <label htmlFor="currentPassword">
                <Lock size={14} /> Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                <Lock size={14} /> New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="New password (min 8 chars, 1 uppercase, 1 number)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={14} /> Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
              />
            </div>

            {passwordError && <div className="error-banner" style={{ margin: 0 }}>{passwordError}</div>}

            <button type="submit" className="btn-primary" disabled={isResettingPassword} style={{ width: '100%' }}>
              {isResettingPassword ? <Loader size={18} className="spinning" /> : <Save size={18} />}
              {isResettingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {error && <div className="error-banner" style={{ margin: 0 }}>{error}</div>}
      </div>
    </div>
  );
}