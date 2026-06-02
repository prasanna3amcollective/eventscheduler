'use client';
import React, { useState } from 'react';
import { PlusCircle } from '@/components/Icons';
import './MarqueeBanner_mobile.css';

interface MarqueeBannerMobileProps {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}

export default function MarqueeBanner_mobile({ activeSection, setActiveSection }: MarqueeBannerMobileProps) {
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
      window.location.hash = id;
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
          <span className="mobile-banner-text">3AM COLLECTIVE MOVEMENT</span>
        </div>

        <div className="mobile-banner-right">
          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <PlusCircle size={32} color="var(--primary-color)" />
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
