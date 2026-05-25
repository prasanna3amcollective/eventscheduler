'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CalendarFill as Calendar, Clock, Users, Refresh, XCircle, CheckCircle, ChevronRight, ChevronDown } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

interface Participant {
    id: string;
    type?: string;
    user: {
        id: string;
        name: string;
        username: string;
        email: string;
        phone: string;
    };
    sys_created_at: string;
    attendance?: number;
 }

interface Activity {
    id: string;
    name: string;
    startDateTime: string;
    endDateTime: string;
    duration: number;
    isRecurring: boolean;
    recurrenceRule: string | null;
    recurrenceTemplateId?: string | null;
    generatedFromTemplateId?: string | null;
    detachReason?: 'none' | 'edited' | 'cancelled' | 'rescheduled' | 'manually_created';
    category?: string;
    state?: string;
    leaders?: string[];
    guides?: string[];
    observers?: string[];
    participants: Participant[];
}

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
}

function StaffMiniList({
    label,
    names,
    onUpdate
}: {
    label: string,
    names: string[],
    onUpdate: (names: string[]) => void
}) {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await secureFetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data);
            }
        };
        fetchUsers();
    }, []);

    const handleAdd = (name: string) => {
        if (name && !names.includes(name)) {
            onUpdate([...names, name]);
        }
        setInputValue('');
    };

    const handleRemove = (name: string) => {
        onUpdate(names.filter(n => n !== name));
    };

    return (
        <div className="staff-mini-list">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>{label}</h3>
            <div className="selected-users-list" style={{ marginBottom: '12px' }}>
                {names.length > 0 ? (
                    names.map(n => (
                        <div key={n} className="user-chip">
                            <span>{n}</span>
                            <button onClick={() => handleRemove(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'inherit' }}>×</button>
                        </div>
                    ))
                ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No {label.toLowerCase()}s assigned</span>
                )}
            </div>
            <div style={{ maxWidth: '300px' }}>
                <input
                    type="text"
                    placeholder={`Add ${label.toLowerCase()}...`}
                    value={inputValue}
                    onChange={(e) => {
                        const val = e.target.value;
                        setInputValue(val);
                        const match = allUsers.find(u => u.name.toLowerCase() === val.toLowerCase());
                        if (match) handleAdd(match.name);
                    }}
                    list={`users-list-${label}`}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px',
                        background: 'var(--bg-color)'
                    }}
                />
                <datalist id={`users-list-${label}`}>
                    {allUsers.map(u => <option key={u.id} value={u.name} />)}
                </datalist>
            </div>
        </div>
    );
}

