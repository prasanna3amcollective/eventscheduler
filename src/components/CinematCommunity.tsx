'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import './CinematCommunity.css';

/* ─── Data ─── */

const activities = [
    {
        number: '01A',
        title: 'Photo Journal Walk',
        tagline: 'Find a story in a single frame.',
        body: 'We walk together, observe the world, and capture moments through photography. Each participant takes photos and writes a short story or reflection in a journal format inspired by their image.',
        highlight: 'See deeper. Think visually. Tell stories through one frame.',
    },
    {
        number: '02A',
        title: 'Visual Storytelling',
        tagline: 'Create abstract visual stories.',
        body: 'Creators collaborate with actors, filmmakers, and other artists to shoot short abstract videos. Makeup and art direction are optional. Writers can turn the visuals into poetry or stories — released as Visual Poetry.',
        highlight: 'Explore emotion, mood, and creativity through visuals.',
    },
    {
        number: '03A',
        title: 'Director & Actor Collab',
        tagline: 'Bring a scene to life.',
        body: 'Directors and actors work together to find a real location and perform a scene. Other creators may appear in the frame as non-actors to add realism. True independent filmmaking — teamwork, creativity, spontaneous cinema.',
        highlight: 'Where collaboration meets spontaneous cinema.',
    },
];

const whoTags = [
    { num: '1', label: 'Photographers' },
    { num: '2', label: 'Filmmakers' },
    { num: '3', label: 'Cinematographers' },
    { num: '4', label: 'Abstract Visual Makers' },
    { num: '5', label: 'Video Artists' },
    { num: '6', label: 'Documentary Storytellers' },
    { num: '7', label: 'Visual Poets' },
];

const createItems = [
    { num: '01', label: 'Documentaries' },
    { num: '02', label: 'Visual Poetry' },
    { num: '03', label: 'Short Films' },
    { num: '04', label: 'Feature Films' },
    { num: '05', label: 'Photo Journals' },
    { num: '06', label: 'Abstract Visuals' },
];

/* ─── Slate (clapperboard) sub-component ─── */

function Slate({
    scene,
    take,
    shot,
    title,
}: Readonly<{
    scene: string;
    take: string;
    shot: string;
    title: string;
}>) {
    return (
        <div className="slate">
            <div className="slate-stripes" />
            <div className="slate-meta">
                <span>SCENE {scene}</span>
                <span>TAKE {take}</span>
                <span>{shot}</span>
            </div>
            <h2 className="slate-title">{title}</h2>
        </div>
    );
}

/* ─── Main component ─── */

