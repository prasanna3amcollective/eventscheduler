'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import MarqueeBanner from './MarqueeBanner';
import HeaderPanel from './HeaderPanel';
import RegisterForm from './RegisterForm';
import ProfileModal from './ProfileModal';
import FooterPanel from './FooterPanel';
import MarqueeBannerMobile from './MarqueeBanner_mobile';
import StaggeredTransition, { triggerStaggeredTransition, isStaggeredTransitionBusy } from './StaggeredTransition';
import { LogOut, User, ChevronDown, Home as HomeIcon, CalendarDays, Search, ShieldCheck, Layers } from './Icons';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isLoggedIn,
    isLoadingSession,
    currentUser,
    setCurrentUser,
    userRoles,
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
    handleLogout,
    isProfileOpen,
    setIsProfileOpen,
  } = useAuth();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(globalThis.innerWidth <= 768);
    checkMobile();
    globalThis.addEventListener('resize', checkMobile);
    return () => globalThis.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setShowProfileDropdown(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Derive activeSection from pathname
  const activeSection = pathname === '/gallery' ? 'gallery'
    : pathname === '/about-us' ? 'about-us'
    : pathname === '/explore' ? 'explore'
    : pathname === '/guest-book' ? 'testimonials'
    : pathname === '/weave' ? 'weave'
    : 'participate';

  const isAboutUs = pathname === '/about-us';
  const isStandaloneDetail = pathname.startsWith('/activity/') ||
                             pathname.startsWith('/responsibility/') ||
                             pathname.startsWith('/event/') ||
                             pathname.startsWith('/event-activity/') ||
                             pathname.startsWith('/event-responsibility/');
  const isExploreCommunity = pathname.startsWith('/explore/') && pathname !== '/explore';
  const hideChrome = isAboutUs || isStandaloneDetail || isExploreCommunity;

  const handleAboutUsClick = () => {
    if (isAboutUs || isStaggeredTransitionBusy()) return;
    triggerStaggeredTransition(() => {
      router.push('/about-us');
    });
  };

  // Do not wrap special standalone pages that have their own layouts (like /developer-panel or login if any)
  // But for standard routes, we show the loading spinner during session check
  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // ─── Unauthenticated view — HeaderPanel + Banner + children + Footer ────────
  if (!isLoggedIn) {
    return (
      <>
        <StaggeredTransition />
        <div className={`landing-page fade-in ${isAboutUs ? 'about-us-layout-root' : isStandaloneDetail ? 'standalone-detail-root' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {!hideChrome && (
            isMobile ? (
              <MarqueeBannerMobile
                activeSection={activeSection}
                setActiveSection={() => {}}
                onLoginClick={() => setShowSignInPanel(true)}
                onAboutUsClick={handleAboutUsClick}
              />
            ) : (
              <>
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
                  activeSection={activeSection}
                  setActiveSection={() => {}}
                  handlePanelSignIn={handlePanelSignIn}
                  onAboutUsClick={handleAboutUsClick}
                />
              </>
            )
          )}
          <div style={{ flex: 1 }}>
            {children}
          </div>
          {!hideChrome && (
            <FooterPanel
              isLoggedIn={isLoggedIn}
              activeSection={activeSection}
              setActiveSection={() => {}}
              setShowSignInPanel={setShowSignInPanel}
              setShowRegisterModal={setShowRegisterModal}
              onAboutUsClick={handleAboutUsClick}
            />
          )}
        </div>

        {isMobile && showSignInPanel && (
          <div className="mobile-login-banner fade-in">
            <div className="login-banner-header">
              <button onClick={() => setShowSignInPanel(false)}>×</button>
            </div>
            <div className="login-banner-body">
              <div className="login-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={signinPhone}
                  onChange={e => setSigninPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input
                  type="password"
                  value={signinPassword}
                  onChange={e => setSigninPassword(e.target.value)}
                />
              </div>
              {signinError && <div className="login-error">{signinError}</div>}
              <div className="login-banner-footer">
                <div className="login-remember">
                  <input type="checkbox" id="rememberMe" />
                  <label htmlFor="rememberMe" style={{ margin: 0 }}>Remember</label>
                  <span className="forgotten-link">Forgotten?</span>
                </div>
                <button
                  className="signin-submit"
                  onClick={handlePanelSignIn}
                  disabled={signinSubmitting}
                >
                  {signinSubmitting ? '...' : 'SIGN IN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Login Modal for Standalone Pages where HeaderPanel is hidden */}
        {hideChrome && showSignInPanel && !isMobile && (
          <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSignInPanel(false); }}
            style={{ zIndex: 2000 }}
          >
            <div className="modal-content activity-detail-card" style={{ maxWidth: '400px', padding: '32px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Sign In</h3>
                <button onClick={() => setShowSignInPanel(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={signinPhone}
                  onChange={e => setSigninPhone(e.target.value)}
                  style={{ border: '2px solid var(--border-color)', borderRadius: '4px', padding: '12px', fontSize: '16px', outline: 'none' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={signinPassword}
                  onChange={e => setSigninPassword(e.target.value)}
                  style={{ border: '2px solid var(--border-color)', borderRadius: '4px', padding: '12px', fontSize: '16px', outline: 'none' }}
                />
                {signinError && <p style={{ color: '#ff4444', margin: 0, fontSize: '14px' }}>{signinError}</p>}
                <button
                  className="yellow-btn"
                  onClick={handlePanelSignIn}
                  disabled={signinSubmitting}
                  style={{ width: '100%', padding: '12px', fontSize: '16px', marginTop: '8px' }}
                >
                  {signinSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRegisterModal && (
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

  // ─── Authenticated view — Dashboard nav + Banner + children ──────────────────
  return (
    <>
      <StaggeredTransition />
      <div className={`dashboard-layout fade-in ${isAboutUs ? 'about-us-layout-root' : isStandaloneDetail ? 'standalone-detail-root' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {!hideChrome && (
          isMobile ? (
            <>
              <MarqueeBannerMobile
                activeSection={activeSection}
                setActiveSection={() => {}}
                onAboutUsClick={handleAboutUsClick}
                isLoggedIn={true}
              />
              <header className="dashboard-header" style={{ display: 'flex' }}>
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
              </header>

              <nav className="nav-container">
                <button className={`nav-link-btn ${pathname === '/home' ? 'active text-black' : ''}`} onClick={() => router.push('/home')}>
                  <HomeIcon size={18} /> Home
                </button>
                <button className={`nav-link-btn ${pathname === '/calendar' ? 'active text-black' : ''}`} onClick={() => router.push('/calendar')}>
                  <CalendarDays size={18} /> Calendar View
                </button>
                <button className={`nav-link-btn ${pathname === '/explore' ? 'active text-black' : ''}`} onClick={() => router.push('/explore')}>
                  Explore
                </button>
                <button className={`nav-link-btn ${pathname === '/weave' ? 'active text-black' : ''}`} onClick={() => router.push('/weave')}>
                  <Layers size={18} /> Weave
                </button>
                {userRoles.includes('developer') && (
                  <button className={`nav-link-btn ${pathname === '/developer-panel' ? 'active text-black' : ''}`} onClick={() => router.push('/developer-panel')}>
                    <ShieldCheck size={18} /> Developer Panel
                  </button>
                )}
              </nav>
            </>
          ) : (
            <>
              <MarqueeBanner />
              <nav className="nav-container">
                <div className="nav-left-spacer" />
                <div className="nav-buttons">
                  <button className={`nav-link-btn ${pathname === '/home' ? 'active' : ''}`} onClick={() => router.push('/home')}>
                    <HomeIcon size={18} /> Home
                  </button>
                  <button className={`nav-link-btn ${pathname === '/calendar' ? 'active' : ''}`} onClick={() => router.push('/calendar')}>
                    <CalendarDays size={18} /> Calendar View
                  </button>
                  <button className={`nav-link-btn ${pathname === '/explore' ? 'active' : ''}`} onClick={() => router.push('/explore')}>
                    <Search size={18} /> Explore
                  </button>
                  <button className={`nav-link-btn ${pathname === '/weave' ? 'active' : ''}`} onClick={() => router.push('/weave')}>
                    <Layers size={18} /> Weave
                  </button>
                  {userRoles.includes('developer') && (
                    <button className={`nav-link-btn ${pathname === '/developer-panel' ? 'active' : ''}`} onClick={() => router.push('/developer-panel')}>
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
            </>
          )
        )}

        <div style={{ flex: 1 }}>
          {children}
        </div>

        {!hideChrome && (
          <FooterPanel
            isLoggedIn={isLoggedIn}
            activeSection={activeSection}
            setActiveSection={() => {}}
            setShowSignInPanel={setShowSignInPanel}
            setShowRegisterModal={setShowRegisterModal}
            onAboutUsClick={handleAboutUsClick}
          />
        )}

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onProfileUpdate={setCurrentUser}
        />
      </div>
    </>
  );
}
