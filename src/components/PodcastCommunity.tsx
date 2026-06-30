'use client';

import { useRouter } from 'next/navigation';
import './PodcastCommunity.css';

export default function PodcastCommunity() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const themes = [
        'Emotional Repression & Silence',
        'Identity Confusion & Loneliness',
        'Vulnerability & Human Contradiction',
        'Cinema as Emotional Reflection',
        'Poetic Introspective Conversations',
        'Artistic & Indie Expression',
        'Morally Complex Characters & Stories'
    ];

    const shows = [
        {
            title: '3AM Narratives',
            desc: 'Thoughts that linger in our mind when we are alone.'
        },
        {
            title: 'Cinema Under Smoke',
            desc: 'Film reflections through a psychological analysis.'
        },
        {
            title: 'The Cigaz Cut',
            desc: 'Deep dive into the Indie Artistic Representation.'
        }
    ];

    const audience = [
        'Emotionally reflective listeners',
        'Writers, filmmakers & indie artists',
        'Lonely thinkers searching for meaning',
        'Late night listeners who feel deeply but speak rarely'
    ];

    return (
        <div className="podcast-wrapper">
            <button className="podcast-back" onClick={handleBack} aria-label="Go back">
                ← BACK
            </button>

            <div className="podcast-container">
                {/* HEADER */}
                <header className="retro-header">
                    <h1>3AM TAPES</h1>
                    <div className="tagline">
                        A podcast space presented by 3am Tea Cigaz
                    </div>
                </header>

                {/* TAGLINE */}
                <div className="static-tagline">
                    ♪ For the emotionally reflective • For the late-night listeners • For those who feel deeply but speak rarely ♪
                </div>

                {/* WHO WE ARE */}
                <section className="retro-section">
                    <h2>Who We Are</h2>
                    <p style={{ lineHeight: 1.8, fontSize: '0.95rem' }}>
                        3AM Tapes is a podcast space for emotionally honest conversations, psychological storytelling, and cinema reflections. We bring artistic vulnerability and introspective narratives, exploring the unspoken parts of human experience through indie culture.
                    </p>
                </section>

                {/* COLLECTIVE VOICE */}
                <section className="retro-section section-alt">
                    <h2>Collective Community Voice</h2>
                    <p style={{ lineHeight: 1.8, fontSize: '0.95rem' }}>
                        3AM Tapes is not just one person speaking. It is a space for people to share stories, thoughts, emotions, cinema perspectives, and experiences through open conversations and collaborations. A space built around voices, creativity, human emotions, and meaningful conversations. Bringing collaborative and collective voices to make this space meaningful and participatory, open for all.
                    </p>
                </section>

                {/* OUR SHOWS */}
                <section className="retro-section">
                    <h2>Our Shows</h2>
                    <div className="show-grid">
                        {shows.map((show, i) => (
                            <div key={i} className="show-card">
                                <h3>{show.title}</h3>
                                <p>{show.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* THEMES */}
                <section className="retro-section section-alt">
                    <h2>Themes We Speak About</h2>
                    <div className="theme-tags">
                        {themes.map((theme, i) => (
                            <span key={i} className={`theme-tag ${i % 2 === 0 ? '' : 'tag-alt'}`}>
                                {theme}
                            </span>
                        ))}
                    </div>
                </section>

                {/* CALLING FOR VOICES */}
                <section className="retro-section">
                    <h2>Calling for Voices</h2>
                    <p style={{ lineHeight: 1.8, fontSize: '0.95rem' }}>
                        We want real voices. Real emotions. An open invitation to share your voices and be a speaker for our shows and express your thoughts and emotions through 3AM Tapes.
                    </p>
                </section>

                {/* VISION */}
                <section className="retro-section section-alt">
                    <h2>Community & Vision</h2>
                    <p style={{ lineHeight: 1.8, fontSize: '0.95rem' }}>
                        We are building a small artistic community around honest conversations, cinema, emotional reflection, and storytelling. A space built on trust and shared emotional exploration. The motto behind this podcast space initiative is to bring more voices on human emotions and cinema.
                    </p>
                </section>

                {/* QUOTE */}
                <div className="quote-block">
                    <p style={{ fontSize: '1.1rem' }}>
                        &ldquo;But how could you live and have no story to tell?&rdquo;
                    </p>
                    <cite>— Fyodor Dostoevsky</cite>
                </div>

                {/* CTA */}
                <div className="cta-section">
                    <h2>
                        COME TOGETHER<span className="blink">_</span>
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                        &ldquo;For the emotionally reflective. For the late-night listeners.<br />
                        For those who feel deeply but speak rarely. This is your space.&rdquo;
                    </p>
                    <p style={{ fontFamily: 'Courier New, monospace', fontSize: '0.8rem', letterSpacing: '2px', color: '#888' }}>
                        3ampodcasttapes
                    </p>
                </div>

            </div>
        </div>
    );
}