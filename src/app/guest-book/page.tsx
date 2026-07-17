'use client';

import { useRouter } from 'next/navigation';
import Testimonials from '@/components/Testimonials';

export default function GuestBookPage() {
  const router = useRouter();

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Testimonials onBackClick={() => router.push('/home')} />
    </div>
  );
}