export default function ActivityManagementPage() {
    const params = useParams();
    const router = useRouter();
    const activityId = params.id as string;

    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [closingActivity, setClosingActivity] = useState(false);
    const [isStaffOpen, setIsStaffOpen] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userRes = await secureFetch('/api/auth/me');
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setCurrentUser(userData.user);
                }

                const activityRes = await secureFetch(`/api/activities/${activityId}`);
                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setActivity(activityData);
                } else {
                    setError('Activity not found or access denied');
                }
            } catch (err) {
                setError('Failed to load activity details');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [activityId]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const activityRes = await secureFetch(`/api/activities/${activityId}`);
            if (activityRes.ok) {
                const activityData = await activityRes.json();
                setActivity(activityData);
            }
        } catch (err) {
            console.error('Failed to refresh', err);
        } finally {
            setLoading(false);
        }
    };

    const staffNames = new Set([
        ...(activity?.leaders || []),
        ...(activity?.guides || []),
        ...(activity?.observers || [])
    ]);

    const allParticipants = activity?.participants || [];

    const filteredParticipants = allParticipants.filter(p => {
        const matchesSearch = p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.type || 'Participant').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const isLeader = !!currentUser && !!activity?.participants?.some(
        p => p.user?.id === currentUser.id && p.type === 'Leader'
    );

    const performCloseActivity = async () => {
        if (!activity) return;
        setClosingActivity(true);
        try {
            const res = await secureFetch(`/api/activities/${activityId}/close`, {
                method: 'PATCH',
            });
            if (res.ok) {
                handleRefresh();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to close activity');
            }
        } catch (err) {
            console.error('Failed to close activity', err);
            alert('An error occurred while closing the activity');
        } finally {
            setClosingActivity(false);
        }
    };

    const handleUpdateStaff = async (type: 'leader' | 'guide' | 'observer', names: string[]) => {
        if (!activity) return;

        const payload = {
            name: activity.name,
            startDateTime: activity.startDateTime,
            endDateTime: activity.endDateTime,
            duration: activity.duration,
            isRecurring: activity.isRecurring,
            recurrenceRule: activity.recurrenceRule,
            category: activity.category,
            recurrenceTemplateId: activity.recurrenceTemplateId,
            generatedFromTemplateId: activity.generatedFromTemplateId,
            detachReason: activity.detachReason,
            leader: type === 'leader' ? names : (activity.leaders || []),
            guide: type === 'guide' ? names : (activity.guides || []),
            observer: type === 'observer' ? names : (activity.observers || [])
        };

        try {
            const res = await secureFetch(`/api/activities/${activityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                handleRefresh();
            }
        } catch (err) {
            console.error('Failed to update staff', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
                <div className="text-center">
                    <div className="loading-spinner" />
                    <p className="loading-text">Loading activity details...</p>
                </div>
            </div>
        );
    }

    if (error || !activity) {
        return (
            <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
                <div className="error-container">
                    <XCircle size={48} className="error-icon" />
                    <h2 className="error-title">Access Denied</h2>
                    <p className="error-message">{error || 'Activity not found'}</p>
                    <button onClick={() => router.push('/')} className="btn-primary">
                        <ArrowLeft size={18} />
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-color)]">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-brand">
                    <button onClick={() => router.push('/')} className="back-button">
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </button>
                </div>
                <div className="header-user">
                    {currentUser && (
                        <>
                            <span className="user-name">{currentUser.name}</span>
                        </>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Activity Header Card */}
                <div className="activity-card">
                    <div className="activity-card-header">
                        <div className="activity-info">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h1 className="activity-title" style={{ margin: 0 }}>{activity.name}</h1>
                                 <span style={{
                                     background: activity.state === 'Completed' ? 'var(--primary-glow)' : 'rgba(107, 114, 128, 0.1)',
                                     color: activity.state === 'Completed' ? 'var(--primary-color)' : '#6b7280',
                                     padding: '2px 8px',
                                     borderRadius: '12px',
                                     fontSize: '11px',
                                     fontWeight: 600,
                                     letterSpacing: '0.5px',
                                     lineHeight: 1,
                                     textTransform: 'uppercase',
                                     display: 'inline-block',
                                     alignSelf: 'center'
                                 }}>
                                     {activity.state || 'Scheduled'}
                                 </span>
                            </div>
                            <div className="activity-datetime">
                                <div className="datetime-item">
                                    <div className="datetime-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="datetime-info">
                                        <p className="datetime-label">Date</p>
                                        <p className="datetime-value">
                                            {format(new Date(activity.startDateTime), 'EEEE, MMMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className="datetime-item">
                                    <div className="datetime-icon">
                                        <Clock size={20} />
                                    </div>
                                    <div className="datetime-info">
                                        <p className="datetime-label">Time</p>
                                        <p className="datetime-value">
                                            {format(new Date(activity.startDateTime), 'hh:mm aa')} ({activity.duration} mins)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button onClick={handleRefresh} className="refresh-button" title="Refresh participants">
                                <Refresh size={20} className={loading ? 'spinning' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Participants Section */}
                <div className="participants-card">
                    <div className="participants-header">
                        <div>
                            <h2 className="participants-title">Participants</h2>
                            <p className="participants-count">
                                {filteredParticipants.length} of {allParticipants.length} people shown
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search participants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    {/* Participants Table */}
                    {filteredParticipants.length > 0 ? (
                        <div className="table-container">
                            <table className="participants-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                         <th>Phone</th>
                                         <th>Registered</th>
                                         <th>Attendance</th>
                                     </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.map((participant) => (
                                        <tr key={participant.id}>
                                            <td className="font-semibold">{participant.user.name}</td>
                                            <td>
                                                <span style={{
                                                    background: participant.type === 'Leader' ? 'var(--primary-glow)' :
                                                        participant.type === 'Guide' ? 'rgba(16, 185, 129, 0.1)' :
                                                            participant.type === 'Observer' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(180, 83, 61, 0.05)',
                                                    color: participant.type === 'Leader' ? 'var(--primary-color)' :
                                                        participant.type === 'Guide' ? '#10b981' :
                                                            participant.type === 'Observer' ? '#6b7280' : 'var(--text-secondary)',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    display: 'inline-block'
                                                }}>
                                                    {participant.type || 'Participant'}
                                                </span>
                                            </td>
                                            <td className="text-secondary">{participant.user.username}</td>
                                            <td className="text-secondary">{participant.user.email}</td>
                                            <td className="text-secondary">{participant.user.phone}</td>
                                             <td className="text-secondary text-sm">
                                                 {format(new Date(participant.sys_created_at), 'MMM d, yyyy')}
                                             </td>
                                              <td>
                                                   <select
                                                       value={participant.attendance ?? 0}
                                                       disabled={activity.state === 'Completed' || !['Leader', 'Guide', 'Observer'].includes(participant.type ?? '')}
                                                      onChange={(e) => {
                                                          const newVal = parseInt(e.target.value);
                                                          setActivity(prev => {
                                                              if (!prev) return prev;
                                                              return {
                                                                  ...prev,
                                                                  participants: prev.participants?.map(p =>
                                                                      p.id === participant.id ? { ...p, attendance: newVal } : p
                                                                  )
                                                              };
                                                          });
                                                      }}
                                                  >
                                                      <option value={0}>Present</option>
                                                      <option value={1}>Half</option>
                                                      <option value={2}>Absent</option>
                                                  </select>
                                              </td>
                                         </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Users size={48} className="empty-icon" />
                            <p className="empty-text">No participants found</p>
                        </div>
                     )}
                       {activity.state !== 'Completed' && (
                         <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                             <button
                                 onClick={async () => {
                                     if (!activity?.participants) return;
                                     try {
                                         for (const p of activity.participants) {
                                             if (['Leader', 'Guide', 'Observer'].includes(p.type || '')) {
                                                 await secureFetch(`/api/activities/${activityId}`, {
                                                     method: 'PATCH',
                                                     headers: { 'Content-Type': 'application/json' },
                                                     body: JSON.stringify({ participantId: p.id, attendance: p.attendance ?? 0 })
                                                 });
                                             }
                                         }
                                         alert('Attendance saved');
                                     } catch {
                                         console.error('Failed to save attendance');
                                     }
                                 }}
                                 className="btn-primary"
                             >
                                 Save Attendance
                             </button>
 
                             {new Date(activity.endDateTime) < new Date() &&
                               isLeader && (
                                 <button
                                   onClick={() => setShowCloseConfirm(true)}
                                   disabled={closingActivity}
                                   className="btn-primary"
                                   style={{
                                     background: 'var(--primary-color)',
                                     fontSize: '13px',
                                     padding: '8px 16px',
                                   }}
                                   title="Close this activity"
                                 >
                                   <CheckCircle size={16} />
                                   Close this activity
                                 </button>
                               )}
                         </div>
                       )}
                 </div>
 
                 {/* Staff Related List Section */}
                 <div className="participants-card" style={{ marginTop: '32px' }}>
                     <div
                         className="participants-header"
                         onClick={() => setIsStaffOpen(!isStaffOpen)}
                         style={{ cursor: 'pointer' }}
                     >
                         <h2 className="participants-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             Staff Management
                             {isStaffOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                         </h2>
                     </div>
 
                     {isStaffOpen && (
                     <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="staff-management-row">
                            <StaffMiniList
                                label="Leaders"
                                names={activity.leaders || []}
                                onUpdate={(names) => handleUpdateStaff('leader', names)}
                            />
                        </div>
                        <div className="staff-management-row">
                            <StaffMiniList
                                label="Guides"
                                names={activity.guides || []}
                                onUpdate={(names) => handleUpdateStaff('guide', names)}
                            />
                        </div>
                        <div className="staff-management-row">
                            <StaffMiniList
                                label="Observers"
                                names={activity.observers || []}
                                onUpdate={(names) => handleUpdateStaff('observer', names)}
                            />
                        </div>
                     </div>
                      )}
                   </div>
               </main>

              {showCloseConfirm && (
                <div
                  className="modal-overlay"
                  onClick={() => setShowCloseConfirm(false)}
                >
                  <div
                    className="modal-content"
                    style={{ maxWidth: '420px', padding: '24px', textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p style={{ marginBottom: '24px', fontWeight: 500, lineHeight: 1.5 }}>
                      Make sure you mark the attendance for participants correctly. It is
                      important for credit calculations.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setShowCloseConfirm(false)}
                        disabled={closingActivity}
                      >
                        Back
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setShowCloseConfirm(false);
                          performCloseActivity();
                        }}
                        disabled={closingActivity}
                      >
                        {closingActivity ? 'Closing...' : 'I marked attendance'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
         </div>
     );
 }