'use client';

import { useState, useEffect } from 'react';
import HomeDesktop from './Home';
import HomeMobile from './Home_mobile';

export default function Page() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(globalThis.innerWidth <= 768);
    checkMobile();
    globalThis.addEventListener('resize', checkMobile);
    return () => globalThis.removeEventListener('resize', checkMobile);
  }, []);

  // Return nothing until mounted to avoid hydration mismatch
  if (!mounted) return null;

  // The Switchboard: Redirect to mobile view if on mobile screen
  if (isMobile) {
    return <HomeMobile />;
  }

  // Otherwise, load the full desktop UI
  return <HomeDesktop />;
}