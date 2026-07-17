'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import MarqueeBanner from '@/components/MarqueeBanner';
import HeaderPanel from '@/components/HeaderPanel';
import RegisterForm from '@/components/RegisterForm';
import ProfileModal from '@/components/ProfileModal';
import { LogOut, User, ChevronDown, Home as HomeIcon, CalendarDays, Search, ShieldCheck } from '@/components/Icons';

function ExplorePageContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Unauthenticated sign-in/register state (mirrors Home.tsx)
  const [showSignInPanel, setShowSignInPanel] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [signinPhone, setSigninPhone] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError] = useState<string | null>(null);
  const [signinSubmitting, setSigninSubmitting] = useState(false);

  // Theme
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setShowProfileDropdown(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setUserRoles(data.roles || []);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setIsLoadingSession(false);
      }
    };
    checkSession();
  }, []);

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
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setShowSignInPanel(false);
        setSigninPhone('');
        setSigninPassword('');
        setSigninError(null);
        // Fetch roles
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setUserRoles(meData.roles || []);
        }
      } else {
        setSigninError(data.error || 'Login failed');
      }
    } catch {
      setSigninError('An unexpected error occurred');
    } finally {
      setSigninSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setCurrentUser(null);
    setUserRoles([]);
    setIsLoggedIn(false);
  };

  const CommunitiesContent = () => (
    <main className="app-container">
      <section id="explore" style={{ textAlign: 'center', padding: '40px 0' }}>
        <section className="latest-posts-section" style={{ marginTop: '48px' }}>
          <h2 className="section-title">Explore our Nested Communities</h2>
          <div className="latest-posts-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
            <button type="button" className="post-card post-card--actors" onClick={() => router.push('/explore/actors-community')} style={{ cursor: 'pointer' }}>Actors Community</button>
            <button type="button" className="post-card post-card--writers" onClick={() => router.push('/explore/writers-community')} style={{ cursor: 'pointer' }}>Writer's Community</button>
            <button type="button" className="post-card" style={{ cursor: 'pointer' }}>Cinemat Community</button>
            <button type="button" className="post-card" style={{ cursor: 'pointer' }}>Music Community</button>
            <button type="button" className="post-card post-card--tech" onClick={() => router.push('/explore/tech-community')} style={{ cursor: 'pointer' }}>Tech Community</button>
            <button type="button" className="post-card post-card--podcast" onClick={() => router.push('/explore/podcast-community')} style={{ cursor: 'pointer' }}>Podcast Community</button>
            <button type="button" className="post-card post-card--storytelling" onClick={() => router.push('/explore/storytelling-community')} style={{ cursor: 'pointer' }}>Storytelling Community</button>
          </div>
        </section>
      </section>
    </main>
  );

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // ─── Unauthenticated view — HeaderPanel + communities ────────────────────────
  if (!isLoggedIn) {
    return (
      <>
        <div className="landing-page fade-in">
          <MarqueeBanner />
          <HeaderPanel
            isLoggedIn={false}
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
            activeSection="explore"
            setActiveSection={() => {}}
            handlePanelSignIn={handlePanelSignIn}
          />
          <CommunitiesContent />
        </div>

        {showRegisterModal && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowRegisterModal(false); }}
            style={{ zIndex: 2000 }}
          >
            <div className="modal-content register-modal" style={{ maxWidth: '560px', padding: '32px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={() => setShowRegisterModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <RegisterForm
                onSuccess={(user) => {
                  setCurrentUser(user);
                  setIsLoggedIn(true);
                  setShowRegisterModal(false);
                }}
                pendingEventId={null}
                hideTitle
                submitText="Join"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── Authenticated view — dashboard nav + communities ─────────────────────────
  return (
    <div className="dashboard-layout fade-in" style={{ minHeight: '100vh' }}>
      <MarqueeBanner />

      <nav className="nav-container">
        <div className="nav-left-spacer" />
        <div className="nav-buttons">
          <button className="nav-link-btn" onClick={() => router.push('/home')}>
            <HomeIcon size={18} /> Home
          </button>
          <button className="nav-link-btn" onClick={() => router.push('/calendar')}>
            <CalendarDays size={18} /> Calendar View
          </button>
          <button className="nav-link-btn active text-black">
            <Search size={18} /> Explore
          </button>
          {userRoles.includes('developer') && (
            <button className="nav-link-btn" onClick={() => router.push('/developer-panel')}>
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

      <CommunitiesContent />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdate={setCurrentUser}
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <ExplorePageContent />
    </Suspense>
  );
}
