import React from 'react';
import Link from 'next/link';

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
  setSigninSubmitting,
  signinError,
  setSigninError,
  activeSection,
  setActiveSection,
  handlePanelSignIn,
  hideNav,
}: any) {

  return (
    <nav className="header-panel bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] backdrop-saturate-[180%] border-b border-[var(--border-color)] px-4 py-2 sticky top-0 z-40 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
      {/* Navigation */}
      {!hideNav && (
        <div className="hidden md:flex w-full flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
          <Link
            href="/home"
            className={`nav-link-btn ${activeSection === 'participate' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', window.location.pathname);
              setActiveSection('participate');
            }}
          >
            Participate
          </Link>
          <Link
            href="#about-us"
            className={`nav-link-btn ${activeSection === 'about-us' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '#about-us';
              setActiveSection('about-us');
            }}
          >
            About Us
          </Link>
  
          <Link
            href="#gallery"
            className={`nav-link-btn ${activeSection === 'gallery' ? 'active' : ''}`}
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
            className={`nav-link-btn ${activeSection === 'explore' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '#explore';
              setActiveSection('explore');
            }}
          >
            Explore
          </Link>
        </div>
      )}

      {/* Auth Buttons - Centered horizontally in the header */}
      {!isLoggedIn && (
        <div className="auth-center-wrapper">
          <button
            onClick={() => {
              const next = !showSignInPanel;
              setShowSignInPanel(next);
              if (next) setShowRegisterModal(false);
              setSigninError(null);
            }}
            className="yellow-btn w-full sm:w-auto"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setShowRegisterModal(true);
              setShowSignInPanel(false);
            }}
            className="yellow-btn w-full sm:w-auto"
          >
            Sign Up
          </button>
          {showSignInPanel && (
            <div className="relative sm:absolute sm:top-[100%] sm:right-0 sm:mt-2">
              <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg p-4 w-full sm:w-[200px] shadow-lg z-50 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={signinUsername}
                  onChange={(e) => setSigninUsername(e.target.value)}
                  className="border border-[var(--border-color)] rounded-lg px-3 py-1 text-sm w-full sm:w-[110px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  className="border border-[var(--border-color)] rounded-lg px-3 py-1 text-sm w-full sm:w-[110px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]"
                />
                <button
                  onClick={handlePanelSignIn}
                  disabled={signinSubmitting}
                  className="yellow-btn w-full sm:w-auto"
                >
                  {signinSubmitting ? '...' : 'Sign In'}
                </button>
                {signinError && (
                  <span className="text-[#a13a2a] text-xs whitespace-nowrap w-full sm:w-auto">
                    {signinError}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}