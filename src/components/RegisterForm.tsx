'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { User, Mail, Phone, Lock, Tag, UserPlus, CheckCircle } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserData {
  id: string;
  name: string;
  email?: string;
  type?: string;
}

interface RegisterFormProps {
  onSuccess?: (user: UserData) => void;
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
const EMPTY_FORM = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  type: 'team',
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RegistrationSuccessView({
  onReset,
}: {
  onReset: () => void;
}) {
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

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="warning-banner"
      style={{
        background: '#FFEBEE',
        color: '#C62828',
        borderColor: '#FFCDD2',
      }}
    >
      <Tag size={20} />
      <span>{message}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RegisterForm
// ---------------------------------------------------------------------------

export default function RegisterForm({ onSuccess, pendingEventId }: RegisterFormProps) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [selectedDialCode, setSelectedDialCode] = useState('+91');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string }>({});

  // ── Auto-enroll user in a pending event ────────────────────────────────

  const autoEnroll = useCallback(
    async (userId: string) => {
      if (!pendingEventId) return;
      try {
        await fetch(`/api/events/${pendingEventId}/register`, {
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

  // ── Submit handler ─────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      setFieldErrors({});

      // Client-side validation
      const errors: { email?: string; phone?: string } = {};
      if (!EMAIL_REGEX.test(formData.email)) {
        errors.email = ERROR_MESSAGES.INVALID_EMAIL;
      }
      if (!PHONE_REGEX.test(formData.phone)) {
        errors.phone = ERROR_MESSAGES.INVALID_PHONE;
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setIsSubmitting(false);
        return;
      }

      try {
        const payload = {
          ...formData,
          phone: `${selectedDialCode}${formData.phone}`,
        };

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess(true);
          setFormData({ ...EMPTY_FORM });

          // Auto-enroll if there's a pending event
          await autoEnroll(data.id);

          if (onSuccess) {
            setTimeout(() => onSuccess(data as UserData), AUTO_ENROLL_DELAY_MS);
          }
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

  // ── Reset callback ─────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setSuccess(false);
    setError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  if (success) {
    return <RegistrationSuccessView onReset={handleReset} />;
  }

  const updateField =
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>User Registration</h2>
        <p>Create a new user account for the system</p>
      </div>

      <ErrorBanner message={error} />

      <div className="form-group">
        <label>
          <User size={16} /> Full Name
        </label>
        <input
          required
          value={formData.name}
          onChange={updateField('name')}
          placeholder="e.g. Jane Doe"
        />
      </div>

      <div className="form-group">
        <label>
          <User size={16} /> Username
        </label>
        <input
          required
          value={formData.username}
          onChange={updateField('username')}
          placeholder="jdoe"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>
            <Mail size={16} /> Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={updateField('email')}
            placeholder="jane@example.com"
            className={fieldErrors.email ? 'input-error' : ''}
          />
          {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
        </div>
        <div className="form-group">
          <label>
            <Phone size={16} /> Phone Number
          </label>
          <div className="phone-input-group">
            <select
              value={selectedDialCode}
              onChange={(e) => setSelectedDialCode(e.target.value)}
              className="country-select"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.dialCode}>
                  {c.flag} {c.dialCode}
                </option>
              ))}
            </select>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={updateField('phone')}
              placeholder="9876543210"
              className={fieldErrors.phone ? 'input-error' : ''}
            />
          </div>
          {fieldErrors.phone && <span className="error-text">{fieldErrors.phone}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>
          <Lock size={16} /> Password
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={formData.password}
          onChange={updateField('password')}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
        style={{ marginTop: '10px' }}
      >
        {isSubmitting ? 'Registering...' : 'Complete Registration'}
        {!isSubmitting && <UserPlus size={18} />}
      </button>
    </form>
  );
}