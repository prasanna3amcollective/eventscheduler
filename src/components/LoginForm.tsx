'use client';

import React, { useState, useCallback } from 'react';
import { User, Lock, LogIn, AlertCircle } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal user profile used during login (mirrors session server response) */
interface UserData {
  id: string;
  name: string;
  email?: string;
  type?: string;
}

/** Props for the login form */
interface LoginFormProps {
  /** Called with user data on successful login */
  readonly onLoginSuccess: (user: UserData) => void;
  /** Called when the user clicks "register as a new user?" */
  readonly onSwitchToRegister: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  LOGIN_FAILED: 'Login failed',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Error banner for the login form.
 * When the error is USER_NOT_FOUND, appends a "register as a new user?" link.
 */
function ErrorBanner({
  error,
  onSwitchToRegister,
}: {
  readonly error: string;
  readonly onSwitchToRegister: () => void;
}) {
  const isUserNotFound = error === ERROR_MESSAGES.USER_NOT_FOUND;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle size={20} />
      <span>
        {isUserNotFound ? (
          <>
            User not found.{' '}
            <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#1d4ed8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}>
              register as a new user?
            </button>
          </>
        ) : (
          error
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Login form that accepts a username and password, POSTs them to /api/login,
 * and calls onLoginSuccess with the returned user data.
 * Shows an inline error banner on failure and a "register" link for unknown users.
 */
export default function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Submits the credentials via POST and forwards the user data on success */
  const handleSubmit = useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        });

        const data = await res.json();

        if (res.ok) {
          onLoginSuccess(data.user as UserData);
        } else {
          setError(data.error ?? ERROR_MESSAGES.LOGIN_FAILED);
        }
      } catch (_err) {
        setError(ERROR_MESSAGES.UNEXPECTED_ERROR);
      } finally {
        setIsSubmitting(false);
      }
    },
    [phone, password, onLoginSuccess],
  );

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>Welcome Back</h2>
        <p>Login to access your activity scheduler</p>
      </div>

      {error && <ErrorBanner error={error} onSwitchToRegister={onSwitchToRegister} />}

      <div className="form-group">
        <label>
          <User size={16} /> Phone Number
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
        />
      </div>

      <div className="form-group">
        <label>
          <Lock size={16} /> Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
        style={{ marginTop: '10px' }}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
        {!isSubmitting && <LogIn size={18} />}
      </button>
    </form>
  );
}