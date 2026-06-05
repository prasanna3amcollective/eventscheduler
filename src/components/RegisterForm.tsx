'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { User, Mail, Phone, Lock, Tag, UserPlus, CheckCircle, X } from '@/components/Icons';
import { SKILLS, type Skill } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal user profile returned after successful registration */
interface UserData {
  id: string;
  name: string;
  email?: string;
  skills: Skill[];
}

/** Props for the registration form */
interface RegisterFormProps {
  /** Called with the new user data after successful registration */
  onSuccess?: (user: UserData) => void;
  /** If set, the user will be auto-enrolled in this activity after registration */
  pendingEventId?: string | null;
  /** When true, hides the "User Registration" title and description (useful for popups) */
  hideTitle?: boolean;
  /** Custom text for the submit button (defaults to "Complete Registration") */
  submitText?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ERROR_MESSAGES = {
  REGISTRATION_FAILED: 'Registration failed',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number (7-15 digits)',
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

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

const EMPTY_FORM = { name: '', username: '', email: '', phone: '', password: '', skills: [] };

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
      <button onClick={onReset} className="mt-5 btn-primary">
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
export default function RegisterForm({ onSuccess, pendingEventId, hideTitle = false, submitText = 'Complete Registration' }: RegisterFormProps) {
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
      if (!isValidPhone(formData.phone)) errors.phone = ERROR_MESSAGES.INVALID_PHONE;

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

          // Auto-enroll if there's a pending activity
          await autoEnroll(data.id);

          if (onSuccess) {
            onSuccess(data as UserData);
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

  /** Resets the form state back to the initial empty state */
  const handleReset = useCallback(() => {
    setSuccess(false);
    setError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  if (success) {
    return <RegistrationSuccessView onReset={handleReset} />;
  }

  /** Updates a single form field by key (for text inputs) */
  const updateField =
    (field: 'name' | 'username' | 'email' | 'phone' | 'password') =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      };

  /** Toggles a skill in the skills array */
  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const skills = [...prev.skills];
      const index = skills.indexOf(skill);
      if (index === -1) {
        skills.push(skill);
      } else {
        skills.splice(index, 1);
      }
      return { ...prev, skills };
    });
  };

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      {!hideTitle && (
        <div className="form-header">
          <h2>User Registration</h2>
          <p>Create a new user account for the system</p>
        </div>
      )}

      <ErrorBanner message={error} />

      <div className="form-group">
        <label>
          <User size={16} /> Full Name
        </label>
        <input
          required
          value={formData.name}
          onChange={updateField('name')}
          placeholder="e.g. Kosaksi Pasappugazh"
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
          placeholder="ranjith.pa"
        />
      </div>

      <div className="form-group">
        <label>
          <Mail size={16} /> Email Address
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={updateField('email')}
          placeholder="3amteacigarz@gmail.com"
          className={fieldErrors.email ? 'input-error' : ''}
        />
        {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
      </div>
      <div className="form-group">
        <label>
          <Phone size={16} /> Phone Number
        </label>
        <div className="phone-input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '65%' }}>
          {/* <select
            value={selectedDialCode}
            onChange={(e) => setSelectedDialCode(e.target.value)}
            className="country-select"
            style={{ width: '80px' }}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.dialCode}>
                {c.flag} {c.dialCode}
              </option>
            ))}
          </select> */}
          <input
            required
            type="tel"
            value={formData.phone}
            maxLength={10}
            inputMode="numeric"
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              e.target.value = digits;
              updateField('phone')(e);
            }}
            placeholder="9876543210"
            className={fieldErrors.phone ? 'input-error' : ''}
            style={{ flex: 1 }}
          />
        </div>
        {fieldErrors.phone && <span className="error-text">{fieldErrors.phone}</span>}
      </div>

      <div className="form-group">
        <label>
          <Lock size={16} /> Password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={formData.password}
          onChange={updateField('password')}
          placeholder="••••••••"
          style={{ width: '65%' }}
        />
      </div>

      <div className="form-group">
        <label>
          <Tag size={16} /> Skills
        </label>
        <input
          list="register-skills-options"
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
        <datalist id="register-skills-options">
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="yellow-btn"
        style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
      >
        {isSubmitting ? 'Joining...' : 'Join the Circle'}
        {/* {!isSubmitting && <UserPlus size={18} />} */}
      </button>
    </form>
  );
}