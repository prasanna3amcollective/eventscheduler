'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CalendarFill as Calendar, Clock, User, Users, Eye, Refresh, XCircle } from '@/components/Icons';
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

interface Event {
    id: string;
    name: string;
    
    
    
    startDateTime: string;
    endDateTime: string;
    duration: number;
    isRecurring: boolean;
    recurrenceRule: string | null;
    participants: Participant[];
}

export default function EventManagementPage() {
    const params = useParams();
    const router = useRouter();
    const activityId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLeader, setIsLeader] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get current user
                const userRes = await secureFetch('/api/auth/me');
                let userData = null;
                if (userRes.ok) {
                    userData = await userRes.json();
                    setCurrentUser(userData.user);
                }

                // Get event details with participants
                const eventRes = await secureFetch(`/api/activities/${activityId}`);
                if (eventRes.ok) {
                    const eventData = await eventRes.json();
                    setEvent(eventData);

                    // Check if current user is the leader
                    
                            </div>
                            <h1 className="event-title">{event.name}</h1>
                            <div className="event-datetime">
                                <div className="datetime-item">
                                    <div className="datetime-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="datetime-info">
                                        <p className="datetime-label">Date</p>
                                        <p className="datetime-value">
                                            {format(new Date(event.startDateTime), 'EEEE, MMMM d, yyyy')}
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
                                            {format(new Date(event.startDateTime), 'hh:mm aa')} ({event.duration} mins)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="refresh-button"
                            title="Refresh participants"
                        >
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
                                {filteredParticipants.length} of {event.participants.length} participants shown
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