'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './ActorsCommunity.css';
import {
    FaceRed, FaceBlue, FaceYellow, FaceGreen, FacePurple,
    PersonOrange, PersonBlue, PersonYellow, PersonPurple
} from './ActorsIcons';

const rasas = [
    { name: 'Shringara', meaning: 'Love, Beauty' },
    { name: 'Hasya', meaning: 'Laughter' },
    { name: 'Karuna', meaning: 'Compassion' },
    { name: 'Raudra', meaning: 'Anger' },
    { name: 'Veera', meaning: 'Heroic' },
    { name: 'Adbhuta', meaning: 'Surprise' },
    { name: 'Shantha', meaning: 'Peace' },
    { name: 'Bhayanaka', meaning: 'Fear' },
    { name: 'Bibhatsa', meaning: 'Disgust' },
];

const otherActivities1 = [
    'Gossip exercise',
    'Dancing to the beat of the parai drum',
    'Performing Shiva Tandavam',
    'Singing dialogue as if speaking',
    'Storytelling as if telling a child',
    'Town exploration — understanding people, politics, and social issues, then staging a solution-oriented play in that town',
    'Adapting literature into drama and performing it',
    'Practicing oppari (lament) and kolavi (wailing expression)',
    'Learning folk dances — Kummi, Oyilattam, Mayilattam, Parai',
    'Expressing emotions without using words',
];

const otherActivities2 = [
    'Conducting different types of improv sessions',
    'Variations of the "I Am Another" exercise',
    'Living a day by blocking one sense (blindfold, ear block, silence exercise)',
    'Identity Shift — define current identity, design new identity, list habits, design body behavior, embody for one hour',
    'Memorizing dialogue using imagination',
    'Creating imaginary environments (snowfall, sudden rain) and feeling them physically',
    'Sensory exploration — touching objects, listening deeply, interacting with people/animals to study emotional response',
    'Read a short story, perform a monologue as the main character, then adapt into a two-actor play',
    '"What If" scenario — place two characters from a story/novel/original writing into one shared circumstance',
    'Given a character, write and explore what one full day in their life looks like',
];

