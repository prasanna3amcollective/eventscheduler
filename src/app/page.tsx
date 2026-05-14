'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import EventForm from '@/components/EventForm';
import EventModal from '@/components/EventModal';
import RegisterForm from '@/components/RegisterForm';
import LoginForm from '@/components/LoginForm';
import EventCarousel from '@/components/EventCarousel';
import EventDetailModal from '@/components/EventDetailModal';
import AdminDashboard from '@/components/AdminDashboard';
import ProfileModal from '@/components/ProfileModal';
import { CalendarDays, PlusCircle, LogOut, Layout, Info, ShieldCheck, User, ChevronDown } from '@/components/Icons';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [activeTab, setActiveTab] = useState<'calendar' | 'scheduler' | 'admin'>('calendar');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [detailEvent, setDetailEvent] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
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
          setIsLoggedIn(true);

          // Check if we need to open scheduler tab with edit event
          const tabParam = searchParams.get('tab');
          const editEventId = sessionStorage.getItem('editEventId');

          if (tabParam === 'scheduler' && editEventId) {
            sessionStorage.removeItem('editEventId');
            setActiveTab('scheduler');
            // Set up the event form to load the event for editing
            try {
              const eventRes = await fetch(`/api/events/${editEventId}`);
              if (eventRes.ok) {
                const eventData = await eventRes.json();
                setSelectedEvent(eventData);
                setIsModalOpen(true);
              }
            } catch (e) {
              console.error('Failed to load event for editing:', e);
            }
            // Clean up URL
            router.replace('/');
          }
        }
      } catch (e) {
        console.error("Session check failed");
      } finally {
        setIsLoadingSession(false);
      }
    };
    checkSession();
  }, [searchParams, router]);

  useEffect(() => {
    const handleClickOutside = () => setShowProfileDropdown(false);
    if (showProfileDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileDropdown]);

  const handleLoginSuccess = async (user: any) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    // Fetch roles after login
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUserRoles(data.roles || []);
      }
    } catch (e) { /* ignore */ }
    setPendingEventId(null);
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRoles([]);
  };

  const handleEventCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsModalOpen(false);
    setSelectedEvent(null);
    if (activeTab === 'scheduler') setActiveTab('calendar');
  };

  const handleSelectEvent = (event: any) => {
    if (event.isHoliday) return;

    // Map CalendarEvent format (from react-big-calendar) to EventData format (expected by EventDetailModal)
    // CalendarEvent has: title, start (Date), end (Date), leader, guide, observer
    // EventData expects: name, startDateTime (string), endDateTime (string), leader, guide, observer
    const mappedEvent = {
      id: event.id,
      name: event.title,
      startDateTime: event.start instanceof Date ? event.start.toISOString() : event.start,
      endDateTime: event.end instanceof Date ? event.end.toISOString() : event.end,
      leader: event.leader,
      guide: event.guide,
      observer: event.observer,
      participants: event.participants,
    };

    setDetailEvent(mappedEvent);
    setIsDetailOpen(true);
  };

  const handleSelectSlot = (slotInfo: any) => {
    // Only core/inhouse can create via double-click
    if (!userRoles.includes('core') && !userRoles.includes('inhouse')) return;

    // Check for double click or selection
    if (slotInfo.action === 'select' || slotInfo.action === 'doubleClick') {
      const newEvent = {
        startDateTime: slotInfo.start,
        endDateTime: slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000),
        name: '',
        leader: '',
        guide: '',
        observer: '',
        duration: 60
      };
      setSelectedEvent(newEvent);
      setIsModalOpen(true);
    }
  };

  const handleCarouselClick = (event: any) => {
    setDetailEvent(event);
    setIsDetailOpen(true);
  };

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="landing-page fade-in">
        <header className="dashboard-header">
          <div className="header-brand">
            <Layout size={24} />
            <h1>3AM Collective Movement</h1>
          </div>
        </header>

        <EventCarousel refreshTrigger={refreshTrigger} onEventClick={handleCarouselClick} />

        <div className="landing-content">
          <div className="auth-section">
            <div className="auth-card">
              <div className="auth-toggle">
                <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
                <button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
              </div>
              {authMode === 'login'
                ? <LoginForm onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAuthMode('register')} />
                : <RegisterForm
                  onSuccess={handleLoginSuccess}
                  pendingEventId={pendingEventId}
                />
              }
            </div>
          </div>

          <div className="info-section">
            <div className="info-card">
              <Info size={32} color="var(--primary-color)" />
              <h2>Explore Events</h2>
              <p>Welcome to the 3AM Collective Movement. Browse upcoming workshops, sync with your calendar, and register for sessions.</p>
              <ul className="feature-list">
                <li>Click on any carousel item above to view details</li>
                <li>Register to participate in upcoming events</li>
                <li>Manage your schedule with our interactive calendar</li>
              </ul>
            </div>
          </div>
        </div>

        <EventDetailModal
          event={detailEvent}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          isLoggedIn={false}
          currentUser={null}
          onRegisterSuccess={() => setRefreshTrigger(prev => prev + 1)}
          onSwitchToRegister={() => {
            setPendingEventId(detailEvent.originalId || detailEvent.id);
            setAuthMode('register');
            setIsDetailOpen(false);
            // Smooth scroll to auth section
            document.querySelector('.auth-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-layout fade-in">
      <header className="dashboard-header">
        <div className="header-brand">
          <Layout size={24} />
          <h1>3AM Collective</h1>
        </div>
        <div className="header-user">
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
              <span className="user-name">{currentUser?.name}</span>
              <ChevronDown size={14} />
            </button>
            {showProfileDropdown && (
              <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setIsProfileOpen(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
          <span className={`user-type-tag ${currentUser?.type}`}>{currentUser?.type}</span>
          <button onClick={handleLogout} className="btn-logout" title="Logout"><LogOut size={18} /></button>
        </div>
      </header>

      <EventCarousel refreshTrigger={refreshTrigger} onEventClick={handleCarouselClick} />

      <nav className="nav-container">
        <button className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarDays size={18} /> Calendar View
        </button>
        {(userRoles.includes('core') || userRoles.includes('inhouse')) && (
          <button className={`nav-tab ${activeTab === 'scheduler' ? 'active' : ''}`} onClick={() => setActiveTab('scheduler')}>
            <PlusCircle size={18} /> Create Event
          </button>
        )}
        {userRoles.includes('core') && (
          <button className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            <ShieldCheck size={18} /> Core
          </button>
        )}
      </nav>

      <main className="app-container">
        {activeTab === 'calendar' && (
          <div className="content-section">
            <CalendarView
              refreshTrigger={refreshTrigger}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
            />
          </div>
        )}
        {activeTab === 'scheduler' && (
          <div className="content-section">
            <EventForm onEventCreated={handleEventCreated} />
          </div>
        )}
        {activeTab === 'admin' && (
          <AdminDashboard currentUser={currentUser} />
        )}
      </main>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }}
        title={selectedEvent?.id ? "Edit Event" : "Create New Event"}
      >
        {selectedEvent && (
          <EventForm
            initialData={selectedEvent}
            onEventCreated={handleEventCreated}
            onCancel={() => { setIsModalOpen(false); setSelectedEvent(null); }}
          />
        )}
      </EventModal>

      <EventDetailModal
        event={detailEvent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        userRoles={userRoles}
        onRegisterSuccess={() => setRefreshTrigger(prev => prev + 1)}
        onSwitchToRegister={() => { }}
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

export default function Home() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
