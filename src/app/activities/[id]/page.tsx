'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CalendarFill as Calendar, Clock, Users, Refresh, XCircle } from '@/components/Icons';
import { secureFetch } from '@/lib/fetch';

interface Participant {
    id: string;
    user: {
        id: string;
        name: string;
        username: string;
        email: string;
        phone: string;
        type: string;
    };
    sys_created_at: string;
}

interface Activity {
    id: string;
    name: string;
    startDateTime: string;
    endDateTime: string;
    duration: number;
    isRecurring: boolean;
    recurrenceRule: string | null;
    participants: Participant[];
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
    const [typeFilter, setTypeFilter] = useState<string>('all');

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

    const filteredParticipants = activity?.participants.filter(p => {
        const matchesSearch = p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || p.user.type === typeFilter;
        return matchesSearch && matchesType;
    }) || [];

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
                            <span className={`user-type-tag ${currentUser.type}`}>{currentUser.type}</span>
                        </>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Activity Header Card */}
                <div className="activity-card">
                    <div className="activity-card-header">
                        <div className="activity-info">
                            <h1 className="activity-title">{activity.name}</h1>
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
                        <button onClick={handleRefresh} className="refresh-button" title="Refresh participants">
                            <Refresh size={20} className={loading ? 'spinning' : ''} />
                        </button>
                    </div>
                </div>

                {/* Participants Section */}
                <div className="participants-card">
                    <div className="participants-header">
                        <div>
                            <h2 className="participants-title">Participants</h2>
                            <p className="participants-count">
                                {filteredParticipants.length} of {activity.participants.length} participants shown
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search by name, email, or username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="type-filter"
                        >
                            <option value="all">All Types</option>
                            <option value="core">Core</option>
                            <option value="team">Team</option>
                            <option value="inhouse">Inhouse</option>
                        </select>
                    </div>

                    {/* Participants Table */}
                    {filteredParticipants.length > 0 ? (
                        <div className="table-container">
                            <table className="participants-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Type</th>
                                        <th>Registered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.map((participant) => (
                                        <tr key={participant.id}>
                                            <td className="font-semibold">{participant.user.name}</td>
                                            <td className="text-secondary">{participant.user.username}</td>
                                            <td className="text-secondary">{participant.user.email}</td>
                                            <td className="text-secondary">{participant.user.phone}</td>
                                            <td>
                                                <span className={`type-badge ${participant.user.type}`}>
                                                    {participant.user.type}
                                                </span>
                                            </td>
                                            <td className="text-secondary text-sm">
                                                {format(new Date(participant.sys_created_at), 'MMM d, yyyy')}
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
                </div>
            </main>
        </div>
    );
}