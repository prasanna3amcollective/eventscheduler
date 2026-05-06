'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { User, Lock, LogIn, AlertCircle } from '@/components/Icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserData {
  id: string;
  name: string;
  email?: string;
  type?: string;
}

interface LoginFormProps {
  onLoginSuccess: (user: UserData) => void;
  onSwitchToRegister: () => void;
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

function ErrorBanner({
  error,
  onSwitchToRegister,
}: {
  error: string;
  onSwitchToRegister: () => void;
}) {
  if (!error) return null;

  const isUserNotFound = error === ERROR_MESSAGES.USER_NOT_FOUND;

  return (
    <div
      className="warning-banner"
      style={{
        background: '#FFEBEE',
        color: '#C62828',
        borderColor: '#FFCDD2',
      }}
    >
      <AlertCircle size={20} />
      <span>
        {isUserNotFound ? (
          <>
            User not found.{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: '#1d4ed8',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
              }}
            >
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
// LoginForm
// ---------------------------------------------------------------------------

export default function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
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
    [username, password, onLoginSuccess],
  );

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>Welcome Back</h2>
        <p>Login to access your event scheduler</p>
      </div>

      <ErrorBanner error={error ?? ''} onSwitchToRegister={onSwitchToRegister} />

      <div className="form-group">
        <label>
          <User size={16} /> Username
        </label>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
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