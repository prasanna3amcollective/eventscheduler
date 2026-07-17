'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, CalendarFill as Calendar, Clock, User as UserIcon, Users, Eye, CheckCircle, Edit, Share2 } from '@/components/Icons';
import { buildGoogleCalendarUrl } from '@/lib/calendar';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';

interface EventActivityDetailModalProps {
    eventActivity: any;
    isOpen: boolean;
    onClose?: () => void;
    currentUser: any;
    onRegisterSuccess?: () => void;
    eventId?: string;
    inline?: boolean;
}

export default function EventActivityDetailModal({
    eventActivity,
    isOpen,
    onClose,
    currentUser,
    onRegisterSuccess,
    eventId,
    inline = false,
}: EventActivityDetailModalProps) {
    const router = useRouter();
    const { setShowRegisterModal } = useAuth();
    const [fullActivity, setFullActivity] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const shareLink = typeof window !== 'undefined' && eventActivity ? `${window.location.origin}/event-activity/${eventActivity.id}` : '';

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            alert('Link copied to clipboard!');
            setShowShareModal(false);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleShareTo = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Event Activity: ${eventActivity?.name || 'Activity'}`,
                    url: shareLink
                });
                setShowShareModal(false);
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                console.error('Error sharing:', err);
            }
        } else {
            alert('Share API is not supported in this browser. Please copy the link instead.');
        }
    };

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editCategory, setEditCategory] = useState('General');
    const [editStart, setEditStart] = useState<Date>(new Date());
    const [editEnd, setEditEnd] = useState<Date>(new Date());
    const [editDuration, setEditDuration] = useState(60);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const eId = eventId || eventActivity?.eventId || 'placeholder';

    const activity = fullActivity || eventActivity;

    useEffect(() => {
        if ((!isOpen && !inline) || !eventActivity?.id) return;
        let cancelled = false;
        const fetchDetail = async () => {
            setLoadingDetail(true);
            try {
                const res = await fetch(`/api/events/${eId}/activities/${eventActivity.id}`);
                if (!cancelled && res.ok) {
                    const data = await res.json();
                    setFullActivity(data);
                }
            } catch (err) {
                console.error('Failed to fetch event activity detail:', err);
            } finally {
                if (!cancelled) setLoadingDetail(false);
            }
        };
        fetchDetail();
        return () => { cancelled = true; };
    }, [isOpen, inline, eventActivity?.id, eId]);

    useEffect(() => {
        if (currentUser && activity?.id) {
            const autoId = sessionStorage.getItem('autoRegisterEventActivityId');
            if (autoId === activity.id) {
                sessionStorage.removeItem('autoRegisterEventActivityId');
                handleRegister();
            }
        }
    }, [currentUser, activity?.id]);

    const startDate = useMemo(
        () => (activity ? new Date(activity.startDateTime) : new Date()),
        [activity?.startDateTime],
    );

    const googleCalendarUrl = useMemo(
        () => (activity ? buildGoogleCalendarUrl(activity) : ''),
        [activity?.startDateTime, activity?.endDateTime, activity?.duration, activity?.name],
    );

    const isRegistered = currentUser && activity?.participants?.some((p: any) => p.userId === currentUser.id);

    const enterEditMode = () => {
        setEditName(activity.name || '');
        setEditDescription(activity.description || '');
        setEditCategory(activity.category || 'General');
        setEditStart(new Date(activity.startDateTime));
        setEditEnd(new Date(activity.endDateTime));
        setEditDuration(activity.duration || 60);
        setSaveError(null);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setSaveError(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch(`/api/events/${eId}/activities/${activity.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    description: editDescription,
                    category: editCategory,
                    startDateTime: editStart.toISOString(),
                    endDateTime: editEnd.toISOString(),
                    duration: editDuration,
                })
            });
            if (res.ok) {
                setIsEditing(false);
                // Refetch to get updated data
                const refreshRes = await fetch(`/api/events/${eId}/activities/${activity.id}`);
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setFullActivity(data);
                }
            } else {
                const data = await res.json();
                setSaveError(data.error || 'Failed to save changes');
            }
        } catch (err) {
            setSaveError('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    const handleRegister = useCallback(async () => {
        if (!currentUser) {
            sessionStorage.setItem('autoRegisterEventActivityId', activity?.id || '');
            setShowRegisterModal(true);
            return;
        }
        if (!activity) return;
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const res = await fetch(`/api/events/${eId}/activities/${activity.id}/register`, {
                method: 'POST',
            });
            if (res.ok) {
                setSuccessMessage('Registered successfully!');
                onRegisterSuccess?.();
                setTimeout(() => onClose?.(), 1500);
            } else {
                const data = await res.json();
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred during registration.');
        } finally {
            setIsSubmitting(false);
        }
    }, [currentUser, activity, onRegisterSuccess, onClose, eId]);

    const handleSyncCalendar = useCallback(() => {
        if (googleCalendarUrl) {
            globalThis.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
        }
    }, [googleCalendarUrl]);

    if ((!isOpen && !inline) || !activity) return null;

    return (
        <div className={inline ? '' : 'modal-overlay fade-in'} onClick={inline ? undefined : onClose}>
            <div className={`modal-content activity-detail-card ${inline ? 'inline-mode' : ''}`} onClick={e => e.stopPropagation()} style={inline ? { width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative', top: 'auto', left: 'auto', transform: 'none' } : {}}>
                <div className="modal-header-actions" style={inline ? { position: 'static', marginBottom: '24px', justifyContent: 'flex-start' } : {}}>
                    {inline ? (
                        <button className="btn-outline" onClick={() => router.push('/')} style={{ fontSize: '14px', padding: '6px 12px' }}>
                            ← Back to Home
                        </button>
                    ) : (
                        <button className="modal-close" onClick={() => onClose?.()}>
                            <X size={20} />
                        </button>
                    )}
                    {!isEditing && !inline && (
                        <button onClick={enterEditMode} className="edit-btn-flat" title="Edit Event Activity">
                            <Edit size={20} />
                        </button>
                    )}
                    <button onClick={() => setShowShareModal(true)} className="edit-btn-flat" title="Share activity" style={{ marginLeft: '8px' }}>
                        <Share2 size={20} />
                    </button>
                </div>

                <div className="detail-header-flat">
                    <div className="detail-category">EVENT ACTIVITY</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                style={{
                                    fontSize: '20px', fontWeight: 'bold',
                                    background: 'var(--bg-color)',
                                    border: '2px solid var(--primary-color)',
                                    color: 'var(--text-color)',
                                    padding: '6px 10px',
                                    fontFamily: 'var(--heading-font)',
                                    width: '100%', minWidth: '250px'
                                }}
                            />
                        ) : (
                            <h2 className="detail-title" style={{ margin: 0 }}>{activity.name}</h2>
                        )}
                        {activity.state && !isEditing && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '4px 10px', borderRadius: '0', fontSize: '10px',
                                fontWeight: 800, textTransform: 'uppercase',
                                fontFamily: 'var(--mono-font)',
                                background: activity.state === 'Completed' ? '#4CE819' : '#EBFF00',
                                color: '#000000', border: '2px solid #000000',
                                boxShadow: '3px 3px 0 #000000',
                            }}>
                                {activity.state === 'Completed' && <CheckCircle size={10} />}
                                {activity.state}
                            </span>
                        )}
                    </div>
                </div>

                <div className="detail-body-flat">
                    {loadingDetail && !isEditing && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                            Loading details...
                        </div>
                    )}

                    {isEditing ? (
                        <div style={{ marginBottom: '24px' }}>
                            {saveError && (
                                <div style={{ background: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', padding: '10px 16px', border: '1px solid #ff4444', marginBottom: '16px', fontSize: '14px' }}>
                                    {saveError}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Start Date & Time</label>
                                    <DatePicker
                                        selected={editStart}
                                        onChange={(date: Date | null) => date && setEditStart(date)}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        className="neo-input"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>End Date & Time</label>
                                    <DatePicker
                                        selected={editEnd}
                                        onChange={(date: Date | null) => date && setEditEnd(date)}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        minDate={editStart}
                                        className="neo-input"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Category</label>
                                    <select
                                        value={editCategory}
                                        onChange={e => setEditCategory(e.target.value)}
                                        className="neo-input"
                                    >
                                        {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Duration (mins)</label>
                                    <input
                                        type="number"
                                        value={editDuration}
                                        onChange={e => setEditDuration(Number(e.target.value))}
                                        className="neo-input"
                                        min={1}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="neo-input neo-textarea"
                                    rows={3}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="yellow-btn" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button className="btn-outline" onClick={cancelEdit} disabled={saving}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="detail-datetime-row">
                                <span className="detail-label"><Clock size={12} /> {format(startDate, 'EEEE')}</span>
                                <span className="detail-value">{format(startDate, 'MMM d, yyyy')} · {format(startDate, 'hh:mm aa')} ({activity.duration} mins)</span>
                            </div>

                            {activity.description && (
                                <p className="detail-description" style={{ marginTop: '12px', marginBottom: '16px', color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                                    {activity.description}
                                </p>
                            )}

                            {activity.participantCount !== undefined && (
                                <div className="detail-section-divider">
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 14px', border: '2px solid #000000',
                                        background: 'var(--primary-color)', color: '#000000',
                                        fontFamily: 'var(--mono-font)', fontWeight: 800, fontSize: '12px',
                                        textTransform: 'uppercase', boxShadow: '4px 4px 0 #000000',
                                    }}>
                                        <Users size={16} />
                                        <span>{activity.participantCount} {activity.participantCount === 1 ? 'Participant' : 'Participants'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="detail-staff-section" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(activity.leaders?.length || 0) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', padding: '10px 14px', border: '2px solid #000000', background: 'var(--surface-color)', boxShadow: '4px 4px 0 #000000' }}>
                                        <UserIcon size={14} color="var(--primary-color)" style={{ marginTop: '3px' }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--mono-font)', letterSpacing: '0.1em' }}>Leaders</div>
                                            <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)', fontSize: '12px', marginTop: '4px' }}>{(activity.leaders || []).join(', ')}</div>
                                        </div>
                                    </div>
                                )}
                                {(activity.guides?.length || 0) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', padding: '10px 14px', border: '2px solid #000000', background: 'var(--surface-color)', boxShadow: '4px 4px 0 #000000' }}>
                                        <Users size={14} color="#10b981" style={{ marginTop: '3px' }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#10b981', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--mono-font)', letterSpacing: '0.1em' }}>Guides</div>
                                            <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)', fontSize: '12px', marginTop: '4px' }}>{(activity.guides || []).join(', ')}</div>
                                        </div>
                                    </div>
                                )}
                                {(activity.observers?.length || 0) > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', padding: '10px 14px', border: '2px solid #000000', background: 'var(--surface-color)', boxShadow: '4px 4px 0 #000000' }}>
                                        <Eye size={14} color="var(--text-secondary)" style={{ marginTop: '3px' }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--mono-font)', letterSpacing: '0.1em' }}>Observers</div>
                                            <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--mono-font)', fontSize: '12px', marginTop: '4px' }}>{(activity.observers || []).join(', ')}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <p className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: '#ff4444', fontSize: '13px' }}>
                                    {error}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="detail-footer-flat">
                        {successMessage && (
                            <div style={{ flex: '0 0 100%', textAlign: 'center', color: '#4CE819', fontSize: '14px', fontWeight: 800, fontFamily: 'var(--mono-font)', marginBottom: '8px', padding: '8px 16px', border: '2px solid #000000', background: 'rgba(76, 232, 25, 0.1)', boxShadow: '3px 3px 0 #000000' }}>
                                {successMessage}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', width: '100%', justifyContent: 'flex-end' }}>
                            <button onClick={handleSyncCalendar} className="yellow-btn green-btn" disabled={!googleCalendarUrl}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}><Calendar size={16} /> Sync</span>
                            </button>
                            {(!currentUser || !isRegistered) && (
                                <button className="btn-secondary-brutal" onClick={handleRegister} disabled={isSubmitting} style={{ whiteSpace: 'nowrap' }}>
                                    {isSubmitting ? 'Registering...' : 'Register'} <CheckCircle size={16} />
                                </button>
                            )}
                            {currentUser && isRegistered && (
                                <span style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                    <CheckCircle size={16} /> Registered
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay fade-in" style={{ zIndex: 3000 }} onClick={() => setShowShareModal(false)}>
                    <div className="modal-content activity-detail-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
                        <div className="modal-header-actions">
                            <button onClick={() => setShowShareModal(false)} className="modal-close" title="Close">
                                <X size={20} />
                            </button>
                        </div>
                        <h3 style={{ margin: '0 0 16px 0', fontFamily: 'var(--mono-font)', fontWeight: 800, textTransform: 'uppercase' }}>Share Event Activity</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', border: '2px solid #000', padding: '8px 12px', marginBottom: '20px', overflowX: 'auto', whiteSpace: 'nowrap', fontSize: '14px', fontFamily: 'var(--mono-font)' }}>
                            {shareLink}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleCopyLink} className="btn-primary-brutal" style={{ flex: 1, padding: '10px', fontSize: '14px' }}>
                                Copy Link
                            </button>
                            <button onClick={handleShareTo} className="btn-secondary-brutal" style={{ flex: 1, padding: '10px', fontSize: '14px' }}>
                                Share To...
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}