export default function ActorsCommunity() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [stars] = useState(() =>
        Array.from({ length: 60 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: 1.5 + Math.random() * 2.5,
            delay: Math.random() * 3,
            duration: 1.5 + Math.random() * 2,
        }))
    );

    const handleBack = () => {
        router.push('/home#explore');
    };

    useEffect(() => {
        setMounted(true);
        const style = document.createElement('style');
        style.textContent = `
            @keyframes twinkle-rand {
                0%, 100% { opacity: 0.15; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
        return () => { style.remove(); };
    }, []);

    if (!mounted) {
        return (
            <div className="actors-wrapper">
                <button className="actors-back" onClick={handleBack} aria-label="Go back">
                    ← BACK
                </button>
                <div className="actors-container">
                    <header className="actors-header">
                        <h1>3AM ACTORS<br />COMMUNITY</h1>
                        <div className="tagline">A Space for Expression and Growth</div>
                    </header>
                </div>
            </div>
        );
    }

    return (
        <div className="actors-wrapper">

            <button className="actors-back" onClick={handleBack} aria-label="Go back">
                ← BACK
            </button>

            <div className="actors-container">
                {/* HEADER */}
                <header className="actors-header">
                    <PersonOrange className="header-illustration-1" />
                    <FacePurple className="header-illustration-2" />
                    <h1>3AM ACTORS<br />COMMUNITY</h1>
                    <div className="tagline">
                        A Space for Expression and Growth
                    </div>
                </header>

                <div className="actors-banner">
                    &ldquo;Acting is an art for everyone — anyone can learn it at any time&rdquo;
                </div>

                {/* WHY */}
                <section className="actors-section">
                    <h2>Why</h2>
                    <p>Acting is an art for everyone; anyone can learn it at any time, and through it, they can express their emotions. The 3AM Actors Community is a space where everyone passionate about acting can practice, express themselves, and showcase their talents.</p>
                    <p>For actors or those who wish to learn acting, it is essential to cultivate political awareness, social understanding, and the ability to understand and express through fellow human beings. All of this must be nurtured.</p>
                </section>

                {/* FOR WHAT */}
                <section className="actors-section">
                    <h2>For What</h2>
                    <h3>Breaking Barriers, Building Awareness</h3>
                    <p>Acting is common to all, but the current scenario has created the notion that it can only be learned if you have money. That must change.</p>
                    <p>Our goal is to establish that art is for everyone. Additionally, actors must understand their path and express it through the perspective of others.</p>
                    <div className="vision-block">
                        <strong>Our Vision</strong>
                        <p>Actors should not remain mere performers; they must develop social awareness and responsibility.</p>
                    </div>
                </section>

                {/* FOR WHOM */}
                <section className="actors-section">
                    <h2>For Whom</h2>
                    <div className="actors-grid">
                        <div className="actors-card">
                            <h4>Art Believers</h4>
                            <p>For those who believe that the arts are for everyone</p>
                        </div>
                        <div className="actors-card">
                            <h4>Understanding Seekers</h4>
                            <p>For those who try to understand people or foster understanding</p>
                        </div>
                        <div className="actors-card">
                            <h4>Socially Aware</h4>
                            <p>For those who have or want social awareness</p>
                        </div>
                        <div className="actors-card">
                            <h4>Acting Learners</h4>
                            <p>For those who want to learn acting</p>
                        </div>
                    </div>
                    <div className="commitment-badge">
                        ★ Commitment Required: Two to three days a week ★
                    </div>
                </section>

                {/* HOW - SCHEDULE */}
                <section className="actors-section">
                    <h2>How</h2>
                    <h3>Our Practice Schedule</h3>
                    <div className="schedule-grid">
                        <div className="schedule-item">
                            <div className="freq">Daily</div>
                            <div className="desc">Monday to Friday — One hour of practice</div>
                        </div>
                        <div className="schedule-item">
                            <div className="freq">Weekly</div>
                            <div className="desc">Once a week — Street theatre performance</div>
                        </div>
                        <div className="schedule-item">
                            <div className="freq">Monthly</div>
                            <div className="desc">Once a month — Stage a play</div>
                        </div>
                        <div className="schedule-item">
                            <div className="freq">Weekend</div>
                            <div className="desc">Every weekend — Workshop</div>
                        </div>
                    </div>
                </section>

                {/* DAILY ACTIVITIES */}
                <section className="actors-section">
                    <h2>Daily Activities</h2>

                    <h3>Warmup</h3>
                    <ul className="activity-list">
                        <li>Stretching — Head, neck, shoulder, hands</li>
                        <li>Hands, back muscle, hips, legs, ankle, feet</li>
                        <li>Surya Namaskar</li>
                    </ul>

                    <h3>Voice Warmup</h3>
                    <ul className="activity-list">
                        <li>Vowels expression — A, E, I, O, U (Sounding, Humming)</li>
                        <li>Pitch scale (Sounding, Humming)</li>
                    </ul>

                    <h3>Face Stretching (Relaxing)</h3>
                    <ul className="activity-list list-grid-2">
                        <li>Forehead</li>
                        <li>Cheeks</li>
                        <li>Eyebrows</li>
                        <li>Lower jaw</li>
                        <li>Upper jaw</li>
                        <li>Lips</li>
                        <li>Nose</li>
                        <li>Eye lids</li>
                        <li>Folds</li>
                    </ul>

                    <h3>Silence Practice</h3>
                    <ul className="activity-list">
                        <li>Sitting for 5–10 mins in silence</li>
                        <li>With a straight spine (Focusing on breath)</li>
                    </ul>

                    <h3>Expression Practice (Rasa)</h3>
                    <div className="rasa-section-container">
                        <FaceRed className="rasa-illustration-1" />
                        <FaceGreen className="rasa-illustration-2" />
                        <div className="rasa-grid">
                            {rasas.map((rasa) => (
                                <div key={rasa.name} className="rasa-tag">
                                    {rasa.name}
                                    <span className="rasa-sans">{rasa.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#777', maxWidth: '550px', zIndex: 3, position: 'relative' }}>
                        Expressing and understanding these &ldquo;Rasa&rdquo; through reading, understanding, singing, writing.
                    </p>

                    <h3>Memory Improvement</h3>
                    <ul className="activity-list">
                        <li>Reading and writing (By hearting)</li>
                        <li>Tamil, English (Understanding)</li>
                        <li>Literature reading (Whatever preferred language)</li>
                    </ul>

                    <h3>Mental Exercise: I&rsquo;m Another</h3>
                    <ul className="activity-list">
                        <li>Actor&rsquo;s observation</li>
                        <li>Actor–writer collaboration</li>
                    </ul>

                    <h3>Scene Study</h3>
                    <ul className="activity-list">
                        <li>Understanding the scene</li>
                        <li>Scene exploration — (a) Mental (b) Physical</li>
                    </ul>

                    <h3>Character&rsquo;s Next Scene: What If</h3>
                    <p>Acting out the possible next scene based on the context and characterisation. What If → Possible scenario → Choice of the character</p>

                    <h3>Returning Back to the Self: Self Identification</h3>
                    <ul className="activity-list">
                        <li>Writing about the actor (not the character)</li>
                        <li>Same character sheet review</li>
                    </ul>

                    <h3>Improv: Usual Scene Improv</h3>
                    <ul className="activity-list">
                        <li>Ideas</li>
                        <li>Character&rsquo;s</li>
                        <li>Base</li>
                    </ul>

                    <h3>Sit / Stand / Lean</h3>
                    <p>Three actions needed for this exercise. Change of roles in sitting, standing, and leaning based on character&rsquo;s ideas, emotion.</p>

                    <h3>Character&rsquo;s Journal</h3>
                    <p>Journaling based on character&rsquo;s perspective. For example:</p>
                    <ul className="activity-list list-grid-2">
                        <li>To-do list</li>
                        <li>Feelings</li>
                        <li>Relationships</li>
                        <li>Event / Mood</li>
                        <li>Can&rsquo;t do</li>
                        <li>Like / Hate</li>
                    </ul>
                </section>

                {/* OTHER ACTIVITIES */}
                <section className="actors-section">
                    <h2>Other Activities</h2>
                    <ol className="numbered-list">
                        {otherActivities1.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ol>
                </section>

                <section className="actors-section">
                    <h2>More Practice Ideas</h2>
                    <ol className="numbered-list" start={11}>
                        {otherActivities2.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ol>
                </section>

                {/* CTA */}
                <div className="actors-cta">
                    <PersonBlue className="cta-illustration-1" />
                    <PersonYellow className="cta-illustration-2" />
                    <h2>JOIN THE CIRCLE</h2>
                    <p>Art is for everyone. Come, express, and grow with us.</p>
                </div>
            </div>
        </div>
    );
}