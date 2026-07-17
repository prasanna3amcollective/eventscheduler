'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/components/Icons';
import './MarqueeBanner_mobile.css';
import { logoFiles } from '../lib/logos';

interface MarqueeBannerMobileProps {
  readonly activeSection?: string;
  readonly setActiveSection?: (section: string) => void;
  readonly onLoginClick?: () => void;
  readonly onAboutUsClick?: () => void;
}

export default function MarqueeBannerMobile(props: Readonly<MarqueeBannerMobileProps>) {
  const router = useRouter();
  const { activeSection, setActiveSection, onLoginClick, onAboutUsClick } = props;
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
    { id: 'testimonials', label: 'Guest Book' }
  ];

  const handleNav = (id: string) => {
    if (id === 'about-us' && onAboutUsClick) {
      onAboutUsClick();
      setIsMenuOpen(false);
      return;
    }
    if (setActiveSection) {
      setActiveSection(id);
    }
    if (id === 'participate') {
      router.push('/home');
    } else if (id === 'about-us') {
      router.push('/about-us');
    } else if (id === 'testimonials') {
      router.push('/guest-book');
    } else if (id === 'gallery') {
      router.push('/gallery');
    } else if (id === 'explore') {
      router.push('/explore');
    } else {
      router.push(`/home#${id}`);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="mobile-banner-wrapper">
      <div className="mobile-banner-content">
        <div className="mobile-banner-left">
          {logoSrc && (
            <Link href="/home" style={{ display: 'inline-block', cursor: 'pointer', zIndex: 50, position: 'relative' }}>
              <img
                src={logoSrc}
                alt="Logo"
                className="mobile-center-fist center-fist"
                style={{ width: "82px", height: "82px", pointerEvents: 'auto' }}
              />
            </Link>
          )}
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
