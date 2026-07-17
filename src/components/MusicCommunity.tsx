'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import './MusicCommunity.css';

const comparisonData = [
    { others: 'Genre-siloed', us: 'All forms of music welcome — songs, albums, raps, protest anthems, jingles, background scores' },
    { others: 'Star-centric', us: 'Collective-creation where every contributor has equal weight' },
    { others: 'Money-first', us: 'Creation-first — pay-as-you-wish, profit-redistribution model' },
    { others: 'Urban centric', us: 'Village-first — mobile studios, street shows, co-creation with folk artists' },
    { others: 'Visuals as afterthought', us: 'Visual from the start — actors, designers, motion artists collaborate during writing' },
    { others: 'Politics as "edgy trend"', us: 'Political ethics as foundation — anti-caste, anti-communal, pro-self-respect' },
    { others: 'Individual freedom alone', us: 'Individual freedom + collective accountability' },
    { others: 'Profits to top artists / labels', us: 'Every artist gets paid directly — no capitalist accumulation, no record studio middlemen' },
    { others: 'Platform-dependent (Spotify, Apple)', us: 'YouTube-first as our main stage, our archive, our global window' },
    { others: 'Rural outreach as charity', us: 'Rural outreach is our core — genuine co-creation, not charity' },
];

const roles = [
    'lyric writers', 'composers', 'arrangers', 'producers', 'singers', 'rappers',
    'guitar', 'parai', 'thappu', 'nadaswaram', 'flute', 'violin',
    'visual artists', 'actors', 'sound engineers', 'village folk artists',
    'videographers', 'researchers', 'anyone willing to learn',
];

const orgStructure = [
    { title: 'The Collective', desc: 'All Core Members vote on major decisions.' },
    { title: 'Mentors', desc: 'Handle disputes, ethics review, grants.' },
    { title: 'Project Leads', desc: 'Rotate per project — no permanent hierarchy.' },
    { title: 'Indie Coordinators', desc: 'Connect with local artists, schedule visits.' },
    { title: 'Tech & Finance', desc: 'Transparently manage platforms, funds, equity.' },
];

const workflowSteps = [
    'Spark', 'Brainstorm', 'Creation Sprint', 'Village Test',
    'Refine', 'Final Polish', 'Release/Show', 'Document',
];

const revenueItems = [
    { source: 'YouTube Ad Revenue', dist: '100% distributed directly to every artist who worked on that project — split by contribution hours (tracked transparently). Zero deducted for "community fund" unless the artist opts in voluntarily.' },
    { source: 'Pay-as-you-wish (Website)', dist: '100% to project contributors (split by contribution hours). No middleman cut.' },
    { source: 'Village Show Collections', dist: '100% to performers that day — immediate, in hand. Rice, vegetables, ₹10 notes, whatever people give.' },
    { source: 'Grants (Arts/Cultural/Activist)', dist: '100% to equipment, travel, village artist honorariums, and community-determined needs. No one takes a salary from grants.' },
    { source: 'Sync Licensing (jingles, film scores)', dist: '100% to contributors of that project. Community takes nothing unless the artist chooses to donate some percentage.' },
    { source: 'Merch (T-shirts, Posters)', dist: 'Sold at cost + 10%. That 10% goes to the village fund — used for village artists\' travel, food, and equipment. No one profits from merch.' },
];

const platforms = [
    { name: 'YouTube', desc: 'MAIN PLATFORM. All releases go here first.' },
    { name: 'Discord', desc: 'Collaboration, brainstorming, voice chats.' },
    { name: 'Google Drive', desc: 'File sharing, stems, project assets.' },
    { name: 'Bandcamp', desc: 'Pay-as-you-wish digital downloads.' },
    { name: 'Airtable', desc: 'Indie outreach log, artist database.' },
    { name: 'Miro / Figma', desc: 'Visual collaboration, mood boards.' },
    { name: 'Spreadsheet', desc: 'Publicly visible equity tracking.' },
];

