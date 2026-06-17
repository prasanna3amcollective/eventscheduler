'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const LS_KEY_USER = 'signin_saved_username';
const LS_KEY_PASS = 'signin_saved_password';
const LS_KEY_REMEMBER = 'signin_remember_me';

export default function HeaderPanel({
  isLoggedIn,
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
                window.history.pushState(null, '', window.location.pathname);
                setActiveSection('participate');
              }}
            >
              Participate
            </Link>
            <Link
              href="/home/aboutus"
              className={`nav-link-btn ${activeSection === 'about-us' ? 'active text-black' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (onAboutUsClick) {
                  onAboutUsClick();
                } else {
                  window.history.pushState(null, '', '/home/aboutus');
                  setActiveSection('about-us');
                }
              }}
            >
              About Us
            </Link>
            <Link
              href="#gallery"
              className={`nav-link-btn ${activeSection === 'gallery' ? 'active text-black' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#gallery';
                setActiveSection('gallery');
              }}
            >
              Gallery
            </Link>
            <Link
              href="#explore"
              className={`nav-link-btn ${activeSection === 'explore' ? 'active text-black' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#explore';
                setActiveSection('explore');
              }}
            >
              Explore
            </Link>
            {!isLoggedIn && (
              <Link
                href="#testimonials"
                className={`nav-link-btn ${activeSection === 'testimonials' ? 'active text-black' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#testimonials';
                  setActiveSection('testimonials');
                }}
              >
                Testimonials
              </Link>
            )}
          </>
        )}
      </div>

      {/* Right section - Auth buttons */}
      <div className="flex-1 flex flex-row items-center justify-end gap-4 relative flex-shrink-0 flex-nowrap">
        {!isLoggedIn && (
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
                      />
                      Remember me
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
        )}
      </div>
    </nav>
  );
}