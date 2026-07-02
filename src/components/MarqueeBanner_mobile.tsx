'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, ChevronDown, LogOut } from '@/components/Icons';
import './MarqueeBanner_mobile.css';
import { logoFiles } from '../lib/logos';

interface MarqueeBannerMobileProps {
  readonly activeSection?: string;
  readonly setActiveSection?: (section: string) => void;
  readonly onLoginClick?: () => void;
  readonly onAboutUsClick?: () => void;
  readonly isLoggedIn?: boolean;
  readonly currentUser?: any;
  readonly userRoles?: string[];
  readonly handleLogout?: () => void;
  readonly showProfileDropdown?: boolean;
  readonly setShowProfileDropdown?: (show: boolean) => void;
  readonly setIsProfileOpen?: (show: boolean) => void;
}

export default function MarqueeBanner_mobile(props: Readonly<MarqueeBannerMobileProps>) {
  const { 
    activeSection, 
    setActiveSection, 
    onLoginClick, 
    onAboutUsClick,
    isLoggedIn,
    currentUser,
    userRoles,
    handleLogout,
    showProfileDropdown,
    setShowProfileDropdown,
    setIsProfileOpen
  } = props;
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>('');
  useEffect(() => {
    const randomLogo = logoFiles[Math.floor(Math.random() * logoFiles.length)];
    setLogoSrc(randomLogo);
  }, []);

  const navItems = [
    { id: 'participate', label: 'Participate' },
    { id: 'about-us', label: 'About Us' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'explore', label: 'Explore' },
    ...(!isLoggedIn ? [{ id: 'testimonials', label: 'Guest Book' }] : []),
    ...(isLoggedIn ? [{ id: 'calendar', label: 'Calendar View' }] : []),
    ...(isLoggedIn && userRoles?.includes('developer') ? [{ id: 'admin', label: 'Developer Panel' }] : [])
  ];

  const handleNav = (id: string) => {
    if (id === 'about-us' && onAboutUsClick) {
      onAboutUsClick();
      setIsMenuOpen(false);
      return;
    }
    if (id === 'calendar') {
      router.push('/calendar');
      setIsMenuOpen(false);
      return;
    }
    if (setActiveSection) {
      setActiveSection(id);
      if (id === 'participate') {
        globalThis.history.pushState(null, '', '/home');
      } else if (id === 'about-us') {
        globalThis.history.pushState(null, '', '/home/aboutus');
      } else if (id === 'testimonials') {
        globalThis.history.pushState(null, '', '/home/testimonials');
      } else if (id === 'explore') {
        globalThis.history.pushState(null, '', '/home/explore');
      } else if (id === 'gallery') {
        globalThis.history.pushState(null, '', '/home/gallery');
      } else if (id === 'admin') {
        globalThis.history.pushState(null, '', '/home/admin');
      } else {
        globalThis.location.hash = id;
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="mobile-banner-wrapper">
      <div className="mobile-banner-content">
        <div className="mobile-banner-left">
          {logoSrc && <img
            src={logoSrc}
            alt="Logo"
            className="mobile-center-fist"
            style={{ width: "82px", height: "82px" }} />}
        </div>

        <div className="mobile-banner-center">
          <div className="mobile-banner-text">
            <span>3AM</span>
            <span>COLLECTIVE</span>
            <span>MOVEMENT</span>
          </div>
        </div>

        <div className="mobile-banner-right">
          {!isLoggedIn ? (
            onLoginClick && (
              <button className="mobile-top-login-icon-inline" onClick={onLoginClick}>
                <User size={22} />
              </button>
            )
          ) : (
            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileDropdown?.(!showProfileDropdown);
                  }}
                  style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'inherit' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                    <User size={16} />
                  </div>
                </button>
                {showProfileDropdown && (
                  <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', minWidth: '160px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: 100, marginTop: '8px' }}>
                    <button
                      onClick={() => {
                        setShowProfileDropdown?.(false);
                        setIsProfileOpen?.(true);
                      }}
                      style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'inherit' }}
                    >
                      <span style={{ fontWeight: 600 }}>{currentUser?.name}</span> <br />
                      <br />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                <LogOut size={20} />
              </button>
            </div>
          )}
          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="mobile-menu-dot"></div>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="mobile-dropdown-menu fade-in">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`mobile-dropdown-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