const ytReasons = [
    { title: 'Free access', desc: 'Anyone with smartphones can watch. No subscriptions, no paywalls.' },
    { title: 'Global reach', desc: 'The world can see Tamil protest music, street plays, indie collaborations.' },
    { title: 'Visual-first', desc: 'Our art includes actors, motion graphics, street performances. YouTube does justice to that.' },
    { title: 'Algorithm, our terms', desc: 'We optimise for reach, not revenue. Titles like "Parai Protest Village Anthem Tamil" so people find us.' },
    { title: 'Permanent archive', desc: 'Every project, every street show, every village recording lives there forever.' },
    { title: 'Monetisation?', desc: 'Yes, but every ad rupee goes directly to the artists. Not to a label, not to a studio, not to us.' },
];

const channelFeatures = [
    'Music videos (studio + outdoor-shot)',
    'Street play full recordings',
    'Documentary-style village collaboration videos',
    'Lyric videos in Tamil + English',
    'Behind-the-scenes — how a song was made in a village with folk artists',
    'Live performances from village shows',
    'Artist interviews and manifestos',
];

const goalStats = [
    { number: '50', label: 'Villages with their own recorded anthem' },
    { number: '200', label: 'Youth who have produced their first track' },
    { number: '10', label: 'Street plays that change local policies' },
    { number: '1M', label: 'Subscribers — every authentic voice heard globally' },
];

