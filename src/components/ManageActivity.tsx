"use client";

import { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Refresh, Share2, XCircle, ChevronDown, ChevronRight, Users } from '@/components/Icons';
import EditActivityModal from '@/components/EditActivityModal';
import { secureFetch } from '@/lib/fetch';
import styles from './ManageActivity.module.css';

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
    attendance?: number | null;
    payAsYouWish?: number;
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
    description?: string;
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
    readonly label: string,
    readonly names: readonly string[],
    readonly onUpdate: (names: readonly string[]) => void
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
        <div className={styles['staff-list']}>
            <h3 className={styles['staff-label']}>{label}</h3>
            <div className={styles['staff-chips']}>
                {names.length > 0 ? (
                    names.map(n => (
                        <div key={n} className={styles.chip}>
                            <span>{n}</span>
                            <button onClick={() => handleRemove(n)} className={styles['chip-remove-btn']}>×</button>
                        </div>
                    ))
                ) : (
                    <span className={styles['staff-placeholder']}>No {label.toLowerCase()}s assigned</span>
                )}
            </div>
            <div className={styles['staff-input-wrapper']}>
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
                    className={styles['staff-input']}
                />
                <datalist id={`users-list-${label}`}>
                    {allUsers.map(u => <option key={u.id} value={u.name} />)}
                </datalist>
            </div>
        </div>
    );
}

