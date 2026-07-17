'use client';

import React from 'react';
import Link from 'next/link';

interface FooterPanelProps {
  isLoggedIn: boolean;
  activeSection: string;
  setActiveSection?: (section: string) => void;
  setShowSignInPanel?: (val: boolean) => void;
  setShowRegisterModal?: (val: boolean) => void;
  onAboutUsClick?: () => void;
}

export default function FooterPanel({
  isLoggedIn,
  activeSection,
  setActiveSection,
  setShowSignInPanel,
  setShowRegisterModal,
  onAboutUsClick
}: FooterPanelProps) {
  return (
    <footer className="footer-panel" style={{
      background: 'var(--surface-color)',
      borderTop: '1px solid var(--border-color)',
      padding: '24px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      marginTop: 'auto'
    }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {isLoggedIn ? (
          <>
            <Link
              href="/about-us"
              className={`nav-link-btn ${activeSection === 'about-us' ? 'active text-black' : ''}`}
              onClick={(e) => {
                if (onAboutUsClick) {
                  e.preventDefault();
                  onAboutUsClick();
                }
              }}
            >
              About Us
            </Link>
            <Link
              href="/gallery"
              className={`nav-link-btn ${activeSection === 'gallery' ? 'active text-black' : ''}`}
            >
              Gallery
            </Link>
            <Link
              href="/explore"
              className={`nav-link-btn ${activeSection === 'explore' ? 'active text-black' : ''}`}
            >
              Explore
            </Link>
            <Link
              href="/weave"
              className={`nav-link-btn ${activeSection === 'weave' ? 'active text-black' : ''}`}
            >
              Weave
            </Link>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ color: 'var(--text-color)', margin: 0, fontSize: '16px', fontWeight: 500 }}>
              Be part of the community and manage events seamlessly.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowRegisterModal?.(true);
                  setShowSignInPanel?.(false);
                }}
                className="yellow-btn"
              >
                Join the Circle
              </button>
              <button
                onClick={() => {
                  setShowSignInPanel?.(true);
                  setShowRegisterModal?.(false);
                }}
                className="neo-btn-secondary"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ color: 'var(--text-color-muted)', fontSize: '13px', marginTop: '12px' }}>
        No rights reserved.! Feel free to organise based on our ideas.
      </div>
    </footer>
  );
}
