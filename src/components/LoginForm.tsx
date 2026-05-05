'use client';

import { useState } from 'react';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>Welcome Back</h2>
        <p>Login to access your event scheduler</p>
      </div>

      {error && (
        <div className="warning-banner" style={{ background: '#FFEBEE', color: '#C62828', borderColor: '#FFCDD2' }}>
          <AlertCircle size={20} />
          <span>
            {error === 'User not found' ? (
              <>
                User not found. <button 
                  type="button" 
                  onClick={onSwitchToRegister}
                  style={{ background: 'none', border: 'none', color: '#1d4ed8', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  register as a new user?
                </button>
              </>
            ) : error}
          </span>
        </div>
      )}

      <div className="form-group">
        <label><User size={16} /> Username</label>
        <input 
          required 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          placeholder="Enter your username" 
        />
      </div>

      <div className="form-group">
        <label><Lock size={16} /> Password</label>
        <input 
          type="password" 
          required 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="••••••••" 
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '10px' }}>
        {isSubmitting ? 'Logging in...' : 'Login'}
        {!isSubmitting && <LogIn size={18} />}
      </button>
    </form>
  );
}
