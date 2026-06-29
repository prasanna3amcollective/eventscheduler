'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import HeaderPanel from '@/components/HeaderPanel';
import AboutUs from '@/components/AboutUs';
import CalendarView from '@/components/CalendarView';
import ActivityForm from '@/components/ActivityForm';
import ResponsibilityForm from '@/components/ResponsibilityForm';
import ActivityModal from '@/components/ActivityModal';
import RegisterForm from '@/components/RegisterForm';
import ActivityCarousel from '@/components/ActivityCarousel';
import BannerSlideshow from '@/components/BannerSlideshow';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import ResponsibilityDetailModal from '@/components/ResponsibilityDetailModal';
import HolidayDetailModal from '@/components/HolidayDetailModal';
import AdminDashboard from '@/components/AdminDashboard';
import ProfileModal from '@/components/ProfileModal';
import MarqueeBanner from '@/components/MarqueeBanner';
import StaggeredTransition, { StaggeredTransitionRef } from '@/components/StaggeredTransition';
import Testimonials from '@/components/Testimonials';
import Gallery from '@/components/Gallery';
import { CalendarDays, LogOut, ShieldCheck, User, ChevronDown, Home as HomeIcon } from '@/components/Icons';
import './Home.css';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState({ canCreateActivity: false, canCreateResponsibility: false });
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [activeSection, setActiveSection] = useState('participate');
  const [activeTab, setActiveTab] = useState('home');

  // Initialize activeSection from URL path/hash on mount
  useEffect(() => {
    if (isLoggedIn) {
      // If user is logged in, ensure we don't default to testimonials
      const hash = globalThis.location.hash.replace('#', '') || 'participate';
      if (hash === 'testimonials') {
        setActiveSection('participate');
        globalThis.history.replaceState(null, '', '/home');
        return;
      }
    }
    if (pathname === '/home/aboutus') {
      setActiveSection('about-us');
    } else if (pathname === '/home/testimonials') {
      setActiveSection('testimonials');
    } else {
      const hash = globalThis.location.hash.replace('#', '') || 'participate';
      setActiveSection(hash);
    }
  }, [pathname, isLoggedIn]);



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
  const [selectedHoliday, setSelectedHoliday] = useState<{ id: string; name: string; date: string } | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
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
        }
      } catch (e) {
        console.error("Session check failed: " + e);
      } finally {
        setIsLoadingSession(false);
      }
    };
    checkSession();
  }, []);

  const transitionRef = useRef<StaggeredTransitionRef>(null);

  const handleTransitionMidpoint = () => {
    setActiveSection('about-us');
    globalThis.history.pushState(null, '', '/home/aboutus');
  };

  const handleBackwardMidpoint = () => {
    setActiveSection('participate');
    globalThis.history.pushState(null, '', '/home');
  };

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
    } catch (e) {
      console.error("Failed to fetch user roles:", e);
    }
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
    } catch (err) {
      console.error("Login exception:", err);
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

  const handleSelectHoliday = (holiday: { id: string; name: string; date: string }) => {
    setSelectedHoliday(holiday);
    setIsHolidayModalOpen(true);
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
  }, [isDetailOpen, isLoggedIn, detailActivity?.id]);

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <StaggeredTransition ref={transitionRef} onMidpoint={handleTransitionMidpoint} />
        <div className="landing-page fade-in">
          {activeSection !== 'about-us' && <MarqueeBanner />}
          {activeSection !== 'about-us' && (
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
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              handlePanelSignIn={handlePanelSignIn}
              onAboutUsClick={() => transitionRef.current?.trigger()}
            />
          )}


          {activeSection === 'about-us' && (
            <div style={{ width: '100%', minHeight: '100vh' }}>
              <AboutUs onBackClick={() => transitionRef.current?.triggerBackwards(handleBackwardMidpoint)} />
            </div>
          )}

          {activeSection === 'participate' && (
            <section id="participate" style={{ textAlign: 'left', padding: '40px' }}>
              <p>Join our events, volunteer, or become a member of the community.</p>

              {/* Decorative Banner Slideshow */}
              <BannerSlideshow />

              <ActivityCarousel
                refreshTrigger={refreshTrigger}
                onActivityClick={handleCarouselClick}
                isLoggedIn={isLoggedIn}
                headerRight={null}
              />
            </section>
          )}

          {activeSection === 'gallery' && (
            <section id="gallery">
              <Gallery />
            </section>
          )}

          {activeSection === 'explore' && (
            <section id="explore" style={{ textAlign: 'center', padding: '40px 0' }}>
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
                  <div className="post-card" onClick={() => router.push('/home/tech-community')} style={{ cursor: 'pointer' }}>Tech Community</div>
                </div>
              </section>
            </section>
          )}

          {activeSection === 'testimonials' && (
            <div style={{ width: '100%', minHeight: '100vh' }}>
              <Testimonials onBackClick={() => { globalThis.history.pushState(null, '', '/home'); setActiveSection('participate'); }} />
            </div>
          )}

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
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
              <div
                className="modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowRegisterModal(false);
                  }
                }}
                style={{ zIndex: 2000 }}
              >
                <div
                  className="modal-content register-modal"
                  style={{ maxWidth: '560px', padding: '32px' }}
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
      </>
    );
  }

  return (
    <>
      <div className="dashboard-layout fade-in">
        <MarqueeBanner />

        <nav className="nav-container">
          <div className="nav-left-spacer"></div>
          <div className="nav-buttons">
            <button className={`nav-link-btn ${activeTab === 'home' ? 'active text-black' : ''}`} onClick={() => setActiveTab('home')}>
              <HomeIcon size={18} /> Home
            </button>
            <button className={`nav-link-btn ${activeTab === 'calendar' ? 'active text-black' : ''}`} onClick={() => router.push('/calendar')}>
              <CalendarDays size={18} /> Calendar View
            </button>
            {userRoles.includes('developer') && (
              <button className={`nav-link-btn ${activeTab === 'admin' ? 'active text-black' : ''}`} onClick={() => setActiveTab('admin')}>
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

        <main className="app-container">
          {activeTab === 'home' && (
            <section style={{ textAlign: 'left' }}>
              <BannerSlideshow />
              <ActivityCarousel
                refreshTrigger={refreshTrigger}
                onActivityClick={handleCarouselClick}
                isLoggedIn={isLoggedIn}
                headerRight={null}
              />
            </section>
          )}
          {activeTab === 'admin' && (
            <AdminDashboard currentUser={currentUser} />
          )}
        </main>

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
      </div >
    </>
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