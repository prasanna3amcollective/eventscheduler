'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LoomSection from '@/components/LoomSection';

function WeavePageContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Theme
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
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

  // Guard: must be logged in
  useEffect(() => {
    if (!isLoadingSession && !currentUser) {
      router.replace('/home');
    }
  }, [isLoadingSession, currentUser, router]);

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="fade-in">
      <main className="app-container">
        <LoomSection currentUser={currentUser} />
      </main>
    </div>
  );
}

export default function WeavePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <WeavePageContent />
    </Suspense>
  );
}
