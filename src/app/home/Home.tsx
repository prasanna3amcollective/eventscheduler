'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
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
import { triggerStaggeredTransition, triggerStaggeredTransitionBackwards, isStaggeredTransitionBusy } from '@/components/StaggeredTransition';
import Testimonials from '@/components/Testimonials';

import { CalendarDays, LogOut, ShieldCheck, User, ChevronDown, Search, Home as HomeIcon } from '@/components/Icons';
import './Home.css';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const {
    isLoggedIn,
    currentUser,
    setCurrentUser,
    userRoles,
    setUserRoles,
    userPermissions,
    setUserPermissions,
    isLoadingSession,
    showSignInPanel,
    setShowSignInPanel,
    showRegisterModal,
    setShowRegisterModal,
    signinPhone,
    setSigninPhone,
    signinPassword,
    setSigninPassword,
    signinError,
    setSigninError,
    signinSubmitting,
    setSigninSubmitting,
    handlePanelSignIn,
    handleLoginSuccess,
  } = useAuth();

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
    if (pathname === '/about-us') {
      setActiveSection('about-us');
      if (!isStaggeredTransitionBusy()) {
        triggerStaggeredTransition();
      }
    } else {
      const hash = globalThis.location.hash.replace('#', '') || 'participate';
      setActiveSection(hash);
    }
  }, [pathname, isLoggedIn]);



  const [refreshTrigger, setRefreshTrigger] = useState(0);

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






  const handleActivityCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsModalOpen(false);
    setSelectedActivity(null);
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

  return (
    <>
      <main className={`app-container ${activeSection === 'about-us' ? 'about-us-container' : ''}`}>
        {activeSection === 'about-us' && (
          <div style={{ width: '100%', minHeight: '100vh' }}>
            <AboutUs onBackClick={() => {
              if (isStaggeredTransitionBusy()) return;
              triggerStaggeredTransitionBackwards(() => {
                router.push('/home');
              });
            }} />
          </div>
        )}

        {activeSection === 'participate' && (
          <section id="participate" style={{ textAlign: 'left', padding: '40px' }}>
            <p>Join our events, volunteer, or become a member of the community.</p>
            <BannerSlideshow />
            <ActivityCarousel
              refreshTrigger={refreshTrigger}
              onActivityClick={handleCarouselClick}
              isLoggedIn={isLoggedIn}
              headerRight={
                isLoggedIn ? (
                  <div style={{ display: 'flex', gap: '12px', marginRight: '8px' }}>
                    {userPermissions.canCreateResponsibility && (
                      <button
                        onClick={onOwnResponsibility}
                        className="pink-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Own Responsibility
                      </button>
                    )}
                    {userPermissions.canCreateActivity && (
                      <button
                        className="yellow-btn"
                        onClick={onCreateActivity}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Create Activity
                      </button>
                    )}
                  </div>
                ) : null
              }
            />
          </section>
        )}

        {activeSection === 'explore' && (
          <section id="explore" style={{ textAlign: 'center', padding: '40px 0' }}>
            <section className="latest-posts-section" style={{ marginTop: '48px' }}>
              <h2 className="section-title">Nested Communities</h2>
              <div className="latest-posts-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
                <button type="button" className="post-card post-card--actors" onClick={() => router.push('/explore/actors-community')} style={{ cursor: 'pointer' }}>Actors Community</button>
                <button type="button" className="post-card post-card--writers" onClick={() => router.push('/explore/writers-community')} style={{ cursor: 'pointer' }}>Writer's Community</button>
                <button type="button" className="post-card post-card--tech" onClick={() => router.push('/explore/tech-community')} style={{ cursor: 'pointer' }}>Tech Community</button>
                <button type="button" className="post-card post-card--podcast" onClick={() => router.push('/explore/podcast-community')} style={{ cursor: 'pointer' }}>Podcast Community</button>
                <button type="button" className="post-card post-card--storytelling" onClick={() => router.push('/explore/storytelling-community')} style={{ cursor: 'pointer' }}>Storytelling Community</button>
              </div>
            </section>
          </section>
        )}

        <ActivityDetailModal
          activity={detailActivity}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          userRoles={userRoles}
          onRegisterSuccess={() => setRefreshTrigger(prev => prev + 1)}
          onSwitchToRegister={() => {
            setPendingEventId(detailActivity.id);
            setIsDetailOpen(false);
            setShowRegisterModal(true);
          }}
        />

        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedActivity(null); }}
          title={selectedActivity?.id ? "Edit Activity" : "Create New Activity"}
        >
          <ActivityForm
            initialData={selectedActivity || undefined}
            onActivityCreated={handleActivityCreated}
            onCancel={() => { setIsModalOpen(false); setSelectedActivity(null); }}
          />
        </ActivityModal>

        <ResponsibilityDetailModal
          responsibility={responsibilityDetail}
          isOpen={isResponsibilityDetailOpen}
          onClose={() => { setIsResponsibilityDetailOpen(false); setResponsibilityDetail(null); }}
          onStateChange={(id, newState) => {
            setResponsibilityDetail((prev: any) => prev && prev.id === id ? { ...prev, state: newState } : prev);
          }}
        />

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

        <HolidayDetailModal
          holiday={selectedHoliday}
          isOpen={isHolidayModalOpen}
          onClose={() => {
            setIsHolidayModalOpen(false);
            setSelectedHoliday(null);
          }}
        />
      </main>
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