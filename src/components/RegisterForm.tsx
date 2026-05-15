'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { User, Mail, Phone, Lock, Tag, UserPlus, CheckCircle } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal user profile returned after successful registration */
interface UserData {
  id: string;
  name: string;
  email?: string;
}

/** Props for the registration form */
interface RegisterFormProps {
  /** Called with the new user data after successful registration */
  onSuccess?: (user: UserData) => void;
  /** If set, the user will be auto-enrolled in this activity after registration */
  pendingEventId?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ERROR_MESSAGES = {
  REGISTRATION_FAILED: 'Registration failed',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number (10 digits)',
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const COUNTRY_CODES = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
] as const;

const AUTO_ENROLL_DELAY_MS = 2000;
const EMPTY_FORM = { name: '', username: '', email: '', phone: '', password: '' } as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Shown after successful registration; offers a button to register another user */
function RegistrationSuccessView({ onReset }: { onReset: () => void }) {
  return (
    <div className="registration-success fade-in">
      <CheckCircle size={64} color="var(--primary-color)" />
      <h2>Registration Successful!</h2>
      <p>User has been created and can now be searched in the scheduler.</p>
      <button onClick={onReset} className="btn-primary" style={{ marginTop: '20px' }}>
        Register Another User
      </button>
    </div>
  );
}

/** Inline error banner for form-level validation errors */
function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="warning-banner" style={{ background: '#FFEBEE', color: '#C62828', borderColor: '#FFCDD2' }}>
      <Tag size={20} />
      <span>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Registration form for creating new user accounts.
 * Collects name, username, email, phone (with country code), and password.
 * Performs client-side validation, submits to the API, and optionally auto-enrolls
 * the new user in a pending activity.
 */
export default function RegisterForm({ onSuccess, pendingEventId }: RegisterFormProps) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [selectedDialCode, setSelectedDialCode] = useState('+91');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string }>({});

  /** Auto-enroll the newly created user in a pending activity (if pendingEventId is set) */
  const autoEnroll = useCallback(
    async (userId: string) => {
      if (!pendingEventId) return;
      try {
        await fetch(`/api/activities/${pendingEventId}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch (e) {
        console.error('Auto-enrollment failed', e);
      }
    },
    [pendingEventId],
  );

  /**
   * Handles form submission: validates input, creates the user via POST,
   * then optionally auto-enrolls and calls onSuccess.
   */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      setFieldErrors({});

      // Client-side validation
      const errors: { email?: string; phone?: string } = {};
      if (!EMAIL_REGEX.test(formData.email)) errors.email = ERROR_MESSAGES.INVALID_EMAIL;
      if (!PHONE_REGEX.test(formData.phone)) errors.phone = ERROR_MESSAGES.INVALID_PHONE;

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsSubmitting(false);
        return;
      }

      try {
        const payload = { ...formData, phone: `${selectedDialCode}${formData.phone}` };
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
          setSuccess(true);
          setFormData({ ...EMPTY_FORM });
          await autoEnroll(data.id);
          if (onSuccess) setTimeout(() => onSuccess(data as UserData), AUTO_ENROLL_DELAY_MS);
        } else {
          setError(data.error ?? ERROR_MESSAGES.REGISTRATION_FAILED);
        }
      } catch (_err) {
        setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, selectedDialCode, onSuccess, autoEnroll],
  );

  /** Resets the form state back to the initial empty state */
  const handleReset = useCallback(() => {
    setSuccess(false);
    setError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  if (success) return <RegistrationSuccessView onReset={handleReset} />;

  /** Updates a single form field by key */
  const updateField =
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      };

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      {/* ... form fields, submit button ... */}
    </form>
  );
}