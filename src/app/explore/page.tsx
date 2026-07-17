'use client';

import { useRouter } from 'next/navigation';

export default function ExplorePage() {
  const router = useRouter();

  return (
    <main className="app-container">
      <section id="explore" style={{ textAlign: 'center', padding: '40px 0' }}>
        <section className="latest-posts-section" style={{ marginTop: '48px' }}>
          <h2 className="section-title">Nested Communities</h2>
          <div className="latest-posts-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
            <button type="button" className="post-card post-card--actors" onClick={() => router.push('/explore/actors-community')} style={{ cursor: 'pointer' }}>Actors Community</button>
            <button type="button" className="post-card post-card--writers" onClick={() => router.push('/explore/writers-community')} style={{ cursor: 'pointer' }}>Writer's Community</button>
            <button type="button" className="post-card" style={{ cursor: 'pointer' }}>Cinemat Community</button>
            <button type="button" className="post-card post-card--music" onClick={() => router.push('/explore/music-community')} style={{ cursor: 'pointer' }}>Music Community</button>
            <button type="button" className="post-card post-card--tech" onClick={() => router.push('/explore/tech-community')} style={{ cursor: 'pointer' }}>Tech Community</button>
            <button type="button" className="post-card post-card--podcast" onClick={() => router.push('/explore/podcast-community')} style={{ cursor: 'pointer' }}>Podcast Community</button>
            <button type="button" className="post-card post-card--storytelling" onClick={() => router.push('/explore/storytelling-community')} style={{ cursor: 'pointer' }}>Storytelling Community</button>
          </div>
        </section>
      </section>
    </main>
  );
}
