'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import ActivityForm from '@/components/ActivityForm';
import ResponsibilityForm from '@/components/ResponsibilityForm';
import ActivityModal from '@/components/ActivityModal';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import ResponsibilityDetailModal from '@/components/ResponsibilityDetailModal';
import HolidayDetailModal from '@/components/HolidayDetailModal';
import MarqueeBanner from '@/components/MarqueeBanner';
import { LogOut, User, ChevronDown, Home as HomeIcon, CalendarDays, ShieldCheck } from '@/components/Icons';
import ProfileModal from '@/components/ProfileModal';

function CalendarPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [userPermissions, setUserPermissions] = useState({ canCreateActivity: false, canCreateResponsibility: false });
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedResponsibility, setSelectedResponsibility] = useState<any>(null);
    const [isResponsibilityModalOpen, setIsResponsibilityModalOpen] = useState(false);

    const [detailActivity, setDetailActivity] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [responsibilityDetail, setResponsibilityDetail] = useState<any>(null);
    const [isResponsibilityDetailOpen, setIsResponsibilityDetailOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState<{ id: string; name: string; date: string } | null>(null);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUser(data.user);
                    setUserRoles(data.roles || []);
                    setUserPermissions(data.permissions || { canCreateActivity: false, canCreateResponsibility: false });
                }
            } catch (e) {
                console.error("Session check failed: " + e);
            } finally {
                setIsLoadingSession(false);
            }
        };
        checkSession();
    }, []);

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        setCurrentUser(null);
        setUserRoles([]);
        router.push('/home');
    };

    const handleActivityCreated = () => {
        setRefreshTrigger(prev => prev + 1);
        setIsModalOpen(false);
        setSelectedActivity(null);
    };

    const handleSelectActivity = (activity: any) => {
        if (activity.isResponsibility) {
            setResponsibilityDetail({
                id: activity.id,
                name: activity.title,
                startDateTime: activity.start instanceof Date ? activity.start.toISOString() : activity.start,
                endDateTime: activity.end instanceof Date ? activity.end.toISOString() : activity.end,
                duration: activity.duration,
                category: activity.category,
                state: activity.state,
                owner: activity.owner,
            });
            setIsResponsibilityDetailOpen(true);
            return;
        }

        const mappedActivity = {
            id: activity.id,
            name: activity.title,
            startDateTime: activity.start instanceof Date ? activity.start.toISOString() : activity.start,
            endDateTime: activity.end instanceof Date ? activity.end.toISOString() : activity.end,
            leader: activity.leader,
            guide: activity.guide,
            observer: activity.observer,
            participants: activity.participants,
        };

        setDetailActivity(mappedActivity);
        setIsDetailOpen(true);
    };

    const handleSelectHoliday = (holiday: { id: string; name: string; date: string }) => {
        setSelectedHoliday(holiday);
        setIsHolidayModalOpen(true);
    };

    const handleSelectSlot = (slotInfo: any) => {
        if (!userPermissions.canCreateActivity) return;

        if (slotInfo.action === 'select' || slotInfo.action === 'doubleClick') {
            const newActivity = {
                startDateTime: slotInfo.start,
                endDateTime: slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000),
                name: '',
                leader: [],
                guide: [],
                observer: [],
                duration: 60
            };
            setSelectedActivity(newActivity);
            setIsModalOpen(true);
        }
    };

    useEffect(() => {
        if (!isDetailOpen || !currentUser || !detailActivity?.id) return;

        let cancelled = false;
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/activities/${detailActivity.id}`);
                if (!cancelled && res.ok) {
                    const data = await res.json();
                    const mapped = {
                        id: data.id,
                        name: data.name,
                        startDateTime: data.startDateTime,
                        endDateTime: data.endDateTime,
                        duration: data.duration,
                        leader: data.leaders || data.leader || [],
                        guide: data.guides || data.guide || [],
                        observer: data.observers || data.observer || [],
                        participants: data.participants,
                        participantCount: data.participantCount,
                        category: data.category,
                        state: data.state,
                        recurrenceTemplateId: data.recurrenceTemplateId,
                        generatedFromTemplateId: data.generatedFromTemplateId,
                        detachReason: data.detachReason,
                    };
                    setDetailActivity(mapped);
                }
            } catch (err) {
                console.error('Failed to fetch activity detail for modal:', err);
            }
        };
        fetchDetail();
        return () => { cancelled = true; };
    }, [isDetailOpen, currentUser, detailActivity?.id]);

    const onCreateActivity = () => {
        const newActivity = {
            startDateTime: new Date(),
            endDateTime: new Date(Date.now() + 60 * 60 * 1000),
            name: '',
            leader: [],
            guide: [],
            observer: [],
            duration: 60
        };
        setSelectedActivity(newActivity);
        setIsModalOpen(true);
    };

    const onOwnResponsibility = () => {
        const newResponsibility = {
            startDateTime: new Date(),
            endDateTime: new Date(Date.now() + 60 * 60 * 1000),
            name: '',
            owner: currentUser?.name || '',
            ownerId: currentUser?.id || '',
            duration: 60
        };
        setSelectedResponsibility(newResponsibility);
        setIsResponsibilityModalOpen(true);
    };

    const activeTab = 'calendar';

    if (isLoadingSession) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
                <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="dashboard-layout fade-in" style={{ minHeight: '100vh' }}>
            {/* Navigation — user controls live in nav-right, same row as nav buttons */}
            <MarqueeBanner />
            <nav className="nav-container">
                <div className="nav-left-spacer"></div>
                <div className="nav-buttons">
                    <button className="nav-link-btn" onClick={() => router.push('/home')}>
                        <HomeIcon size={18} /> Home
                    </button>
                    <button className={`nav-link-btn ${activeTab === 'calendar' ? 'active text-black' : ''}`} onClick={() => router.push('/calendar')}>
                        <CalendarDays size={18} /> Calendar View
                    </button>
                    {userRoles.includes('developer') && (
                        <button className="nav-link-btn" onClick={() => router.push('/home')}>
                            <ShieldCheck size={18} /> Developer Panel
                        </button>
                    )}
                </div>
                <div className="nav-right">
                    <div className="user-menu-container">
                        <button
                            className="user-trigger"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowProfileDropdown(!showProfileDropdown);
                            }}
                        >
                            <div className="user-avatar">
                                <User size={20} />
                            </div>
                            <ChevronDown size={14} />
                        </button>
                        {showProfileDropdown && (
                            // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                            <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowProfileDropdown(false);
                                        setIsProfileOpen(true);
                                    }}
                                >
                                    <span>{currentUser?.name}</span>
                                    <br />
                                    <br />
                                    Edit Profile
                                </button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} className="btn-logout" title="Logout"><LogOut size={18} /></button>
                </div>
            </nav>

            {/* Calendar Content */}
            <main className="app-container" style={{ padding: '0 24px' }}>
                <div className="content-section">
                    <CalendarView
                        refreshTrigger={refreshTrigger}
                        onSelectActivity={handleSelectActivity}
                        onSelectSlot={handleSelectSlot}
                        onCreateActivity={onCreateActivity}
                        onOwnResponsibility={onOwnResponsibility}
                        onSelectHoliday={handleSelectHoliday}
                        userRoles={userRoles}
                        userPermissions={userPermissions}
                        currentUser={currentUser}
                    />
                </div>
            </main>

            {/* Modals */}
            <ActivityModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedActivity(null); }}
                title={selectedActivity?.id ? "Edit Activity" : "Create New Activity"}
            >
                {selectedActivity && (
                    <ActivityForm
                        initialData={selectedActivity}
                        onActivityCreated={handleActivityCreated}
                        onCancel={() => { setIsModalOpen(false); setSelectedActivity(null); }}
                    />
                )}
            </ActivityModal>

            <ActivityModal
                isOpen={isResponsibilityModalOpen}
                onClose={() => { setIsResponsibilityModalOpen(false); setSelectedResponsibility(null); }}
                title={selectedResponsibility?.id ? "Edit Responsibility" : "Own Responsibility"}
            >
                {selectedResponsibility && (
                    <ResponsibilityForm
                        initialData={selectedResponsibility}
                        onResponsibilityCreated={() => {
                            setRefreshTrigger(prev => prev + 1);
                            setIsResponsibilityModalOpen(false);
                            setSelectedResponsibility(null);
                        }}
                        onCancel={() => { setIsResponsibilityModalOpen(false); setSelectedResponsibility(null); }}
                    />
                )}
            </ActivityModal>

            <ActivityDetailModal
                activity={detailActivity}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                isLoggedIn={!!currentUser}
                currentUser={currentUser}
                userRoles={userRoles}
                onRegisterSuccess={() => setRefreshTrigger(prev => prev + 1)}
                onSwitchToRegister={() => { }}
            />

            <ResponsibilityDetailModal
                responsibility={responsibilityDetail}
                isOpen={isResponsibilityDetailOpen}
                onClose={() => { setIsResponsibilityDetailOpen(false); setResponsibilityDetail(null); }}
                onStateChange={(id, newState) => {
                    setResponsibilityDetail((prev: any) => prev?.id === id ? { ...prev, state: newState } : prev);
                }}
            />

            <HolidayDetailModal
                holiday={selectedHoliday}
                isOpen={isHolidayModalOpen}
                onClose={() => { setIsHolidayModalOpen(false); setSelectedHoliday(null); }}
            />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                currentUser={currentUser}
                onProfileUpdate={setCurrentUser}
            />
        </div>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
                <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        }>
            <CalendarPageContent />
        </Suspense>
    );
}