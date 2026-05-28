import React from 'react';
import Link from 'next/link';
import './HeaderPanel.css';

interface HeaderPanelProps {
  isLoggedIn: boolean;
  showSignInPanel: boolean;
  setShowSignInPanel: (v: boolean) => void;
  setShowRegisterModal: (v: boolean) => void;
  signinUsername: string;
  setSigninUsername: (v: string) => void;
  signinPassword: string;
  setSigninPassword: (v: string) => void;
  signinSubmitting: boolean;
  setSigninSubmitting: (v: boolean) => void;
  signinError: string | null;
  setSigninError: (v: string | null) => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  handlePanelSignIn: () => Promise<void>;
}

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
}: HeaderPanelProps) {

  return (
    <nav className="header-panel">
      <ul>
        <li><a href="#participate" className={activeSection === 'participate' ? 'active' : ''} onClick={e => { e.preventDefault(); window.location.hash = '#participate'; setActiveSection('participate'); }}>Participate</a></li>
          <li><a href="#about-us" className={activeSection === 'about-us' ? 'active' : ''} onClick={e => { e.preventDefault(); window.location.hash = '#about-us'; setActiveSection('about-us'); }}>About Us</a></li>
          <li><a href="#gallery" className={activeSection === 'gallery' ? 'active' : ''} onClick={e => { e.preventDefault(); window.location.hash = '#gallery'; setActiveSection('gallery'); }}>Gallery</a></li>
          <li><a href="#explore" className={activeSection === 'explore' ? 'active' : ''} onClick={e => { e.preventDefault(); window.location.hash = '#explore'; setActiveSection('explore'); }}>Explore</a></li>
      </ul>
      {/* Auth Buttons */}
      {!isLoggedIn && (
        <div className="auth-buttons">
          <button
            onClick={() => {
              const next = !showSignInPanel;
              setShowSignInPanel(next);
              if (next) setShowRegisterModal(false);
              setSigninError(null);
            }}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              borderRadius: '4px',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setShowRegisterModal(true);
              setShowSignInPanel(false);
            }}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              padding: '4px 10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              borderRadius: '4px',
            }}
          >
            Sign Up
          </button>
          {showSignInPanel && (
            <div className="sign-in-panel">
              <input
                type="text"
                placeholder="Username"
                value={signinUsername}
                onChange={(e) => setSigninUsername(e.target.value)}
                style={{
                  padding: '5px 8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  width: '110px',
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                style={{
                  padding: '5px 8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  width: '110px',
                }}
              />
              <button
                onClick={handlePanelSignIn}
                disabled={signinSubmitting}
                style={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: '5px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {signinSubmitting ? '...' : 'Sign In'}
              </button>
              {signinError && (
                <span style={{ color: '#a13a2a', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {signinError}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