export default function CinematCommunity() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const timecodeRef = useRef<HTMLSpanElement>(null);

    const handleBack = () => router.push('/explore');

    useEffect(() => {
        setMounted(true);
    }, []);

    /* Live timecode — 24fps, direct DOM manipulation (no re-renders) */
    useEffect(() => {
        if (!mounted) return;
        const start = Date.now();
        let raf: number;
        const tick = () => {
            const elapsed = Date.now() - start;
            const totalFrames = Math.floor((elapsed * 24) / 1000);
            const ff = totalFrames % 24;
            const ss = Math.floor(totalFrames / 24) % 60;
            const mm = Math.floor(totalFrames / (24 * 60)) % 60;
            const hh = Math.floor(totalFrames / (24 * 60 * 60));
            if (timecodeRef.current) {
                timecodeRef.current.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [mounted]);

    /* SSR-safe shell */
    if (!mounted) {
        return (
            <div className="cinemat-wrapper">
                <button className="cinemat-back" onClick={handleBack} aria-label="Go back">
                    ← BACK
                </button>
                <section className="cinemat-hero">
                    <div className="hero-content">
                        <span className="hero-org">3AM TEA CIGAZ</span>
                        <h1>
                            CINEMAT
                            <br />
                            COMMUNITY
                        </h1>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="cinemat-wrapper">
            {/* Film grain overlay */}
            <div className="film-grain" />

            {/* Back */}
            <button className="cinemat-back" onClick={handleBack} aria-label="Go back">
                ← BACK
            </button>

            {/* ════════════════════════════════════════════════
                SCENE 01 — ESTABLISHING SHOT (Hero)
               ════════════════════════════════════════════════ */}
            <section className="cinemat-hero">
                {/* Letterbox bars — 2.35:1 cinemascope framing */}
                <div className="letterbox letterbox--top" />
                <div className="letterbox letterbox--bottom" />

                {/* Sprocket strips — 35mm film edges */}
                <div className="sprocket-strip sprocket-strip--left" />
                <div className="sprocket-strip sprocket-strip--right" />

                {/* Viewfinder corner marks */}
                <div className="vf-mark vf-mark--tl" />
                <div className="vf-mark vf-mark--tr" />
                <div className="vf-mark vf-mark--bl" />
                <div className="vf-mark vf-mark--br" />

                {/* Top HUD — REC + Timecode */}
                <div className="hero-overlay-top">
                    <span className="rec-dot">● REC</span>
                    <span className="timecode" ref={timecodeRef}>
                        00:00:00:00
                    </span>
                </div>

                {/* Hero content */}
                <div className="hero-content">
                    <span className="hero-scene-label">
                        SCENE 01 — ESTABLISHING SHOT
                    </span>
                    <span className="hero-org">3AM TEA CIGAZ</span>
                    <h1>
                        CINEMAT
                        <br />
                        COMMUNITY
                    </h1>
                    <p className="hero-tagline">
                        A community of visual storytellers pushing the boundaries to
                        reinvent independent filmmaking and elevate visual storytelling.
                    </p>
                </div>

                {/* Bottom HUD — camera settings */}
                <div className="hero-overlay-bottom">
                    <span>ISO 800 &nbsp; ƒ/2.8 &nbsp; 1/48s</span>
                    <span>24P &nbsp; S35 &nbsp; 3AM CINEMAT COMMUNITY</span>
                </div>
            </section>

            {/* ════════════════════════════════════════════════
                SCENE 02 — WIDE SHOT: WHAT WE DO
               ════════════════════════════════════════════════ */}
            <section className="cinemat-section">
                <Slate scene="02" take="01" shot="WIDE SHOT" title="WHAT WE DO" />

                <div className="thirds-grid">
                    <div className="thirds-content">
                        <div className="vf-frame">
                            <div className="vf-frame-inner">
                                <p className="cm-body">
                                    A community of photography enthusiasts who co-learn and
                                    co-create continuously by coming together and working
                                    with fellow creators.
                                </p>
                                <p className="cm-body cm-body--loud">
                                    We don&rsquo;t consume content.
                                    <br />
                                    We create it. Together.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════
                SCENE 03 — CLOSE-UP: WHY (Darkroom)
               ════════════════════════════════════════════════ */}
            <section className="cinemat-section darkroom">
                <Slate scene="03" take="01" shot="CLOSE-UP" title="WHY" />

                <div className="vf-frame">
                    <div className="vf-frame-inner">
                        <p className="cm-body">
                            To build a community of visual storytellers who discuss ideas,
                            techniques, and execute ambitious projects that push the limits
                            of visual storytelling to the highest extent.
                        </p>
                    </div>
                </div>

                <div className="darkroom-quote">
                    COLLABORATION IS THE PUREST FORM OF CREATION.
                </div>
            </section>

            {/* ════════════════════════════════════════════════
                SCENE 04 — MEDIUM SHOT: HOW (Exposure Triangle)
               ════════════════════════════════════════════════ */}
            <section className="cinemat-section exposure-section">
                <Slate
                    scene="04"
                    take="01"
                    shot="MEDIUM SHOT"
                    title="HOW WE DO IT"
                />

                {/* Exposure Triangle */}
                <div className="exposure-diagram">
                    <svg
                        className="exposure-triangle-svg"
                        viewBox="0 0 400 400"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Triangle outline */}
                        <polygon points="200,50 40,350 360,350" />

                        {/* Top vertex — ISO */}
                        <text
                            x="200"
                            y="30"
                            textAnchor="middle"
                            className="setting-label"
                        >
                            ISO
                        </text>
                        <text
                            x="200"
                            y="95"
                            textAnchor="middle"
                            className="value-label"
                        >
                            LEARNING OVER EGO
                        </text>

                        {/* Bottom-left — Aperture */}
                        <text
                            x="20"
                            y="380"
                            textAnchor="start"
                            className="setting-label"
                        >
                            ƒ APERTURE
                        </text>
                        <text
                            x="95"
                            y="320"
                            textAnchor="start"
                            className="value-label"
                        >
                            INCLUSIVITY
                        </text>

                        {/* Bottom-right — Shutter Speed */}
                        <text
                            x="380"
                            y="380"
                            textAnchor="end"
                            className="setting-label"
                        >
                            SHUTTER
                        </text>
                        <text
                            x="305"
                            y="320"
                            textAnchor="end"
                            className="value-label"
                        >
                            COLLABORATION
                        </text>

                        {/* Center — the resulting exposure */}
                        <text
                            x="200"
                            y="225"
                            textAnchor="middle"
                            className="center-label"
                        >
                            KNOWLEDGE
                        </text>
                        <text
                            x="200"
                            y="242"
                            textAnchor="middle"
                            className="center-label"
                        >
                            EXCHANGE
                        </text>
                    </svg>
                </div>

                <p className="exposure-note">
                    Balance all three. Get the perfect exposure.
                </p>

                {/* Values detail grid */}
                <div className="values-grid">
                    <div className="value-cell">
                        <div className="value-cell-setting">
                            ISO — SENSITIVITY
                        </div>
                        <div className="value-cell-name">Learning Over Ego</div>
                        <div className="value-cell-desc">
                            We put growth before pride, sharing what we know and
                            embracing what we don&rsquo;t.
                        </div>
                    </div>
                    <div className="value-cell">
                        <div className="value-cell-setting">ƒ — APERTURE</div>
                        <div className="value-cell-name">
                            Radical Inclusivity
                        </div>
                        <div className="value-cell-desc">
                            Wide open. If you see the world through a lens, you
                            belong here. No gatekeeping, only open doors.
                        </div>
                    </div>
                    <div className="value-cell">
                        <div className="value-cell-setting">
                            SS — SHUTTER SPEED
                        </div>
                        <div className="value-cell-name">Collaboration</div>
                        <div className="value-cell-desc">
                            Collaborating with other creative communities and
                            actors. Coming together at the right moment to
                            capture something real.
                        </div>
                    </div>
                    <div className="value-cell">
                        <div className="value-cell-setting">
                            EV — EXPOSURE VALUE
                        </div>
                        <div className="value-cell-name">
                            Knowledge Exchange
                        </div>
                        <div className="value-cell-desc">
                            Gear, techniques, post-processing — every conversation
                            is a masterclass. The light that makes it all work.
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════
                SCENE 05 — OVER-THE-SHOULDER: WHO / WHAT (Negative)
               ════════════════════════════════════════════════ */}
            <section className="cinemat-section negative-section">
                <Slate
                    scene="05"
                    take="01"
                    shot="OVER THE SHOULDER"
                    title="WHO CAN JOIN"
                />

                <p className="cm-body">
                    Any visual storyteller. No audition. No portfolio review. Just
                    show up.
                </p>

                {/* Film strip — who tags */}
                <div className="film-strip-container">
                    <div className="strip-edge">
                        ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪
                        ▪ ▪ ▪ ▪ ▪
                    </div>
                    <div className="strip-frames">
                        {whoTags.map((tag) => (
                            <span key={tag.num} className="strip-frame">
                                <span className="frame-num">{tag.num}</span>
                                {tag.label}
                            </span>
                        ))}
                    </div>
                    <div className="strip-edge">
                        ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪
                        ▪ ▪ ▪ ▪ ▪
                    </div>
                </div>

                {/* What we create */}
                <Slate
                    scene="05B"
                    take="01"
                    shot="INSERT"
                    title="WHAT WE CREATE"
                />

                <div className="create-strip">
                    {createItems.map((item) => (
                        <div key={item.num} className="create-frame">
                            <span className="create-frame-num">{item.num}</span>
                            {item.label}
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════════════
                SCENE 06 — MONTAGE: ACTIVITIES (Contact Sheet)
               ════════════════════════════════════════════════ */}
            <section className="cinemat-section">
                <Slate scene="06" take="01" shot="MONTAGE" title="ACTIVITIES" />

                <div className="contact-sheet">
                    {activities.map((act) => (
                        <div key={act.number} className="contact-frame">
                            <div className="frame-edge">
                                ▪ ▪ ▪ ▪ &nbsp; {act.number} &nbsp; ▪ ▪ ▪ ▪
                            </div>
                            <div className="frame-body">
                                <h3>{act.title}</h3>
                                <p className="frame-tagline">{act.tagline}</p>
                                <p>{act.body}</p>
                                <div className="frame-highlight">
                                    {act.highlight}
                                </div>
                            </div>
                            <div className="frame-edge">
                                ▪ ▪ ▪ ▪ &nbsp; {act.number} &nbsp; ▪ ▪ ▪ ▪
                            </div>
                            {/* Red grease pencil circle — "selected" */}
                            <div className="grease-circle" />
                        </div>
                    ))}
                </div>
            </section>

            {/* ════════════════════════════════════════════════
                END SLATE — Film tail / countdown leader
               ════════════════════════════════════════════════ */}
            <section className="end-slate">
                <div className="sprocket-strip sprocket-strip--left" />
                <div className="sprocket-strip sprocket-strip--right" />

                <div className="countdown-circle">
                    <span className="countdown-number">3</span>
                </div>

                <div className="end-mantra">COLLABORATION IS CREATION</div>

                <p className="end-subtitle">
                    If you tell stories through visuals, this is your community.
                </p>

                <div className="tail-marks">
                    ▓▓▓▓▓▓▓ TAIL ▓▓▓▓▓▓▓
                </div>

                <div className="end-brand">3AM CINEMAT COMMUNITY</div>
            </section>
        </div>
    );
}