export default function MusicCommunity() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const revealRefs = useRef<(HTMLElement | null)[]>([]);

    const handleBack = () => {
        router.push('/explore');
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll reveal
    useEffect(() => {
        if (!mounted) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        const elements = document.querySelectorAll('.music-reveal');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [mounted]);

    if (!mounted) {
        return (
            <div className="music-wrapper">
                <button className="music-back" onClick={handleBack} aria-label="Go back">
                    ← BACK
                </button>
                <div className="music-container">
                    <header className="music-hero">
                        <h1 className="music-hero-title">
                            3AM Tea Cigaz
                            <span className="accent">Music Community</span>
                        </h1>
                    </header>
                </div>
            </div>
        );
    }

    return (
        <div className="music-wrapper">

            <button className="music-back" onClick={handleBack} aria-label="Go back">
                ← BACK
            </button>

            <div className="music-container">

                {/* ===== HERO ===== */}
                <header className="music-hero">
                    <h1 className="music-hero-title">
                        3AM Tea Cigaz
                        <span className="accent">Music Community</span>
                    </h1>
                    <p className="music-hero-subtitle">
                        We exist to build a creation-first, money-later ecosystem where art is the goal, not the byproduct.
                    </p>
                </header>

                {/* ===== MANIFESTO BANNER ===== */}
                <div className="music-manifesto-banner">
                    Creation First · Follow Ethics · Independent Freedom · No Middlemen
                </div>

                {/* ===== WHY THIS COMMUNITY ===== */}
                <section className="music-section music-section--alt">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Why This Community</h2>
                    </div>
                    <div className="why-grid music-reveal">
                        <div className="why-card">
                            <div className="why-card-number">01</div>
                            <p>The music industry today serves money, not meaning. Record studios are capitalist machines that extract profit from artists.</p>
                        </div>
                        <div className="why-card">
                            <div className="why-card-number">02</div>
                            <p>Indian youth — specifically Tamil youth — are fed either commercial noise or cynical silence.</p>
                        </div>
                        <div className="why-card">
                            <div className="why-card-number">03</div>
                            <p>Authentic regional artists remain invisible, their folk knowledge stolen without credit.</p>
                        </div>
                    </div>

                    <div className="music-divider" />

                    <div className="music-reveal" style={{ maxWidth: '700px' }}>
                        <p className="music-section-subtitle" style={{ marginBottom: '1rem' }}>
                            Where every artist splits any return equally
                        </p>
                        <p style={{ color: '#999', lineHeight: 1.8, fontSize: '1rem', textAlign: 'center' }}>
                            No studio executive takes a cut, no label owns your work. Where protest songs sit beside jingles, where rappers collaborate with parai artists, street plays become tools of resistance. We exist to revolutionise the youth of this country — one artist, one song, one beat at a time.
                        </p>
                    </div>
                </section>

                {/* ===== WHAT WE DO DIFFERENTLY ===== */}
                <section className="music-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">What We Do Differently</h2>
                        <p className="music-section-subtitle">Others vs 3AM Tea Cigaz</p>
                    </div>
                    <div className="comparison-table-wrapper music-reveal">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Others</th>
                                    <th>3AM Tea Cigaz</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map((row, i) => (
                                    <tr key={i}>
                                        <td>
                                            <span className="comparison-row-number">{String(i + 1).padStart(2, '0')}</span>
                                            {row.others}
                                        </td>
                                        <td>{row.us}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ===== WHO CAN JOIN ===== */}
                <section className="music-section music-section--alt">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Who Can Join</h2>
                        <p className="music-section-subtitle">
                            Anyone with passion and commitment to our ethics who understands the Pay-As-You-Wish system.
                        </p>
                    </div>

                    <div className="roles-cloud music-reveal">
                        {roles.map((role) => (
                            <span key={role} className="role-tag">{role}</span>
                        ))}
                    </div>

                    <div className="not-welcome music-reveal">
                        <div className="not-welcome-title">We do NOT welcome</div>
                        <p>
                            Those who put money/fame above the collective, exploit village artists, spread casteist or communal ideas, refuse to collaborate, or treat villages as &ldquo;experiences&rdquo; without giving back.
                        </p>
                    </div>
                </section>

                {/* ===== HOW WE ORGANISE ===== */}
                <section className="music-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">How We Organise</h2>
                        <p className="music-section-subtitle">Flat but accountable</p>
                    </div>

                    <div className="org-grid music-reveal">
                        {orgStructure.map((org) => (
                            <div key={org.title} className="org-card">
                                <div className="org-card-title">{org.title}</div>
                                <p>{org.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="music-reveal">
                        <h3 className="finance-heading">Workflow</h3>
                        <div className="workflow-strip">
                            {workflowSteps.map((step, i) => (
                                <span key={step}>
                                    <span className="workflow-step">{step}</span>
                                    {i < workflowSteps.length - 1 && <span className="workflow-arrow">→</span>}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="music-divider" />

                    <div className="music-reveal">
                        <h3 className="finance-heading">Platforms</h3>
                    </div>
                    <div className="platforms-grid music-reveal">
                        {platforms.map((p) => (
                            <div key={p.name} className="platform-item">
                                <div className="platform-name">{p.name}</div>
                                <div className="platform-desc">{p.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===== FINANCIAL MODEL ===== */}
                <section className="music-section music-section--dark">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Financial Model</h2>
                        <p className="music-section-subtitle">Anti-capitalist, artist-first</p>
                    </div>

                    <div className="music-reveal" style={{ maxWidth: '700px', marginBottom: '2rem' }}>
                        <p style={{ color: '#999', lineHeight: 1.8, textAlign: 'center' }}>
                            We are <strong>NOT</strong> a record label. We do <strong>NOT</strong> accumulate profit. We do <strong>NOT</strong> have studio executives taking cuts.
                        </p>
                    </div>

                    <div className="music-reveal">
                        <h3 className="finance-heading">Revenue Sources &amp; Distribution</h3>
                    </div>
                    <ul className="revenue-list music-reveal">
                        {revenueItems.map((item, i) => (
                            <li key={i} className="revenue-item">
                                <div className="revenue-number">{String(i + 1).padStart(2, '0')}</div>
                                <div className="revenue-content">
                                    <div className="revenue-source">{item.source}</div>
                                    <div className="revenue-distribution">{item.dist}</div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="golden-rule music-reveal">
                        <p>
                            &ldquo;Every rupee that comes in goes OUT to the artists who made the work or to create another creation. Nothing is accumulated. Nothing is &lsquo;invested&rsquo; in a studio. Nothing sits in a bank account earning interest. We are a conduit, not a corporation.&rdquo;
                        </p>
                    </div>

                    <div className="music-reveal">
                        <h3 className="finance-heading">Equity (Ownership, Not Money Hoarding)</h3>
                    </div>
                    <ul className="equity-list music-reveal">
                        <li className="equity-item">
                            <div className="equity-bullet" />
                            <p>Every Core Member earns 1 non-transferable share per active year (max 10).</p>
                        </li>
                        <li className="equity-item">
                            <div className="equity-bullet" />
                            <p>Shares give voting rights and decision-making power — <strong>NOT</strong> monetary dividends.</p>
                        </li>
                        <li className="equity-item">
                            <div className="equity-bullet" />
                            <p>If the community ever disbands, all remaining funds go directly to village artists who collaborated with us. No one takes anything home.</p>
                        </li>
                    </ul>
                </section>

                {/* ===== YOUTUBE — OUR MAIN STAGE ===== */}
                <section className="music-section music-section--alt">
                    <div className="music-reveal">
                        <h2 className="music-section-title">YouTube — Our Main Stage</h2>
                        <p className="music-section-subtitle">Why YouTube?</p>
                    </div>

                    <div className="yt-reasons-grid music-reveal">
                        {ytReasons.map((reason, i) => (
                            <div key={i} className="yt-reason">
                                <div className="yt-reason-number">{String(i + 1).padStart(2, '0')}</div>
                                <div className="yt-reason-title">{reason.title}</div>
                                <p>{reason.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="music-divider" />

                    <div className="music-reveal">
                        <h3 className="finance-heading">Our Channel Will Feature</h3>
                    </div>
                    <ul className="channel-features music-reveal">
                        {channelFeatures.map((feature) => (
                            <li key={feature}>{feature}</li>
                        ))}
                    </ul>
                </section>

                {/* ===== NON-NEGOTIABLE RULE ===== */}
                <div className="non-negotiable music-reveal">
                    <div className="non-negotiable-label">THE NON-NEGOTIABLE RULE</div>
                    <p>
                        &ldquo;No project is released unless it has been showcased in at least one meeting. No indie artist is credited without their consent and fair compensation — whether in money, food, or reciprocal artistic contribution. No profit is accumulated — every rupee goes to the artists.&rdquo;
                    </p>
                </div>

                {/* ===== OUR ULTIMATE GOAL ===== */}
                <section className="music-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Our Ultimate Goal</h2>
                        <p className="music-section-subtitle">In 5 years</p>
                    </div>

                    <div className="goal-stats music-reveal">
                        {goalStats.map((stat) => (
                            <div key={stat.label} className="goal-stat">
                                <div className="goal-number">{stat.number}</div>
                                <div className="goal-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="music-divider" />

                    <div className="music-reveal" style={{ maxWidth: '700px' }}>
                        <p style={{ color: '#999', lineHeight: 1.8, textAlign: 'center', fontSize: '1.05rem' }}>
                            And the world knows Tamil music isn&rsquo;t just film songs — it&rsquo;s protest, it&rsquo;s soil, it&rsquo;s fire.
                        </p>
                    </div>
                </section>

                {/* ===== CTA FOOTER ===== */}
                <div className="music-cta">
                    <h2 className="music-cta-title">We Are A Movement</h2>
                    <p className="music-cta-sub">Not a label. Not a studio. A revolution.</p>

                    <p className="music-cta-manifesto">
                        &ldquo;யாதும் ஊரே யாவரும் கேளிர்.&rdquo;
                    </p>
                    <p className="music-cta-translation">
                        (All places are ours, all people our kin.)
                    </p>

                    <div className="music-links">
                        <span className="music-link">YouTube</span>
                        <span className="music-link">Discord</span>
                        <span className="music-link">Pay-as-you-wish</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
