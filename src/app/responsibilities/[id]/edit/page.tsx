'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, XCircle, Clock, Tag, CalendarFill, User as UserIcon, AlertTriangle } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';
import { formatISO, format } from 'date-fns';

export default function ResponsibilityEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const [responsibility, setResponsibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
        router.refresh();
        router.back();
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
    try {
      const res = await secureFetch(`/api/responsibilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detachReason: 'cancelled', state: 'Cancelled' })
      });
      if (res.ok) {
        router.refresh();
        router.back();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel responsibility');
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling responsibility');
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '4px solid rgba(235, 255, 0, 0.2)',
            borderTopColor: 'var(--primary-color)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 24px',
          }} />
          <p style={{
            fontFamily: 'var(--mono-font)', fontSize: '14px',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
          }}>Loading responsibility...</p>
        </div>
      </div>
    );
  }

  if (!responsibility) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-color)', padding: '40px',
      }}>
        <div style={{
          textAlign: 'center',
          background: 'var(--surface-color)',
          border: '4px solid #000000',
          padding: '60px 40px',
          boxShadow: '12px 12px 0 #000000',
        }}>
          <XCircle size={48} style={{ color: 'var(--error-color)', marginBottom: '20px' }} />
          <h2 style={{
            fontSize: '28px', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '-0.03em', margin: '0 0 12px 0', color: 'var(--text-primary)',
          }}>Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--mono-font)', marginBottom: '24px' }}>
            Responsibility not found or access denied
          </p>
          <button onClick={() => router.push('/')} className="pink-btn">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Back to Home
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-color)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--body-font)',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Grain overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, opacity: 0.03,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }} />
      </div>

      {/* Back button */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(2, 0, 249, 0.95)',
        backdropFilter: 'contrast(120%)',
        borderBottom: '4px solid #000000',
        padding: '16px 40px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          maxWidth: '1400px', margin: '0 auto',
        }}>
          <button
            onClick={handleClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'transparent',
              border: '4px solid #000000',
              padding: '10px 24px',
              fontSize: '14px', fontWeight: 700,
              fontFamily: 'var(--mono-font)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              borderRadius: 0,
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-color)';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = '8px 8px 0 #000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 12H6" />
              <path d="M10 17l-5-5 5-5" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section style={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        position: 'relative',
        borderBottom: '4px solid #000000',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '1000px',
          gap: '24px',
        }}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 800,
              lineHeight: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '-0.05em',
              margin: 0,
              fontFamily: 'var(--heading-font)',
              color: 'var(--text-primary)',
              textShadow: '8px 8px 0 #000000',
              border: '4px solid #000000',
              padding: '20px 40px',
              background: 'var(--surface-color)',
              boxShadow: '12px 12px 0 #000000',
            }}>
            {responsibility.name ?? ''}
          </h1>
          <div style={{
            display: 'flex',
            gap: '16px',
            fontFamily: 'var(--mono-font)',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <span style={{
              padding: '8px 16px',
              border: '3px solid #000000',
              background: 'var(--hover-color)',
              color: 'var(--responsibility-color)',
            }}>
              {responsibility.name}
            </span>
            <span style={{
              padding: '8px 16px',
              border: '3px solid #000000',
              background: 'var(--hover-color)',
              color: 'var(--text-secondary)',
            }}>
              {responsibility.startDateTime
                ? format(new Date(responsibility.startDateTime), 'MMM d, yyyy h:mm aa')
                : 'No date'}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '60px 40px',
      }}>
        <form onSubmit={handleSave}>
          <div style={{
            background: 'var(--surface-color)',
            border: '4px solid #000000',
            boxShadow: '12px 12px 0 #000000',
            padding: '40px',
          }}>
            <h2 style={{
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              margin: '0 0 32px 0',
              fontFamily: 'var(--heading-font)',
              color: 'var(--text-primary)',
              borderBottom: '3px solid #000000',
              paddingBottom: '16px',
            }}>
              <span style={{ color: 'var(--responsibility-color)' }}>◆</span> Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Name */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)',
                  fontFamily: 'var(--mono-font)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', marginBottom: '8px',
                }}>
                  <Tag size={16} /> Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={responsibility.name ?? ''}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '3px solid #000000',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--mono-font)', fontSize: '14px',
                    boxShadow: '6px 6px 0 #000000',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                    borderRadius: 0,
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '4px 4px 0 #000000';
                    e.target.style.transform = 'translate(2px, 2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '6px 6px 0 #000000';
                    e.target.style.transform = 'translate(0, 0)';
                  }}
                />
              </div>

              {/* Start Date & Time */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)',
                  fontFamily: 'var(--mono-font)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', marginBottom: '8px',
                }}>
                  <CalendarFill size={16} /> Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={responsibility.startDateTime ? formatISO(new Date(responsibility.startDateTime)).slice(0, 16) : ''}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '3px solid #000000',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--mono-font)', fontSize: '14px',
                    boxShadow: '6px 6px 0 #000000',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                    borderRadius: 0,
                    boxSizing: 'border-box',
                    colorScheme: 'dark',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '4px 4px 0 #000000';
                    e.target.style.transform = 'translate(2px, 2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '6px 6px 0 #000000';
                    e.target.style.transform = 'translate(0, 0)';
                  }}
                />
              </div>

              {/* Duration + Category row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)',
                    fontFamily: 'var(--mono-font)', textTransform: 'uppercase',
                    letterSpacing: '0.05em', marginBottom: '8px',
                  }}>
                    <Clock size={16} /> Duration (mins)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={responsibility.duration ?? ''}
                    onChange={handleChange}
                    min={0}
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: '3px solid #000000',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--mono-font)', fontSize: '14px',
                      boxShadow: '6px 6px 0 #000000',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      outline: 'none',
                      borderRadius: 0,
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.boxShadow = '4px 4px 0 #000000';
                      e.target.style.transform = 'translate(2px, 2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = '6px 6px 0 #000000';
                      e.target.style.transform = 'translate(0, 0)';
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)',
                    fontFamily: 'var(--mono-font)', textTransform: 'uppercase',
                    letterSpacing: '0.05em', marginBottom: '8px',
                  }}>
                    <Tag size={16} /> Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={responsibility.category ?? ''}
                    onChange={handleChange}
                    style={{
                      width: '100%', padding: '12px 16px',
                      border: '3px solid #000000',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--mono-font)', fontSize: '14px',
                      boxShadow: '6px 6px 0 #000000',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      outline: 'none',
                      borderRadius: 0,
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.boxShadow = '4px 4px 0 #000000';
                      e.target.style.transform = 'translate(2px, 2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = '6px 6px 0 #000000';
                      e.target.style.transform = 'translate(0, 0)';
                    }}
                  />
                </div>
              </div>

              {/* Owner */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)',
                  fontFamily: 'var(--mono-font)', textTransform: 'uppercase',
                  letterSpacing: '0.05em', marginBottom: '8px',
                }}>
                  <UserIcon size={16} /> Owner
                </label>
                <input
                  type="text"
                  name="owner"
                  value={responsibility.owner ?? ''}
                  onChange={handleChange}
                  list="owner-users"
                  placeholder="Select owner..."
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '3px solid #000000',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--mono-font)', fontSize: '14px',
                    boxShadow: '6px 6px 0 #000000',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    outline: 'none',
                    borderRadius: 0,
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '4px 4px 0 #000000';
                    e.target.style.transform = 'translate(2px, 2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '6px 6px 0 #000000';
                    e.target.style.transform = 'translate(0, 0)';
                  }}
                />
                <datalist id="owner-users">
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: '3px solid #000000',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
              <button type="submit" disabled={saving} className="pink-btn">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="orange-btn"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <XCircle size={16} aria-hidden="true" />
                  Cancel Responsibility
                </span>
              </button>
              {/* <button type="button" onClick={handleClose} className="yellow-btn">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <X size={16} aria-hidden="true" />
                  Cancel
                </span>
              </button> */}
            </div>
          </div>
        </form>
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
          }}
          onClick={() => setShowCancelConfirm(false)}
        >
          <div
            style={{
              background: 'var(--surface-color)',
              border: '4px solid #000000',
              padding: '40px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '12px 12px 0 #000000',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <AlertTriangle size={24} style={{ color: '#FF4444' }} />
              <h3 style={{
                fontFamily: 'var(--heading-font)',
                fontSize: '20px',
                fontWeight: 800,
                textTransform: 'uppercase',
                margin: 0,
                color: 'var(--text-primary)',
              }}>
                Cancel Responsibility
              </h3>
            </div>
            <p style={{
              fontFamily: 'var(--mono-font)',
              fontWeight: 600,
              lineHeight: 1.5,
              margin: '0 0 32px 0',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}>
              Are you sure you want to cancel "{responsibility.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn-outline"
                onClick={() => setShowCancelConfirm(false)}
                style={{ padding: '12px 28px' }}
              >
                Back
              </button>
              <button
                className="orange-btn"
                onClick={() => {
                  setShowCancelConfirm(false);
                  handleCancelResponsibility();
                }}
                style={{ padding: '12px 28px' }}
              >
                Yes, Cancel It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}