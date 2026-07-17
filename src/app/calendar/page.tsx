'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import ActivityForm from '@/components/ActivityForm';
import ResponsibilityForm from '@/components/ResponsibilityForm';
import ActivityModal from '@/components/ActivityModal';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import ResponsibilityDetailModal from '@/components/ResponsibilityDetailModal';
import EventActivityDetailModal from '@/components/EventActivityDetailModal';
import EventResponsibilityDetailModal from '@/components/EventResponsibilityDetailModal';
import HolidayDetailModal from '@/components/HolidayDetailModal';
import ProfileModal from '@/components/ProfileModal';

function CalendarPageContent() {
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

    // Event-scoped item modals
    const [selectedEventActivity, setSelectedEventActivity] = useState<any>(null);
    const [isEventActivityDetailOpen, setIsEventActivityDetailOpen] = useState(false);
    const [selectedEventResponsibility, setSelectedEventResponsibility] = useState<any>(null);
    const [isEventResponsibilityDetailOpen, setIsEventResponsibilityDetailOpen] = useState(false);

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


    const handleActivityCreated = () => {
        setRefreshTrigger(prev => prev + 1);
        setIsModalOpen(false);
        setSelectedActivity(null);
    };

    const handleSelectActivity = (activity: any) => {
        // Event activities → open EventActivityDetailModal
        if (activity.isEventActivity) {
            setSelectedEventActivity({
                id: activity.id,
                name: activity.title,
                startDateTime: activity.start instanceof Date ? activity.start.toISOString() : activity.start,
                endDateTime: activity.end instanceof Date ? activity.end.toISOString() : activity.end,
                duration: activity.duration,
                category: activity.category,
                state: activity.state,
                leaders: activity.leaders,
                guides: activity.guides,
                observers: activity.observers,
                participants: activity.participants,
                eventId: activity.eventId,
            });
            setIsEventActivityDetailOpen(true);
            return;
        }

        // Event responsibilities → open EventResponsibilityDetailModal
        if (activity.isEventResponsibility) {
            setSelectedEventResponsibility({
                id: activity.id,
                name: activity.title,
                startDateTime: activity.start instanceof Date ? activity.start.toISOString() : activity.start,
                endDateTime: activity.end instanceof Date ? activity.end.toISOString() : activity.end,
                duration: activity.duration,
                category: activity.category,
                state: activity.state,
                owner: activity.owner,
                eventId: activity.eventId,
            });
            setIsEventResponsibilityDetailOpen(true);
            return;
        }

        // Regular responsibilities → ResponsibilityDetailModal
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

        // Regular activities → ActivityDetailModal
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



    if (isLoadingSession) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
                <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="fade-in">
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

            <EventActivityDetailModal
                eventActivity={selectedEventActivity}
                isOpen={isEventActivityDetailOpen}
                onClose={() => { setIsEventActivityDetailOpen(false); setSelectedEventActivity(null); }}
                currentUser={currentUser}
                onRegisterSuccess={() => setRefreshTrigger(prev => prev + 1)}
                eventId={selectedEventActivity?.eventId}
            />

            <EventResponsibilityDetailModal
                eventResponsibility={selectedEventResponsibility}
                isOpen={isEventResponsibilityDetailOpen}
                onClose={() => { setIsEventResponsibilityDetailOpen(false); setSelectedEventResponsibility(null); }}
                currentUser={currentUser}
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