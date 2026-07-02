'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ChevronDown, LogOut } from '@/components/Icons';

const LS_KEY_USER = 'signin_saved_username';
const LS_KEY_PASS = 'signin_saved_password';
const LS_KEY_REMEMBER = 'signin_remember_me';

export default function HeaderPanel({
  isLoggedIn,
  currentUser,
  userRoles = [],
  handleLogout,
  showProfileDropdown,
  setShowProfileDropdown,
  setIsProfileOpen,
  showSignInPanel,
  setShowSignInPanel,
  setShowRegisterModal,
  signinUsername,
  setSigninUsername,
  signinPassword,
  setSigninPassword,
  signinSubmitting,
  signinError,
  setSigninError,
  activeSection,
  setActiveSection,
  handlePanelSignIn,
  hideNav,
  onAboutUsClick,
}: any) {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);

  // On mount: restore saved credentials if "remember me" was previously checked
  useEffect(() => {
    try {
      const remembered = localStorage.getItem(LS_KEY_REMEMBER) === 'true';
      if (remembered) {
        const savedUser = localStorage.getItem(LS_KEY_USER) ?? '';
        const savedPass = localStorage.getItem(LS_KEY_PASS) ?? '';
        setRememberMe(true);
        setSigninUsername(savedUser);
        setSigninPassword(savedPass);
      }
    } catch {
      // localStorage unavailable (SSR / private mode) — safe to ignore
    }
  }, [setSigninUsername, setSigninPassword]);

  /** Wraps the parent sign-in handler to persist or clear credentials */
  const handleSignInWithRemember = () => {
    try {
      if (rememberMe) {
        localStorage.setItem(LS_KEY_REMEMBER, 'true');
        localStorage.setItem(LS_KEY_USER, signinUsername);
        localStorage.setItem(LS_KEY_PASS, signinPassword);
      } else {
        localStorage.removeItem(LS_KEY_REMEMBER);
        localStorage.removeItem(LS_KEY_USER);
        localStorage.removeItem(LS_KEY_PASS);
      }
    } catch {
      // ignore
    }
    handlePanelSignIn();
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
  };

  return (
    <nav className="header-panel bg-[var(--surface-color)] pl-4 py-2 sticky top-0 z-40 flex flex-row items-center justify-between w-full" style={{ paddingRight: '2.5rem' }}>

      {/* Left section - Empty spacer for true centering */}
      <div className="flex-1 hidden md:block"></div>

      {/* Center section - nav links */}
      <div className="flex items-center justify-center space-x-8 min-w-0">
        {!hideNav && (
          <>
            <Link
              href="/home"
              className={`nav-link-btn ${activeSection === 'participate' ? 'active text-black' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                globalThis.history.pushState(null, '', globalThis.location.pathname);
                setActiveSection('participate');
              }}
            >
              Participate
            </Link>
            {!isLoggedIn && (
              <>
                <Link
                  href="/home/aboutus"
                  className={`nav-link-btn ${activeSection === 'about-us' ? 'active text-black' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onAboutUsClick) {
                      onAboutUsClick();
                    } else {
                      globalThis.history.pushState(null, '', '/home/aboutus');
                      setActiveSection('about-us');
                    }
                  }}
                >
                  About Us
                </Link>
                <Link
                  href="/home/gallery"
                  className={`nav-link-btn ${activeSection === 'gallery' ? 'active text-black' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    globalThis.history.pushState(null, '', '/home/gallery');
                    setActiveSection('gallery');
                  }}
                >
                  Gallery
                </Link>
                <Link
                  href="/home/explore"
                  className={`nav-link-btn ${activeSection === 'explore' ? 'active text-black' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    globalThis.history.pushState(null, '', '/home/explore');
                    setActiveSection('explore');
                  }}
                >
                  Explore
                </Link>
              </>
            )}
            {isLoggedIn && (
              <Link
                href="/calendar"
                className={`nav-link-btn ${activeSection === 'calendar' ? 'active text-black' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/calendar');
                }}
              >
                Calendar
              </Link>
            )}
            {isLoggedIn && userRoles.includes('developer') && (
              <Link
                href="/home/admin"
                className={`nav-link-btn ${activeSection === 'admin' ? 'active text-black' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  globalThis.history.pushState(null, '', '/home/admin');
                  setActiveSection('admin');
                }}
              >
                Developer Panel
              </Link>
            )}
            {!isLoggedIn && (
              <Link
                href="/home/testimonials"
                className={`nav-link-btn ${activeSection === 'testimonials' ? 'active text-black' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  globalThis.history.pushState(null, '', '/home/testimonials');
                  setActiveSection('testimonials');
                }}
              >
                Guest Book
              </Link>
            )}
          </>
        )}
      </div>

      {/* Right section - Auth buttons */}
      <div className="flex-1 flex flex-row items-center justify-end gap-4 relative flex-shrink-0 flex-nowrap">
        {!isLoggedIn ? (
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => {
                const next = !showSignInPanel;
                setShowSignInPanel(next);
                if (next) setShowRegisterModal(false);
                setSigninError(null);
              }}
              className="yellow-btn"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setShowRegisterModal(true);
                setShowSignInPanel(false);
              }}
              className="yellow-btn"
            >
              Join the Circle
            </button>

            {showSignInPanel && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  zIndex: 100,
                  width: '320px',
                }}
              >
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSignInWithRemember(); }}
                >
                  <div
                    style={{
                      background: 'var(--surface-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>Sign In</p>

                    <input
                      id="signin-username"
                      type="tel"
                      placeholder="Phone Number"
                      value={signinUsername}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setSigninUsername(digits);
                      }}
                      style={inputStyle}
                    />

                    <input
                      id="signin-password"
                      type="password"
                      placeholder="Password"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      style={inputStyle}
                    />

                    {/* Remember Me */}
                    <label
                      htmlFor="signin-remember"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        color: 'inherit',
                      }}
                    >
                      <input
                        id="signin-remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{
                          width: '15px',
                          height: '15px',
                          accentColor: 'var(--primary-color)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      /> Remember me
                    </label>

                    <button
                      type="submit"
                      id="signin-submit"
                      onClick={handleSignInWithRemember}
                      disabled={signinSubmitting}
                      className="yellow-btn"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {signinSubmitting ? 'Signing in…' : 'Sign In'}
                    </button>

                    {signinError && (
                      <span style={{ color: '#a13a2a', fontSize: '13px' }}>
                        {signinError}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 relative">
            <div className="user-menu-container" style={{ position: 'relative' }}>
              <button
                className="user-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileDropdown(!showProfileDropdown);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <div className="user-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                  <User size={18} />
                </div>
                <ChevronDown size={14} />
              </button>
              {showProfileDropdown && (
                <div className="user-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', minWidth: '160px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 100 }}>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      setIsProfileOpen(true);
                    }}
                    style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: '8px', borderRadius: '4px' }}
                  >
                    <span style={{ fontWeight: 600 }}>{currentUser?.name}</span> <br />
                    <br />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="btn-logout" title="Logout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}