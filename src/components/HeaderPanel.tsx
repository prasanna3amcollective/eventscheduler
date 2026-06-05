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
  signinError,
  setSigninError,
  activeSection,
  setActiveSection,
  handlePanelSignIn,
  hideNav,
}: any) {
  return (
    <nav className="header-panel bg-[var(--surface-color)] px-4 py-2 sticky top-0 z-40 flex flex-row items-center justify-between w-full">

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
              href="#about-us"
              className={`nav-link-btn ${activeSection === 'about-us' ? 'active text-black' : ''}`}
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
          </>
        )}
      </div>

      {/* Right section - Auth buttons */}
      <div className="flex-1 flex flex-row items-center justify-end gap-4 relative flex-shrink-0 flex-nowrap">
        {!isLoggedIn && (
          <div className="flex items-center gap-4">
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
                    className="yellow-btn"
                  >
                    {signinSubmitting ? '...' : 'Sign In'}
                  </button>
                  {signinError && (
                    <span className="text-[#a13a2a] text-xs whitespace-nowrap">
                      {signinError}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}