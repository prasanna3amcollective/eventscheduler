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

  return (/* ... modal JSX with form and read-only groups ... */);
}