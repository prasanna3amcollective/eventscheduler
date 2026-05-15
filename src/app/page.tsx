'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import ActivityForm from '@/components/ActivityForm';
import ActivityModal from '@/components/ActivityModal';
import RegisterForm from '@/components/RegisterForm';
import LoginForm from '@/components/LoginForm';
import ActivityCarousel from '@/components/ActivityCarousel';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import AdminDashboard from '@/components/AdminDashboard';
import ProfileModal from '@/components/ProfileModal';
import { CalendarDays, PlusCircle, LogOut, Info, ShieldCheck, User, ChevronDown } from '@/components/Icons';

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
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [detailActivity, setDetailActivity] = useState<any>(null);
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

          // Check if we need to open scheduler tab with edit activity
          const tabParam = searchParams.get('tab');
          const editEventId = sessionStorage.getItem('editEventId');

          if (tabParam === 'scheduler' && editEventId) {
            sessionStorage.removeItem('editEventId');
            setActiveTab('scheduler');
            // Set up the activity form to load the activity for editing
            try {
              const activityRes = await fetch(`/api/activities/${editEventId}`);
              if (activityRes.ok) {
                const activityData = await activityRes.json();
                setSelectedActivity(activityData);
                setIsModalOpen(true);
              }
            } catch (e) {
              console.error('Failed to load activity for editing:', e);
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

  const handleActivityCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsModalOpen(false);
    setSelectedActivity(null);
    if (activeTab === 'scheduler') setActiveTab('calendar');
  };

  const handleSelectActivity = (activity: any) => {
    if (activity.isHoliday) return;

    // Map CalendarActivity format (from react-big-calendar) to ActivityData format (expected by ActivityDetailModal)
    // CalendarActivity has: title, start (Date), end (Date), leader, guide, observer
    // ActivityData expects: name, startDateTime (string), endDateTime (string), leader, guide, observer
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

  const handleSelectSlot = (slotInfo: any) => {
    // Only core/inhouse can create via double-click
    if (!userRoles.includes('core') && !userRoles.includes('inhouse')) return;

    // Check for double click or selection
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

  const handleCarouselClick = (activity: any) => {
    setDetailActivity(activity);
    setIsDetailOpen(true);
  };

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
            <img src="/fist.png" alt="Clenched Fist" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <h1>3AM Collective Movement</h1>
          </div>
        </header>

        <ActivityCarousel
          refreshTrigger={refreshTrigger}
          onActivityClick={handleCarouselClick}
          isLoggedIn={isLoggedIn}
        />

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
              <h2>Explore Activities</h2>
              <p>Welcome to the 3AM Collective Movement. Browse upcoming workshops, sync with your calendar, and register for sessions.</p>
              <ul className="feature-list">
                <li>Click on any carousel item above to view details</li>
                <li>Register to participate in upcoming activities</li>
                <li>Manage your schedule with our interactive calendar</li>
              </ul>
            </div>
          </div>
        </div>

        <ActivityDetailModal
          activity={detailActivity}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          isLoggedIn={false}
          currentUser={null}
          onRegisterSuccess={() => setRefreshTrigger(prev => prev + 1)}
          onSwitchToRegister={() => {
            setPendingEventId(detailActivity.originalId || detailActivity.id);
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
          <img src="/fist.png" alt="Clenched Fist" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
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
          <button onClick={handleLogout} className="btn-logout" title="Logout"><LogOut size={18} /></button>
        </div>
      </header>

      <nav className="nav-container">
        <button className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarDays size={18} /> Calendar View
        </button>
        {userRoles.includes('core') && (
          <button className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            <ShieldCheck size={18} /> Developer Panel
          </button>
        )}
      </nav>

      <main className="app-container">
        {activeTab === 'calendar' && (
          <div className="content-section">
            <CalendarView
              refreshTrigger={refreshTrigger}
              onSelectActivity={handleSelectActivity}
              onSelectSlot={handleSelectSlot}
              onCreateActivity={onCreateActivity}
              userRoles={userRoles}
            />
          </div>
        )}
        {activeTab === 'admin' && (
          <AdminDashboard currentUser={currentUser} />
        )}
      </main>

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

      <ActivityDetailModal
        activity={detailActivity}
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