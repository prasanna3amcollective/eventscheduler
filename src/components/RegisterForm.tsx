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

const USER_TYPE_OPTIONS = [
  { value: 'core', label: 'Core' },
  { value: 'team', label: 'Team' },
  { value: 'inhouse', label: 'Inhouse' },
] as const;

const ERROR_MESSAGES = {
  REGISTRATION_FAILED: 'Registration failed',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
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
    [formData, onSuccess, autoEnroll],
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

      <div className="form-row">
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
        <div className="form-group">
          <label>
            <Tag size={16} /> User Type
          </label>
          <select
            value={formData.type}
            onChange={updateField('type')}
            className="premium-select"
          >
            {USER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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
          />
        </div>
        <div className="form-group">
          <label>
            <Phone size={16} /> Phone Number
          </label>
          <input
            required
            value={formData.phone}
            onChange={updateField('phone')}
            placeholder="+1 234 567 890"
          />
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