'use client';

import React from 'react';
import Link from 'next/link';

interface FooterPanelProps {
  isLoggedIn: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  setShowSignInPanel: (val: boolean) => void;
  setShowRegisterModal: (val: boolean) => void;
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
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <p style={{ color: 'var(--text-color)', margin: 0, fontSize: '16px', fontWeight: 500 }}>
              Be part of the community and manage events seamlessly.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowRegisterModal(true);
                  setShowSignInPanel(false);
                }}
                className="yellow-btn"
              >
                Join the Circle
              </button>
              <button
                onClick={() => {
                  setShowSignInPanel(true);
                  setShowRegisterModal(false);
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
        © {new Date().getFullYear()} Event Scheduler. All rights reserved.
      </div>
    </footer>
  );
}
