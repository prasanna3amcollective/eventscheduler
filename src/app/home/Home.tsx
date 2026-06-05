'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HeaderPanel from '@/components/HeaderPanel';
import AboutUs from '@/components/AboutUs';
import CalendarView from '@/components/CalendarView';
import ActivityForm from '@/components/ActivityForm';
import ResponsibilityForm from '@/components/ResponsibilityForm';
import ActivityModal from '@/components/ActivityModal';
import RegisterForm from '@/components/RegisterForm';
import ActivityCarousel from '@/components/ActivityCarousel';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import ResponsibilityDetailModal from '@/components/ResponsibilityDetailModal';
import AdminDashboard from '@/components/AdminDashboard';
import ProfileModal from '@/components/ProfileModal';
import MarqueeBanner from '@/components/MarqueeBanner';
import InstagramEmbed from '@/components/InstagramEmbed';
import { CalendarDays, PlusCircle, LogOut, Info, ShieldCheck, User, ChevronDown } from '@/components/Icons';
import './Home.css';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState({ canCreateActivity: false, canCreateResponsibility: false });
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [activeSection, setActiveSection] = useState('participate');
  const [activeTab, setActiveTab] = useState('calendar');

  // Initialize activeSection from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') || 'participate';
    setActiveSection(hash);
  }, []);



  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New top auth UI states
  const [showSignInPanel, setShowSignInPanel] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Local state for compact sign-in panel
  const [signinPhone, setSigninPhone] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError] = useState<string | null>(null);
  const [signinSubmitting, setSigninSubmitting] = useState(false);

  // Theme switcher removed; using permanent dark theme
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);

  // Scroll reveal effect
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    };
    const io = new IntersectionObserver(handleIntersection, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [activeSection]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResponsibility, setSelectedResponsibility] = useState<any>(null);
  const [isResponsibilityModalOpen, setIsResponsibilityModalOpen] = useState(false);

  const [detailActivity, setDetailActivity] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [responsibilityDetail, setResponsibilityDetail] = useState<any>(null);
  const [isResponsibilityDetailOpen, setIsResponsibilityDetailOpen] = useState(false);
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
          setUserPermissions(data.permissions || { canCreateActivity: false, canCreateResponsibility: false });
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
        setUserPermissions(data.permissions || { canCreateActivity: false, canCreateResponsibility: false });
      }
    } catch (e) { /* ignore */ }
    setPendingEventId(null);
  };

  const handlePanelSignIn = async () => {
    if (!signinPhone.trim() || !signinPassword) {
      setSigninError('Please enter phone number and password');
      return;
    }
    setSigninSubmitting(true);
    setSigninError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: signinPhone.trim(), password: signinPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        handleLoginSuccess(data.user);
        setShowSignInPanel(false);
        setSigninPhone('');
        setSigninPassword('');
        setSigninError(null);
      } else {
        setSigninError(data.error || 'Login failed');
      }
    } catch (_err) {
      setSigninError('An unexpected error occurred');
    } finally {
      setSigninSubmitting(false);
    }
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
    if (!userPermissions.canCreateActivity) return;

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

  useEffect(() => {
    if (!isDetailOpen || !isLoggedIn || !detailActivity?.id) return;

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
            leader: data.leaders || (data as any).leader || [],
            guide: data.guides || (data as any).guide || [],
            observer: data.observers || (data as any).observer || [],
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
  }, [isDetailOpen, isLoggedIn, detailActivity?.id]);

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

  if (!isLoggedIn) {
    return (
      <div className="landing-page fade-in">
        <MarqueeBanner />
        <HeaderPanel
          isLoggedIn={isLoggedIn}
          showSignInPanel={showSignInPanel}
          setShowSignInPanel={setShowSignInPanel}
          setShowRegisterModal={setShowRegisterModal}
          signinUsername={signinPhone}
          setSigninUsername={setSigninPhone}
          signinPassword={signinPassword}
          setSigninPassword={setSigninPassword}
          signinSubmitting={signinSubmitting}
          setSigninSubmitting={setSigninSubmitting}
          signinError={signinError}
          setSigninError={setSigninError}
          handlePanelSignIn={handlePanelSignIn}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />


        <section id="about-us" style={{ display: activeSection === 'about-us' ? 'block' : 'none' }}>
          <AboutUs />
        </section>
        <section id="participate" style={{ display: activeSection === 'participate' ? 'block' : 'none', textAlign: 'left', padding: '40px 0' }}>
          <p>Join our events, volunteer, or become a member of the community.</p>
          <ActivityCarousel
            refreshTrigger={refreshTrigger}
            onActivityClick={handleCarouselClick}
            isLoggedIn={isLoggedIn}
            headerRight={null}
          />
        </section>
        <section id="gallery" style={{ display: activeSection === 'gallery' ? 'block' : 'none', textAlign: 'center', padding: '40px 0' }}>
          <h2>Gallery</h2>
          <p>Explore photos and videos from past activities.</p>
        </section>
        <section id="explore" style={{ display: activeSection === 'explore' ? 'block' : 'none', textAlign: 'center', padding: '40px 0' }}>
  <h2>Explore</h2>
  <p>Discover new projects and community initiatives.</p>
  {/* Latest Posts Section */}
  <section className="latest-posts-section" style={{ marginTop: '48px' }}>
    <h2 className="section-title">Explore our Communities</h2>
    <p className="section-description">
      Stay updated with the newest activities and community highlights.
    </p>
    <div className="latest-posts-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
      <div className="post-card">Writer's Community</div>
      <div className="post-card">Cinemat Community</div>
      <div className="post-card">Music Community</div>
      <div className="post-card">Tech Community</div>
    </div>
  </section>
</section>





        {/* <div className="landing-content">
          <div className="info-section">
            <div className="info-card">
              <Info size={32} color="var(--primary-color)" />
              <h2>Explore Activities</h2>
              <p>Welcome to the 3AM COLLECTIVE MOVEMENT . Browse upcoming workshops, sync with your calendar, and register for sessions.</p>
              <ul className="feature-list">
                <li>Click on any carousel item above to view details</li>
                <li>Register to participate in upcoming activities</li>
                <li>Manage your schedule with our interactive calendar</li>
              </ul>
            </div>
          </div>
        </div>
 */}
        <ActivityDetailModal
          activity={detailActivity}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          isLoggedIn={false}
          currentUser={null}
          onRegisterSuccess={() => setRefreshTrigger(prev => prev + 1)}
          onSwitchToRegister={() => {
            setPendingEventId(detailActivity.id);
            setIsDetailOpen(false);
            setShowRegisterModal(true);
          }}
        />

        {/* Register popup modal */}
        {
          showRegisterModal && (
            <div
              className="modal-overlay"
              onClick={() => setShowRegisterModal(false)}
              style={{ zIndex: 2000 }}
            >
              <div
                className="modal-content register-modal"
                style={{ maxWidth: '560px', padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
                <RegisterForm
                  onSuccess={(user) => {
                    handleLoginSuccess(user);
                    setShowRegisterModal(false);
                  }}
                  pendingEventId={pendingEventId}
                  hideTitle
                  submitText="Join"
                />
              </div>
            </div>
          )
        }
      </div >
    );
  }

  return (
    <div className="dashboard-layout fade-in">
      <MarqueeBanner />

      {/* Thin controls bar below the banner (user controls only; title moved to marquee above) */}
      <header className="dashboard-header">
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
        {userRoles.includes('developer') && (
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
              onOwnResponsibility={onOwnResponsibility}
              userRoles={userRoles}
              userPermissions={userPermissions}
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
        isLoggedIn={isLoggedIn}
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
          setResponsibilityDetail(prev => prev && prev.id === id ? { ...prev, state: newState } : prev);
        }}
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