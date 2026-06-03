'use client';
import React, { useState } from 'react';
import { PlusCircle, User } from '@/components/Icons';
import './MarqueeBanner_mobile.css';

interface MarqueeBannerMobileProps {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
  onLoginClick?: () => void;
}

export default function MarqueeBanner_mobile({ activeSection, setActiveSection, onLoginClick }: MarqueeBannerMobileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'participate', label: 'Participate' },
    { id: 'about-us', label: 'About Us' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'explore', label: 'Explore' }
  ];

  const handleNav = (id: string) => {
    if (setActiveSection) {
      setActiveSection(id);
      if (id === 'participate') {
        window.history.pushState(null, '', window.location.pathname);
      } else {
        window.location.hash = id;
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="mobile-banner-wrapper">
      <div className="mobile-banner-content">
        <div className="mobile-banner-left">
          <img
            src="/fist.png"
            alt="Logo"
            className="mobile-center-fist"
          />
        </div>

        <div className="mobile-banner-center">
          <div className="mobile-banner-text">
            <span>3AM</span>
            <span>COLLECTIVE</span>
            <span>MOVEMENT</span>
          </div>
        </div>

        <div className="mobile-banner-right">
          {onLoginClick && (
            <button className="mobile-top-login-icon-inline" onClick={onLoginClick}>
              <User size={22} />
            </button>
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
