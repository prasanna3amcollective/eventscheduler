'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, XCircle } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';
import { formatISO } from 'date-fns';

// Edit Responsibility Page (Modal)
export default function ResponsibilityEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const [responsibility, setResponsibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch responsibility data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await secureFetch(`/api/responsibilities/${id}`);
        if (res.ok) {
          const data = await res.json();
          setResponsibility(data);
        } else {
          alert('Failed to load responsibility');
        }
      } catch (err) {
        console.error(err);
        alert('Error loading responsibility');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Fetch users for owner autocomplete
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await secureFetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    }
    fetchUsers();
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setResponsibility((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ownerId = allUsers.find((u) => u.name === responsibility.owner)?.id || null;
      const payload = {
        name: responsibility.name,
        startDateTime: responsibility.startDateTime,
        duration: Number(responsibility.duration),
        category: responsibility.category,
        owner: responsibility.owner,
        ownerId,
        state: responsibility.state,
      };
      const res = await secureFetch(`/api/responsibilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Refresh the data so the list reflects ownership change
        router.refresh();
        router.back(); // close modal / go back to previous view
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving responsibility');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelResponsibility = async () => {
    if (!responsibility) return;
    const confirm = window.confirm('Are you sure you want to cancel this responsibility?');
    if (!confirm) return;
    try {
      const res = await secureFetch(`/api/responsibilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detachReason: 'cancelled', state: 'Cancelled' })
      });
      if (res.ok) {
        router.refresh();
        router.back(); // close modal after canceling
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel responsibility');
      }
    } catch (err) {
      console.error('Cancel error', err);
      alert('Error cancelling responsibility');
    }
  };

  const handleClose = () => {
    router.push('/responsibilities');
  };

  if (loading) return null;

  return (
    <div className="modal-overlay fade-in" onClick={handleClose} style={overlayStyle}>
      <div className="modal-content edit-responsibility-card" onClick={e => e.stopPropagation()} style={cardStyle}>
        <div className="modal-header-actions" style={headerStyle}>
          <button onClick={handleClose} className="close-button" title="Close" style={iconButtonStyle}>
            <X size={20} />
          </button>
        </div>
        <h2 className="detail-title" style={titleStyle}>Edit Responsibility</h2>
        <form onSubmit={handleSave} style={formStyle}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            name="name"
            value={responsibility.name ?? ''}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Start Date &amp; Time</label>
          <input
            type="datetime-local"
            name="startDateTime"
            value={responsibility.startDateTime ? formatISO(new Date(responsibility.startDateTime)).slice(0, 16) : ''}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Duration (mins)</label>
          <input
            type="number"
            name="duration"
            value={responsibility.duration ?? ''}
            onChange={handleChange}
            min={0}
            style={inputStyle}
          />

          <label style={labelStyle}>Category</label>
          <input
            type="text"
            name="category"
            value={responsibility.category ?? ''}
            onChange={handleChange}
            style={inputStyle}
          />

          <label style={labelStyle}>Owner</label>
          <input
            type="text"
            name="owner"
            value={responsibility.owner ?? ''}
            onChange={handleChange}
            list="owner-users"
            placeholder="Select owner..."
            style={inputStyle}
          />
          <datalist id="owner-users">
            {allUsers.map((u) => (
              <option key={u.id} value={u.name} />
            ))}
          </datalist>

           <div style={buttonContainerStyle}>
             <button type="submit" disabled={saving} className="btn-primary" style={saveButtonStyle}>
               {saving ? 'Saving...' : 'Save Changes'}
             </button>
             <button type="button" onClick={handleCancelResponsibility} className="btn-outline" style={cancelButtonStyle}>
               Cancel Responsibility
             </button>
             <button type="button" onClick={handleClose} className="btn-outline" style={cancelButtonStyle}>
               Cancel
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}

// Inline premium styling (glassmorphism & vibrant accents)
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  borderRadius: '12px',
  padding: '24px',
  width: 'min(500px, 90vw)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
  color: 'var(--text-primary)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: '12px',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: '1.5rem',
  textAlign: 'center',
  color: '#fff',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#e0e0e0',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  outline: 'none',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '16px',
};

const saveButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1e90ff, #00bfff)',
  border: 'none',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const cancelButtonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
};

/**
 * Notes:
 * - The edit button in ResponsibilityDetailModal already navigates to `/responsibilities/${responsibility.id}/edit`.
 * - This page renders as a modal overlay, preserving the UX of a modal while using a dedicated route.
 * - After saving, we simply navigate back, which closes the modal and reveals the underlying view.
 */
