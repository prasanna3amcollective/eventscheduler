'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, CalendarFill as Calendar, Clock, User as UserIcon, Tag, CheckCircle, Loader, Edit, Share2 } from '@/components/Icons';
import { buildGoogleCalendarUrl } from '@/lib/calendar';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';

interface EventResponsibilityDetailModalProps {
    eventResponsibility: any;
    isOpen: boolean;
    onClose?: () => void;
    currentUser: any;
    onStateChange?: (id: string, newState: string) => void;
    eventId?: string;
    inline?: boolean;
}

export default function EventResponsibilityDetailModal({
    eventResponsibility,
    isOpen,
    onClose,
    currentUser,
    onStateChange,
    eventId,
    inline = false,
}: EventResponsibilityDetailModalProps) {
    const router = useRouter();
    const [completing, setCompleting] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const shareLink = typeof window !== 'undefined' && eventResponsibility ? `${window.location.origin}/event-responsibility/${eventResponsibility.id}` : '';

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
                    title: `Event Responsibility: ${eventResponsibility.name}`,
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
    const [editOwner, setEditOwner] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const startDate = useMemo(
        () => (eventResponsibility ? new Date(eventResponsibility.startDateTime) : new Date()),
        [eventResponsibility?.startDateTime],
    );

    const googleCalendarUrl = useMemo(
        () => (eventResponsibility ? buildGoogleCalendarUrl(eventResponsibility) : ''),
        [eventResponsibility],
    );

    const enterEditMode = () => {
        setEditName(eventResponsibility.name || '');
        setEditDescription(eventResponsibility.description || '');
        setEditCategory(eventResponsibility.category || 'General');
        setEditStart(new Date(eventResponsibility.startDateTime));
        setEditEnd(eventResponsibility.endDateTime ? new Date(eventResponsibility.endDateTime) : new Date(Date.parse(eventResponsibility.startDateTime) + 60 * 60 * 1000));
        setEditDuration(eventResponsibility.duration || 60);
        setEditOwner(eventResponsibility.owner || '');
        setSaveError(null);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setSaveError(null);
    };

    const handleSave = async () => {
        if (!eventResponsibility) return;
        setSaving(true);
        setSaveError(null);
        try {
            const eId = eventResponsibility.eventId || 'placeholder';
            const res = await fetch(`/api/events/${eId}/responsibilities/${eventResponsibility.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    description: editDescription,
                    category: editCategory,
                    startDateTime: editStart.toISOString(),
                    endDateTime: editEnd.toISOString(),
                    duration: editDuration,
                    owner: editOwner,
                })
            });
            if (res.ok) {
                setIsEditing(false);
                onClose?.(); // Close and let parent refresh
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

    const handleComplete = useCallback(async () => {
        if (!eventResponsibility || completing) return;
        setCompleting(true);
        try {
            const eId = eventResponsibility.eventId || 'placeholder';
            const res = await fetch(`/api/events/${eId}/responsibilities/${eventResponsibility.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: 'Completed' })
            });
            if (res.ok) {
                onStateChange?.(eventResponsibility.id, 'Completed');
                onClose?.();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to complete responsibility');
            }
        } catch (err) {
            console.error('Failed to complete event responsibility', err);
            alert('An error occurred while completing the responsibility');
        } finally {
            setCompleting(false);
        }
    }, [eventResponsibility, completing, onClose, onStateChange]);

    const handleSyncCalendar = useCallback(() => {
        if (googleCalendarUrl) {
            globalThis.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
        }
    }, [googleCalendarUrl]);

    if ((!isOpen && !inline) || !eventResponsibility) return null;

    return (
        <div className={inline ? '' : 'modal-overlay fade-in'} onClick={inline ? undefined : onClose}>
            <div
                className={`modal-content activity-detail-card ${inline ? 'inline-mode' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={inline ? { width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative', top: 'auto', left: 'auto', transform: 'none' } : {}}
            >
                <div className="modal-header-actions" style={inline ? { position: 'static', marginBottom: '24px', justifyContent: 'flex-start' } : {}}>
                    {inline ? (
                        <button className="btn-outline" onClick={() => router.push('/')} style={{ fontSize: '14px', padding: '6px 12px' }}>
                            ← Back to Home
                        </button>
                    ) : (
                        <button onClick={() => onClose?.()} className="modal-close" title="Close">
                            <X size={20} />
                        </button>
                    )}
                    {!isEditing && !inline && (
                        <button onClick={enterEditMode} className="edit-btn-flat" title="Edit responsibility">
                            <Edit size={20} />
                        </button>
                    )}
                    <button onClick={() => setShowShareModal(true)} className="edit-btn-flat" title="Share responsibility" style={{ marginLeft: '8px' }}>
                        <Share2 size={20} />
                    </button>
                </div>

                <div className="detail-header-flat">
                    <div className="detail-category">EVENT RESPONSIBILITY</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                style={{
                                    fontSize: '20px', fontWeight: 'bold',
                                    background: 'var(--bg-color)',
                                    border: '2px solid var(--responsibility-color)',
                                    color: 'var(--text-color)',
                                    padding: '6px 10px',
                                    fontFamily: 'var(--heading-font)',
                                    width: '100%', minWidth: '250px'
                                }}
                            />
                        ) : (
                            <h2 className="detail-title" style={{ margin: 0 }}>{eventResponsibility.name}</h2>
                        )}
                        {eventResponsibility.state && !isEditing && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 8px', borderRadius: '0', fontSize: '11px',
                                fontWeight: 700, textTransform: 'uppercase',
                                background: eventResponsibility.state === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: eventResponsibility.state === 'Completed' ? '#10b981' : '#3b82f6',
                                border: `1px solid ${eventResponsibility.state === 'Completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            }}>
                                {eventResponsibility.state === 'Completed' && <CheckCircle size={12} />}
                                {eventResponsibility.state}
                            </span>
                        )}
                    </div>
                </div>

                <div className="detail-body-flat">
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
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-color-muted)' }}>Owner</label>
                                <input
                                    type="text"
                                    value={editOwner}
                                    onChange={e => setEditOwner(e.target.value)}
                                    className="neo-input"
                                />
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
                                <span className="detail-value">{format(startDate, 'MMM d, yyyy')} · {format(startDate, 'hh:mm aa')} ({eventResponsibility.duration} mins)</span>
                            </div>

                            {eventResponsibility.description && (
                                <p className="detail-description" style={{ marginTop: '12px', marginBottom: '16px', color: 'var(--text-primary)', fontFamily: 'var(--mono-font)' }}>
                                    {eventResponsibility.description}
                                </p>
                            )}

                            <div className="detail-staff-section" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {eventResponsibility.owner && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                                        <UserIcon size={14} color="var(--primary-color)" style={{ marginTop: '3px' }} />
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Owner</div>
                                            <div style={{ color: 'var(--text-primary)' }}>{eventResponsibility.owner}</div>
                                        </div>
                                    </div>
                                )}
                                {eventResponsibility.category && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                                        <Tag size={14} color="var(--text-secondary)" style={{ marginTop: '3px' }} />
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>Category</div>
                                            <div style={{ color: 'var(--text-primary)' }}>{eventResponsibility.category}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="detail-footer-flat">
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', width: '100%', justifyContent: 'flex-end' }}>
                            {eventResponsibility.state !== 'Completed' && (
                                <button
                                    onClick={handleComplete}
                                    className="pink-btn"
                                    disabled={completing}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                        {completing ? <Loader size={16} /> : <CheckCircle size={16} />}
                                        {completing ? 'Completing...' : 'Complete Responsibility'}
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={handleSyncCalendar}
                                className="yellow-btn green-btn"
                                disabled={!googleCalendarUrl}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                    <Calendar size={16} /> Sync
                                </span>
                            </button>
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
                        <h3 style={{ margin: '0 0 16px 0', fontFamily: 'var(--mono-font)', fontWeight: 800, textTransform: 'uppercase' }}>Share Responsibility</h3>
                        
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