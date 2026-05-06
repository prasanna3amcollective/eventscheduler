'use client';

import { useState } from 'react';
import { User, Mail, Phone, Lock, Tag, UserPlus, CheckCircle } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: (user: any) => void;
  pendingEventId?: string | null;
}

export default function RegisterForm({ onSuccess, pendingEventId }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    type: 'team'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', username: '', email: '', phone: '', password: '', type: 'team' });
        
        // Auto-enroll if there's a pending event
        if (pendingEventId) {
          try {
            await fetch(`/api/events/${pendingEventId}/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.id })
            });
          } catch (e) {
            console.error("Auto-enrollment failed", e);
          }
        }

        if (onSuccess) {
          setTimeout(() => onSuccess(data), 2000); // Redirect after 2 seconds
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="registration-success fade-in">
        <CheckCircle size={64} color="var(--primary-color)" />
        <h2>Registration Successful!</h2>
        <p>User has been created and can now be searched in the scheduler.</p>
        <button onClick={() => setSuccess(false)} className="btn-primary" style={{ marginTop: '20px' }}>
          Register Another User
        </button>
      </div>
    );
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>User Registration</h2>
        <p>Create a new user account for the system</p>
      </div>

      {error && (
        <div className="warning-banner" style={{ background: '#FFEBEE', color: '#C62828', borderColor: '#FFCDD2' }}>
          <Tag size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label><User size={16} /> Full Name</label>
        <input 
          required 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          placeholder="e.g. Jane Doe" 
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label><User size={16} /> Username</label>
          <input 
            required 
            value={formData.username} 
            onChange={e => setFormData({...formData, username: e.target.value})} 
            placeholder="jdoe" 
          />
        </div>
        <div className="form-group">
          <label><Tag size={16} /> User Type</label>
          <select 
            value={formData.type} 
            onChange={e => setFormData({...formData, type: e.target.value})}
            className="premium-select"
          >
            <option value="core">Core</option>
            <option value="team">Team</option>
            <option value="inhouse">Inhouse</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label><Mail size={16} /> Email Address</label>
          <input 
            type="email" 
            required 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            placeholder="jane@example.com" 
          />
        </div>
        <div className="form-group">
          <label><Phone size={16} /> Phone Number</label>
          <input 
            required 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
            placeholder="+1 234 567 890" 
          />
        </div>
      </div>

      <div className="form-group">
        <label><Lock size={16} /> Password</label>
        <input 
          type="password" 
          required 
          minLength={6}
          value={formData.password} 
          onChange={e => setFormData({...formData, password: e.target.value})} 
          placeholder="••••••••" 
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '10px' }}>
        {isSubmitting ? 'Registering...' : 'Complete Registration'}
        {!isSubmitting && <UserPlus size={18} />}
      </button>
    </form>
  );
}
