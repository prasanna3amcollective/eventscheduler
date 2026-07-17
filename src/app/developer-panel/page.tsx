'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import MarqueeBanner from '@/components/MarqueeBanner';
import AdminDashboard from '@/components/AdminDashboard';
import ProfileModal from '@/components/ProfileModal';
import { LogOut, User, ChevronDown, Home as HomeIcon, CalendarDays, Search, ShieldCheck } from '@/components/Icons';

function DeveloperPanelContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Theme
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setShowProfileDropdown(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setUserRoles(data.roles || []);
        } else {
          router.replace('/home');
        }
      } catch (e) {
        console.error('Session check failed:', e);
        router.replace('/home');
      } finally {
        setIsLoadingSession(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setCurrentUser(null);
    setUserRoles([]);
    router.push('/home');
  };

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // Guard: must be logged in AND have developer role
  useEffect(() => {
    if (!isLoadingSession && (!currentUser || !userRoles.includes('developer'))) {
      router.replace('/home');
    }
  }, [isLoadingSession, currentUser, userRoles, router]);

  if (!currentUser || !userRoles.includes('developer')) {
    return null;
  }

  return (
    <div className="dashboard-layout fade-in" style={{ minHeight: '100vh' }}>
      <MarqueeBanner />

      <nav className="nav-container">
        <div className="nav-left-spacer" />
        <div className="nav-buttons">
          <button className="nav-link-btn" onClick={() => router.push('/home')}>
            <HomeIcon size={18} /> Home
          </button>
          <button className="nav-link-btn" onClick={() => router.push('/calendar')}>
            <CalendarDays size={18} /> Calendar View
          </button>
          <button className="nav-link-btn" onClick={() => router.push('/explore')}>
            <Search size={18} /> Explore
          </button>
          <button className="nav-link-btn active text-black">
            <ShieldCheck size={18} /> Developer Panel
          </button>
        </div>
        <div className="nav-right">
          <div className="user-menu-container">
            <button
              className="user-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileDropdown(!showProfileDropdown);
              }}
            >
              <div className="user-avatar">
                <User size={20} />
              </div>
              <ChevronDown size={14} />
            </button>
            {showProfileDropdown && (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
              <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setIsProfileOpen(true);
                  }}
                >
                  <span>{currentUser?.name}</span>
                  <br />
                  <br />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn-logout" title="Logout"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="app-container">
        <AdminDashboard currentUser={currentUser} />
      </main>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdate={setCurrentUser}
      />
    </div>
  );
}

export default function DeveloperPanelPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <DeveloperPanelContent />
    </Suspense>
  );
}