export default function ManageActivity() {
    const params = useParams();
    const router = useRouter();
    const activityId = params.id as string;

    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [closingActivity, setClosingActivity] = useState(false);
    const [isStaffOpen, setIsStaffOpen] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [closeModalMessage, setCloseModalMessage] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [savingActivity, setSavingActivity] = useState(false);

    useLayoutEffect(() => {
        const resetScroll = () => globalThis.scrollTo(0, 0);
        resetScroll();
        const frame = requestAnimationFrame(resetScroll);
        const timeout = globalThis.setTimeout(resetScroll, 50);
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
        };
    }, [activityId]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // const userRes = await secureFetch('/api/auth/me');
                // if (userRes.ok) {
                //     const userData = await userRes.json();

                // }

                const activityRes = await secureFetch(`/api/activities/${activityId}`);
                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setActivity(activityData);
                } else {
                    setError('Activity not found or access denied');
                }
            } catch {
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

    const handleExport = async () => {
        if (!activity) return;
        const rows = activity.participants.map(p => ({
            "Activity name": activity.name,
            "Leader": (activity.leaders || []).join(', '),
            "Guide": (activity.guides || []).join(', '),
            "Observer": (activity.observers || []).join(', '),
            "Participant name": p.user.name,
            "Pay as you wish": p.payAsYouWish ?? 0,
            "Attendance": p.attendance ?? '',
            "Activity start date time": activity.startDateTime,
            "Activity end date time": activity.endDateTime,
            "Participant email": p.user.email,
            "Participant mobile": p.user.phone,
        }));
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = { SheetNames: ['Activity'], Sheets: { Activity: ws } };
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const endDate = format(new Date(activity.endDateTime), 'dd_MM_yy');
        const safeName = activity.name.replace(/[^a-z0-9]/gi, '_');
        const fileName = `${endDate}_${safeName}_${activity.id}.xlsx`;
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };
    const allParticipants = activity?.participants || [];

    const getMissingAttendanceParticipants = (participants: Participant[]) =>
        participants.filter(p => p.attendance === null || p.attendance === undefined || ![0, 1, 2].includes(p.attendance));

    const formatParticipantNames = (participants: Participant[]) => {
        const names = participants.map(p => p.user?.name).filter(Boolean);
        if (names.length <= 3) return names.join(', ');
        return `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
    };

    const getAttendanceSelectValue = (attendance: number | null | undefined) =>
        attendance === null || attendance === undefined || ![0, 1, 2].includes(attendance) ? '' : String(attendance);

    const filteredParticipants = allParticipants.filter(p => {
        const matchesSearch = p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.type || 'Participant').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });


    const saveParticipants = async (participants: Participant[]) => {
        const responses = await Promise.all(
            participants.map(participant => secureFetch(`/api/activities/${activityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: participant.id,
                    attendance: participant.attendance,
                    payAsYouWish: ['Leader', 'Guide', 'Observer'].includes(participant.type || '') ? participant.payAsYouWish ?? 0 : undefined
                })
            }))
        );

        if (responses.some(res => !res.ok)) {
            const failedParticipants = participants
                .filter((_, index) => !responses[index].ok);
            const errorMessages = await Promise.all(
                responses.map(async (res, i) => {
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        return `${participants[i].user?.name || 'Unknown'}: ${data.error || res.statusText}`;
                    }
                    return null;
                })
            );
            throw new Error(`Failed to save attendance for ${formatParticipantNames(failedParticipants)}: ${errorMessages.filter(Boolean).join('; ')}`);
        }
    };

    const performCloseActivity = async () => {
        if (!activity) return;

        const missingFormParticipants = getMissingAttendanceParticipants(activity.participants);
        if (missingFormParticipants.length > 0) {
            setCloseModalMessage(`Please mark attendance for ${formatParticipantNames(missingFormParticipants)} before closing this activity.`);
            return;
        }

        setClosingActivity(true);
        setCloseModalMessage(null);

        try {
            await saveParticipants(activity.participants);

            const res = await secureFetch(`/api/activities/${activityId}/close`, {
                method: 'PATCH',
            });
            if (res.ok) {
                setShowCloseConfirm(false);
                handleRefresh();
            } else {
                const data = await res.json();
                setCloseModalMessage(data.error || 'Failed to close activity');
            }
        } catch (err) {
            console.error('Failed to close activity', err);
            setCloseModalMessage(err instanceof Error ? err.message : 'An error occurred while closing the activity');
        } finally {
            setClosingActivity(false);
        }
    };

    const handleSave = async () => {
        if (!activity?.participants) return;

        setSavingActivity(true);
        try {
            await saveParticipants(activity.participants);
            await handleRefresh();
            alert('Saved successfully');
        } catch (err) {
            console.error('Failed to save attendance', err);
            alert(err instanceof Error ? err.message : 'Failed to save attendance');
        } finally {
            setSavingActivity(false);
        }
    };

    const handleUpdateStaff = async (type: 'leader' | 'guide' | 'observer', names: readonly string[]) => {
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

    const handleAttendanceChange = (participantId: string, value: string) => {
        const newVal = value === '' ? null : Number.parseInt(value, 10);
        setActivity(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                participants: prev.participants?.map(p =>
                    p.id === participantId ? { ...p, attendance: newVal } : p
                )
            };
        });
    };

    const handlePayAsYouWishChange = (participantId: string, value: string) => {
        const newVal = Number.parseFloat(value) || 0;
        setActivity(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                participants: prev.participants?.map(p =>
                    p.id === participantId ? { ...p, payAsYouWish: newVal } : p
                )
            };
        });
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles['loading-content']}>
                    <div className={styles.spinner} />
                    <p className={styles['loading-text']}>Loading activity details...</p>
                </div>
            </div>
        );
    }

    if (error || !activity) {
        return (
            <div className={styles.error}>
                <div className={styles['error-content']}>
                    <XCircle size={48} className={styles['error-icon']} />
                    <h2 className={styles['error-title']}>Access Denied</h2>
                    <p className={styles['error-message']}>{error || 'Activity not found'}</p>
                    <button onClick={() => router.push('/')} className={styles['btn-primary']}>
                        <ArrowLeft size={18} />
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.app}>
            <div className={styles['grain-overlay']} />

            {/* Sticky Nav */}
            <nav className={styles.nav}>
                <div className={styles['nav-container']}>
                    <button onClick={() => router.back()} className={styles['back-btn']}>
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    {/* <button className={styles['cta-btn']}>Get Started</button> */}
                </div>
            </nav>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles['hero-content']}>
                    {/* <div className={styles['hero-monolith']}>
                        <div className={`${styles['monolith-shape']} ${styles['monolith-1']}`}></div>
                        <div className={`${styles['monolith-shape']} ${styles['monolith-2']}`}></div>
                        <div className={`${styles['monolith-shape']} ${styles['monolith-3']}`}></div>
                        <div className={`${styles['monolith-shape']} ${styles['monolith-4']}`}></div>
                    </div> */}
                    <h1 className={styles['hero-title']}>
                        {activity.name}
                    </h1>
                    { }
                    <div className={styles['hero-meta']}>
                        <span className={styles['hero-date']}>
                            {format(new Date(activity.startDateTime), 'EEEE, MMMM d')}
                        </span>
                        <span className={styles['hero-time']}>
                            {format(new Date(activity.startDateTime), 'hh:mm aa')} • {activity.duration} MIN
                        </span>
                    </div>
                </div>
            </section>


            <main className={styles.main}>
                {/* Activity Stats Grid */}
                {/* <div className={styles['stats-grid']}>
                    <div className={`${styles['stat-tile']} ${styles['stat-tile-primary']}`}>
                        <span className={styles['stat-value']}>{allParticipants.length}</span>
                        <span className={styles['stat-label']}>PARTICIPANTS</span>
                    </div>
                    <div className={`${styles['stat-tile']} ${styles['stat-tile-warning']}`}>
                        <span className={styles['stat-value']}>{activity.leaders?.length || 0}</span>
                        <span className={styles['stat-label']}>LEADERS</span>
                    </div>
                    <div className={`${styles['stat-tile']} ${styles['stat-tile-success']}`}>
                        <span className={styles['stat-value']}>{activity.guides?.length || 0}</span>
                        <span className={styles['stat-label']}>GUIDES</span>
                    </div>
                    <div className={`${styles['stat-tile']} ${styles['stat-tile-info']}`}>
                        <span className={styles['stat-value']}>{activity.observers?.length || 0}</span>
                        <span className={styles['stat-label']}>OBSERVERS</span>
                    </div>
                </div>

                {/* Description Block */}
                <section id="description" className={styles['description-section']}>
                    <h2 className={styles['section-title']}>Description</h2>
                    <br />

                    <textarea
                        className={styles['description-text']}
                        value={activity.description || ''}
                        onChange={(e) => setActivity(prev => {
                            if (!prev) return null;
                            return { ...prev, description: e.target.value };
                        })}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${target.scrollHeight}px`;
                        }}
                        style={{ overflow: 'hidden' }}
                    ></textarea>

                </section>
                {/* Participants Section */}
                <section className={styles['participants-section']}>
                    <div className={styles['section-header']}>
                        <h2 className={styles['section-title']}>Participants</h2>
                        <span className={styles['participants-count-badge']}>
                            {filteredParticipants.length} / {allParticipants.length}
                        </span>
                    </div>

                    <div className={styles['controls-bar']}>
                        <input
                            type="text"
                            placeholder="Search participants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles['search-input']}
                        />
                        <button onClick={handleRefresh} className={styles['icon-btn']} title="Refresh">
                            <Refresh size={20} className={loading ? 'spinning' : ''} />
                        </button>
                        <button onClick={handleExport} className={styles['icon-btn']} title="Export">
                            <Share2 size={20} />
                        </button>
                    </div>

                    {filteredParticipants.length > 0 ? (
                        <div className={styles['table-wrapper']}>
                            <table className={styles['participants-table']}>
                                <thead>
                                    <tr>
                                        <th>NAME</th>
                                        <th>ROLE</th>
                                        <th>USERNAME</th>
                                        <th>EMAIL</th>
                                        <th>PHONE</th>
                                        <th>REGISTERED</th>
                                        <th>ATTENDANCE</th>
                                        <th>PAY AS YOU WISH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.map((participant) => (
                                        <tr key={participant.id}>
                                            <td className="font-bold">{participant.user.name}</td>
                                            <td>
                                                <span className={[styles['role-badge'], styles[`role-badge-${participant.type?.toLowerCase() || 'participant'}`]].join(' ')}>
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
                                                    value={getAttendanceSelectValue(participant.attendance)}
                                                    disabled={activity.state === 'Completed'}
                                                    onChange={(e) => handleAttendanceChange(participant.id, e.target.value)}
                                                    className={styles['select-input']}
                                                >
                                                    <option value="">Select attendance</option>
                                                    <option value={0}>Present</option>
                                                    <option value={1}>Half</option>
                                                    <option value={2}>Absent</option>
                                                </select>
                                            </td>
                                            <td>
                                                <div className={styles['pay-input-group']}>
                                                    <span className={styles['pay-currency']}>Rs</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={participant.payAsYouWish ?? 0}
                                                        disabled={!['Leader', 'Guide', 'Observer'].includes(participant.type ?? '')}
                                                        onChange={(e) => handlePayAsYouWishChange(participant.id, e.target.value)}
                                                        className={styles['pay-input']}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles['empty-state']}>
                            <Users size={48} className={styles['empty-icon']} />
                            <p className={styles['empty-text']}>No participants found</p>
                        </div>
                    )}




                </section>

                <section className={styles['staff-section']}>
                    <button
                        type="button"
                        className={styles['staff-header']}
                        onClick={() => setIsStaffOpen(!isStaffOpen)}
                        style={{ background: 'none', border: 'none', borderBottom: '3px solid #000000', width: '100%', textAlign: 'left' }}
                    >
                        <h2 className={styles['staff-title']}>
                            Organisers
                            {isStaffOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </h2>
                    </button>

                    <div className={`${styles['staff-content']} ${isStaffOpen ? '' : styles['staff-content-collapsed']}`}>
                        <h3 className={styles['workflow-step']}>FACILITATORS</h3>
                        <StaffMiniList
                            label="Leaders"
                            names={activity.leaders || []}
                            onUpdate={(names) => handleUpdateStaff('leader', names)}
                        />

                        <h3 className={styles['workflow-step']}>Guides</h3>
                        <StaffMiniList
                            label="Guides"
                            names={activity.guides || []}
                            onUpdate={(names) => handleUpdateStaff('guide', names)}
                        />

                        <h3 className={styles['workflow-step']}>Observers</h3>
                        <StaffMiniList
                            label="Observers"
                            names={activity.observers || []}
                            onUpdate={(names) => handleUpdateStaff('observer', names)}
                        />
                    </div>
                </section>
                <div className={styles['actions-bar']}>
                    <button
                        onClick={handleSave}
                        disabled={savingActivity}
                        className={styles['btn-primary']}
                    >
                        {savingActivity ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </main>

            {/* Close Confirmation Modal */}
            {
                showCloseConfirm && (
                    <div className={styles['modal-overlay']}>
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowCloseConfirm(false)}
                            aria-label="Close modal"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', border: 'none', cursor: 'default' }}
                        />
                        <div
                            className={styles.modal}
                            style={{ position: 'relative', zIndex: 1 }}
                        >
                            <p className={styles['modal-warning']}>
                                Make sure you mark the attendance for participants correctly. It is
                                important for credit calculations.
                            </p>
                            {closeModalMessage && (
                                <p className={styles['modal-alert']}>
                                    {closeModalMessage}
                                </p>
                            )}
                            <div className={styles['modal-actions']}>
                                <button
                                    className={styles['btn-secondary']}
                                    onClick={() => setShowCloseConfirm(false)}
                                    disabled={closingActivity}
                                >
                                    Back
                                </button>
                                <button
                                    className={styles['btn-warning']}
                                    onClick={performCloseActivity}
                                    disabled={closingActivity}
                                >
                                    {closingActivity ? 'Closing...' : 'I marked attendance'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {showEditModal && <EditActivityModal onClose={() => setShowEditModal(false)} />}
        </div >
    );
}