'use client';

import Gallery from '@/components/Gallery';

export default function GalleryPage() {
  return (
    <main className="app-container">
      <section id="gallery" style={{ padding: '40px 0' }}>
        <Gallery />
      </section>
    </main>
  );
}
