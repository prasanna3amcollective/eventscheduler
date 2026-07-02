'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import './TechCommunityManifesto.css';

export default function TechCommunityManifesto() {
    const router = useRouter();
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [vesperActive, setVesperActive] = useState(false);
    const [vesperDone, setVesperDone] = useState(false);
    const [dateString, setDateString] = useState('');
    const [dayString, setDayString] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authView, setAuthView] = useState<'login' | 'register'>('login');

    useEffect(() => {
        const dateObj = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        setDateString(`${dateObj.getMonth() + 1} / ${dateObj.getDate()}`);
        setDayString(days[dateObj.getDay()]);
    }, []);

    const handleBack = () => {
        router.push('/home#explore');
    };

    const toggleAccordion = (id: string) => {
        setActiveAccordion(prev => (prev === id ? null : id));
    };

    const handleJoin = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                // User is logged in, join group and trigger animation
                await fetch('/api/groups/join', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupName: 'tech community' })
                });

                triggerVesper();
            } else {
                // Not logged in, show auth modal with login/signup options
                setAuthView('login');
                setShowAuthModal(true);
            }
        } catch (error) {
            console.error(error);
            setAuthView('login');
            setShowAuthModal(true);
        }
    };

    const handleAuthSuccess = async (user: any) => {
        // Join the group after successful auth
        try {
            await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupName: 'tech community' })
            });
        } catch (e) {
            console.error('Failed to auto-join group after signup:', e);
        }
        setShowAuthModal(false);
        triggerVesper();
    };

    const triggerVesper = () => {
        // Hide scanlines
        const scanlines = document.querySelector('.scanlines') as HTMLElement;
        if (scanlines) scanlines.style.display = 'none';

        setVesperActive(true);
        setTimeout(() => {
            setVesperDone(true);
        }, 600);
    };

    return (
        <div className="manifesto-wrapper selection:bg-black selection:text-[#FDE800]">
            <div className="scanlines" />

            <button className="manifesto-back" onClick={handleBack} aria-label="Go back">
                <span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </span>
            </button>

            <div className="p4-date-widget p4-font">
                <span>
                    <span style={{ fontSize: '1.25rem' }}>{dateString}</span>
                </span>
                <span className="p4-day">{dayString}</span>
                <span>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>WEATHER</span><br />
                    FOG
                </span>
            </div>

            <div className="container-p4">
                <header style={{ marginBottom: '3rem', textAlign: 'left' }}>
                    <div className="p4-header-block p4-font" style={{ fontSize: '2.5rem' }}>
                        <span>3AM TECH COMMUNITY</span>
                    </div>
                    <div>
                        <p className="p4-header-text">For the hands that build.</p>
                    </div>
                </header>

                <div className="accordion-wrapper">

                    {/* SECTION 1 */}
                    <div className="p4-box" style={{ padding: 0 }}>
                        <button className="accordion-btn p4-font" onClick={() => toggleAccordion('part1')}>
                            <span className="accordion-btn-inner"><span>VISION & INTENT</span></span>
                            <span style={{ color: '#FDE800', fontFamily: 'sans-serif' }}>{activeAccordion === 'part1' ? '-' : '+'}</span>
                        </button>
                        <div className="accordion-content" style={{ maxHeight: activeAccordion === 'part1' ? '1000px' : '0' }}>
                            <div className="accordion-inner">
                                <div className="p4-grid">
                                    <div>
                                        <h3 className="p4-font section-label">Vision</h3>
                                        <p>To build a decentralised tech community a space for learning, building, and solving real problems together. Technical skills are no longer just a tool for a revolution; in many ways, they are now the architect of its infrastructure.</p>
                                    </div>
                                    <div>
                                        <h3 className="p4-font section-label">Intent</h3>
                                        <p>By organizing skills and focusing on people with clear communication, we aim to empower workers to challenge corporate systems. We want to build systems from the ground up that prioritize people and ethics. The real alternative to corporations isn&rsquo;t better corporations, but no corporations at all.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2 */}
                    <div className="p4-box" style={{ padding: 0 }}>
                        <button className="accordion-btn p4-font" onClick={() => toggleAccordion('part2')}>
                            <span className="accordion-btn-inner"><span>THE QUESTIONS WE AVOID</span></span>
                            <span style={{ color: '#FDE800', fontFamily: 'sans-serif' }}>{activeAccordion === 'part2' ? '-' : '+'}</span>
                        </button>
                        <div className="accordion-content" style={{ maxHeight: activeAccordion === 'part2' ? '1000px' : '0' }}>
                            <div className="accordion-inner">
                                <p style={{ fontStyle: 'italic', fontWeight: 'bold', borderBottom: '2px solid #111', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Workers Should Ask Themselves</p>
                                <p style={{ marginBottom: '1rem' }}>How is our tech community different from a regular workers community? We &ldquo;will&rdquo; put to use our skills to build an alternative system. Fighting existing corporates is not our main focus, but it can be an interim focus that we do parallely while we build our system.</p>

                                <ul className="protocol-list" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                    <li>Why am I so tired?</li>
                                    <li>Who really benefits from my work?</li>
                                    <li>What would it look like if we had a say?</li>
                                    <li>Why does AI mean Job loss and not reduced workload to workers?</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2.5 */}
                    <div className="p4-box" style={{ padding: 0 }}>
                        <button className="accordion-btn p4-font" onClick={() => toggleAccordion('part25')}>
                            <span className="accordion-btn-inner"><span>How is our tech community different from a regular workers community?</span></span>
                            <span style={{ color: '#FDE800', fontFamily: 'sans-serif' }}>{activeAccordion === 'part25' ? '-' : '+'}</span>
                        </button>
                        <div className="accordion-content" style={{ maxHeight: activeAccordion === 'part25' ? '1000px' : '0' }}>
                            <div className="accordion-inner">
                                <div className="p4-highlight-block">
                                    <p> We &ldquo;will&rdquo; put to use our skills to build an alternative system. Fighting existing corporates is not our main focus, but it can be an interim focus that we do parallely while we build our system.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3 */}
                    <div className="p4-box" style={{ padding: 0 }}>
                        <button className="accordion-btn p4-font" onClick={() => toggleAccordion('part3')}>
                            <span className="accordion-btn-inner"><span>CORE PROBLEM & SYSTEM FAILURES</span></span>
                            <span style={{ color: '#FDE800', fontFamily: 'sans-serif' }}>{activeAccordion === 'part3' ? '-' : '+'}</span>
                        </button>
                        <div className="accordion-content" style={{ maxHeight: activeAccordion === 'part3' ? '1500px' : '0' }}>
                            <div className="accordion-inner">
                                <div className="p4-highlight-block">
                                    <strong className="p4-font p4-highlight-text" style={{ fontSize: '1.25rem', display: 'inline-block', marginBottom: '0.5rem' }}>The Human Behind The Screen</strong>
                                    <p>Core problem is the human being sitting in front of a screen, aware of the world&rsquo;s problems, but too exhausted, scared, or comfortable to act. The blame here is not on the person themselves but the system they are in that puts them there.</p>
                                </div>

                                <h3 className="p4-font" style={{ fontSize: '1.5rem', borderBottom: '2px solid #111', marginTop: '1.5rem', marginBottom: '1rem' }}>Why Current Structures Fall Short</h3>
                                <div className="p4-grid">
                                    <div style={{ background: '#fff', border: '2px solid #111', padding: '1rem', boxShadow: '4px 4px 0 #111' }}>
                                        <h4 className="p4-font section-label">Associations</h4>
                                        <p>Existing associations cant do anything useful due to threats like systemic layoffs and increasing lack of dependency on workers due to raise of AI and cheap labour.</p>
                                    </div>
                                    <div style={{ background: '#fff', border: '2px solid #111', padding: '1rem', boxShadow: '4px 4px 0 #111' }}>
                                        <h4 className="p4-font section-label">Unions</h4>
                                        <p>Unions focus on name-sake staging of protests against corporations and never a movement to build alternatives.</p>
                                    </div>
                                    <div style={{ background: '#fff', border: '2px solid #111', padding: '1rem', boxShadow: '4px 4px 0 #111' }}>
                                        <h4 className="p4-font section-label">Platforms</h4>
                                        <p>Platforms like Glass-door provide information, not power.</p>
                                    </div>
                                    <div style={{ background: '#fff', border: '2px solid #111', padding: '1rem', boxShadow: '4px 4px 0 #111' }}>
                                        <h4 className="p4-font section-label">Cross-Sectoral Gap</h4>
                                        <p>No cross-sectoral space where a space researcher, a fashion technologist, and a leather technician can recognize shared struggle and build together.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4 */}
                    <div className="p4-box" style={{ padding: 0 }}>
                        <button className="accordion-btn p4-font" onClick={() => toggleAccordion('part4')}>
                            <span className="accordion-btn-inner"><span>PURPOSE & PATH FORWARD</span></span>
                            <span style={{ color: '#FDE800', fontFamily: 'sans-serif' }}>{activeAccordion === 'part4' ? '-' : '+'}</span>
                        </button>
                        <div className="accordion-content" style={{ maxHeight: activeAccordion === 'part4' ? '1000px' : '0' }}>
                            <div className="accordion-inner">
                                <div className="p4-grid" style={{ marginBottom: '2rem' }}>
                                    <div>
                                        <h3 className="p4-font section-label">Why?</h3>
                                        <p>To build an alternative system to the existing hierarchical structures, a system where knowledge can be used for the wellbeing of the world and not for making money.</p>
                                    </div>
                                    <div>
                                        <h3 className="p4-font section-label">For Whom?</h3>
                                        <p>Anyone who is technical from any field can join us, those who are experienced or someone new with no experience looking to learn something. This space is open for anyone as long as they are eager.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="p4-box litany-box">
                    <h2 className="p4-font litany-title">LETS BUILD.!</h2>
                    <p style={{ fontStyle: 'italic', fontSize: '1.25rem', marginBottom: '2rem' }}>
                        NANDRI ! VANAKKAM !
                    </p>

                    <div>
                        <button onClick={handleJoin} className="p4-font join-btn">
                            JOIN THE 3AM TECH COMMUNITY
                        </button>
                    </div>
                </div>
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                <div
                    className="modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowAuthModal(false);
                    }}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 9998,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                    }}
                >
                    <div
                        style={{
                            background: '#F4F4F4',
                            border: '4px solid #111',
                            boxShadow: '10px 10px 0 #111',
                            maxWidth: '480px',
                            width: '100%',
                            padding: '0',
                            position: 'relative',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}
                    >
                        <button
                            onClick={() => setShowAuthModal(false)}
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                color: '#111',
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>

                        {authView === 'login' ? (
                            <>
                                <LoginForm
                                    onLoginSuccess={handleAuthSuccess}
                                    onSwitchToRegister={() => setAuthView('register')}
                                />
                                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
                                    Don&rsquo;t have an account?{' '}
                                    <button
                                        onClick={() => setAuthView('register')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#1d4ed8',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            padding: 0,
                                            font: 'inherit',
                                        }}
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </>
                        ) : (
                            <>
                                <RegisterForm
                                    onSuccess={handleAuthSuccess}
                                    hideTitle
                                    submitText="Join Community"
                                />
                                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
                                    Already a member?{' '}
                                    <button
                                        onClick={() => setAuthView('login')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#1d4ed8',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            padding: 0,
                                            font: 'inherit',
                                        }}
                                    >
                                        Sign in
                                    </button>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TV Turn Off Overlay */}
            <div className={`tv-off-overlay ${vesperActive ? 'active' : ''} ${vesperDone ? 'done' : ''}`}>
                <div className="vesper-text p4-font">
                    <span className="vii-mark">[vii]</span><br />
                    <span style={{ fontSize: '2rem', display: 'block', marginTop: '1rem' }}>YOU HAVE JOINED.</span>
                </div>
            </div>
        </div>
    );
}