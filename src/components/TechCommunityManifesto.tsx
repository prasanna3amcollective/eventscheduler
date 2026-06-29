'use client';

import { useEffect, useRef, useCallback } from 'react';
import './TechCommunityManifesto.css';

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

export default function TechCommunityManifesto() {
    const sectionRefs = useRef<(HTMLElement | null)[]>([]);

    const setSectionRef = useCallback((index: number) => (el: HTMLElement | null) => {
        sectionRefs.current[index] = el;
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const reveals = entry.target.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');
                        reveals.forEach((el) => {
                            el.classList.add('visible');
                        });
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
        );

        const currentRefs = sectionRefs.current;
        currentRefs.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            currentRefs.forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, []);

    const handleBack = () => {
        if (typeof window !== 'undefined') {
            window.history.back();
        }
    };

    const m = '/tech-media';

    return (
        <div className="manifesto-wrapper">
            <button className="manifesto-back" onClick={handleBack} aria-label="Go back">
                <ArrowLeftIcon />
                Back
            </button>

            {/* HERO — image1.png, image23.svg */}
            <section className="hero-section" ref={setSectionRef(0)}>
                <div className="hero-content">
                    <div className="hero-badge reveal">3AM Collective</div>
                    <h1 className="hero-title reveal">
                        3 AM TECH COMMUNITY
                        <span className="highlight">For the hands that build</span>
                    </h1>
                    <p className="hero-subtitle reveal">
                        Organizing India&rsquo;s Technical Community for Collective Power and Social Impact
                    </p>
                    <div className="hero-meta reveal">
                        <span>3AM COLLECTIVE</span>
                        <span className="dot" />
                        <span>Tech Community</span>
                    </div>
                    <div className="hero-illustration reveal">
                        <img src={`${m}/image1.png`} alt="" loading="lazy" />
                    </div>
                </div>
                <div className="hero-scroll-indicator">
                    <span>Scroll</span>
                    <div className="line" />
                </div>
            </section>

            {/* VISION & INTENT — image2.png, image27.svg, image31.svg */}
            <section className="vision-section m-section" ref={setSectionRef(1)}>
                <div className="m-inner">
                    <div className="m-label reveal">Vision & Intent</div>
                    <div className="vision-grid stagger">
                        <div className="vision-block">
                            <h3>Vision</h3>
                            <p>To build a decentralised tech community a space for learning, building, and solving real problems together. Technical skills are no longer just a tool for a revolution; in many ways, they are now the architect of its infrastructure.</p>
                        </div>
                        <div className="vision-block">
                            <h3>Intent</h3>
                            <p>By organizing skills and focusing on people with clear communication, we aim to empower workers to challenge corporate systems. We want to build systems from the ground up that prioritize people and ethics. The real alternative to corporations isn&rsquo;t better corporations, but no corporations at all. The future lies in systems without hierarchy and profit.</p>
                        </div>
                    </div>
                    <div className="vision-graphic reveal">
                        <img src={`${m}/image2.png`} alt="" loading="lazy" />
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
                        <img src={`${m}/image27.svg`} alt="" style={{ width: 24, height: 32, opacity: 0.3 }} />
                        <img src={`${m}/image31.svg`} alt="" style={{ width: 32, height: 30, opacity: 0.3 }} />
                    </div>
                </div>
            </section>

            {/* WHAT — image3.jpeg, image4.jpeg, image26.png */}
            <section className="what-section m-section" ref={setSectionRef(2)}>
                <div className="m-inner">
                    <div className="m-label reveal">What?</div>
                    <h2 className="m-title reveal">What We Are Building</h2>
                    <div className="what-content">
                        <p className="reveal">Tech community will be place for the technical people to come together from various streams, work together.</p>
                        <p className="reveal">Analyse issues with their sectors and try to get rid of the issues and work together to build a sustainable alternative.</p>
                        <p className="reveal">we will also work with similar existing spaces and communities with the spirit of brotherhood.</p>
                    </div>
                    <div className="what-images stagger">
                        <div className="brutal-box reveal">
                            <img src={`${m}/image3.jpeg`} alt="" loading="lazy" />
                        </div>
                        <div className="brutal-box reveal">
                            <img src={`${m}/image4.jpeg`} alt="" loading="lazy" />
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <img src={`${m}/image26.png`} alt="" style={{ width: 20, opacity: 0.3 }} />
                    </div>
                </div>
            </section>

            {/* WORKER QUESTIONS — image6.png, image11.svg, image13.svg */}
            <section className="questions-section m-section" ref={setSectionRef(3)}>
                <div className="m-inner">
                    <div className="questions-header">
                        <div className="m-label reveal">Workers Should Ask Themselves</div>
                        <h2 className="m-title reveal">The Questions We Avoid</h2>
                        <p className="reveal">How is our tech community different from a regular workers community? We &ldquo;will&rdquo; put to use our skills to build an alternative system. Fighting existing corporates is not our main focus, but it can be an interim focus that we do parallely while we build our system</p>
                    </div>
                    <div className="questions-list stagger">
                        <div className="question-item"><p>Why am I so tired?</p></div>
                        <div className="question-item"><p>Who really benefits from my work?</p></div>
                        <div className="question-item"><p>What would it look like if we had a say?</p></div>
                        <div className="question-item"><p>Why does AI mean Job loss and not reduced workload to workers?</p></div>
                    </div>
                    <div className="questions-graphics reveal">
                        <img src={`${m}/image6.png`} alt="" />
                        <img src={`${m}/image11.svg`} alt="" />
                        <img src={`${m}/image13.svg`} alt="" />
                    </div>
                </div>
            </section>

            {/* CORE PROBLEM — image5.png, image7.svg, image30.png */}
            <section className="problem-section m-section" ref={setSectionRef(4)}>
                <div className="m-inner">
                    <div className="m-label reveal">Core Problem</div>
                    <div className="problem-layout">
                        <div className="problem-text">
                            <h2 className="m-title reveal">The Human Behind The Screen</h2>
                            <p className="reveal">Core problem is the human being sitting in front of a screen, aware of the world&rsquo;s problems, but too exhausted, scared, or comfortable to act. The blame here is not on the person themselves but the system they are in that puts them there.</p>
                            <div className="highlight-block reveal">
                                <h4>IT Led Community</h4>
                                <p>The larger vision of tech community is to reach people of various streams. But we want to study and bring in IT sector techies as a starting point using the access we have for it.</p>
                            </div>
                        </div>
                        <div className="problem-image">
                            <div className="brutal-box reveal-right">
                                <img src={`${m}/image7.svg`} alt="" loading="lazy" />
                            </div>
                            <div className="brutal-box reveal-right">
                                <img src={`${m}/image5.png`} alt="" loading="lazy" />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                        <img src={`${m}/image30.png`} alt="" style={{ width: 40, opacity: 0.4 }} />
                    </div>
                </div>
            </section>

            {/* DEEP TRENCH — image8.png, image10.png, image12.png, image14.png, image16.png */}
            <section className="trench-section m-section" ref={setSectionRef(5)}>
                <div className="m-inner">
                    <div className="trench-header">
                        <div className="m-label reveal">The Deep Trench</div>
                        <h2 className="m-title reveal">The &ldquo;Deep Trench&rdquo; of the IT Techies</h2>
                    </div>
                    <div className="trench-grid stagger">
                        <div className="trench-item">
                            <img src={`${m}/image8.png`} alt="" loading="lazy" />
                            <div className="trench-number">01</div>
                            <h4>Economic Fear</h4>
                            <p>Blacklisted or sacked disturbs the financial harmony. Walls of trench are made with rupee notes.</p>
                        </div>
                        <div className="trench-item">
                            <img src={`${m}/image10.png`} alt="" loading="lazy" />
                            <div className="trench-number">02</div>
                            <h4>Transience</h4>
                            <p>Why organise a workplace you will leave in a year or two?</p>
                        </div>
                        <div className="trench-item">
                            <img src={`${m}/image12.png`} alt="" loading="lazy" />
                            <div className="trench-number">03</div>
                            <h4>Problem-Solving Paralysis</h4>
                            <p>Trench is comfortable because it avoids problems that don&rsquo;t fit their mental model</p>
                        </div>
                        <div className="trench-item">
                            <img src={`${m}/image14.png`} alt="" loading="lazy" />
                            <div className="trench-number">04</div>
                            <h4>Emotional Exhaustion</h4>
                            <p>By the time the weekend comes, the average techie is mentally and emotionally depleted. They don&rsquo;t have the energy to engage with the problems of the world.</p>
                        </div>
                        <div className="trench-item">
                            <img src={`${m}/image16.png`} alt="" loading="lazy" />
                            <div className="trench-number">05</div>
                            <h4>Learned Helplessness</h4>
                            <p>Nothing will change why bother? &mdash; mentality</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY / FOR WHOM — image17.svg, image18.png */}
            <section className="why-section m-section" ref={setSectionRef(6)}>
                <div className="m-inner">
                    <div className="m-label reveal">Purpose & People</div>
                    <div className="why-grid stagger">
                        <div className="why-block">
                            <h3>Why?</h3>
                            <p>To build an alternative system to the existing hierarchical structures, a system where knowledge can be used for the wellbeing of the world and not for making money.</p>
                        </div>
                        <div className="why-block">
                            <h3>For Whom?</h3>
                            <p>Anyone who is technical from any field can join us, those who are experienced or someone new with no experience looking to learn something. This space is open for anyone as long as they are eager.</p>
                        </div>
                    </div>
                    <div className="why-graphic reveal">
                        <div className="brutal-box">
                            <img src={`${m}/image17.svg`} alt="" loading="lazy" />
                        </div>
                        <div className="brutal-box">
                            <img src={`${m}/image18.png`} alt="" loading="lazy" />
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW EXISTING SPACES FAIL — image9.svg, image11.svg, image13.svg, image15.svg */}
            <section className="fail-section m-section" ref={setSectionRef(7)}>
                <div className="m-inner">
                    <div className="fail-header">
                        <div className="m-label reveal">How Existing Spaces Fails Us</div>
                        <h2 className="m-title reveal">Why Current Structures Fall Short</h2>
                    </div>
                    <div className="fail-grid stagger">
                        <div className="fail-card">
                            <img src={`${m}/image9.svg`} alt="" loading="lazy" />
                            <h4>Associations</h4>
                            <p>Existing associations cant do anything useful due to threats like systemic layoffs and increasing lack of dependency on workers due to raise of AI and cheap labour.</p>
                        </div>
                        <div className="fail-card">
                            <img src={`${m}/image11.svg`} alt="" loading="lazy" />
                            <h4>Unions</h4>
                            <p>Unions focus on name-sake staging of protests against corporations and never a movement to build alternatives.</p>
                        </div>
                        <div className="fail-card">
                            <img src={`${m}/image13.svg`} alt="" loading="lazy" />
                            <h4>Platforms</h4>
                            <p>Platforms like Glass-door provide information, not power.</p>
                        </div>
                        <div className="fail-card">
                            <img src={`${m}/image15.svg`} alt="" loading="lazy" />
                            <h4>Cross-Sectoral Gap</h4>
                            <p>There is no cross-sectoral space where a space researcher, a fashion technologist, and a leather technician can recognize shared struggle and build together.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW (Timeline) — image19.svg, image20.png, image25.svg, image27.svg */}
            <section className="how-section m-section" ref={setSectionRef(8)}>
                <div className="m-inner">
                    <div className="how-header">
                        <div className="m-label reveal">How?</div>
                        <h2 className="m-title reveal">Our Path Forward</h2>
                    </div>
                    <div className="timeline">
                        <div className="timeline-item reveal">
                            <div className="step">STEP 01</div>
                            <p>We will study each stream, how each industry operates, and we will systematically bring politically curious people to the collective.</p>
                        </div>
                        <div className="timeline-item reveal">
                            <div className="step">STEP 02</div>
                            <p>Starting with intros, getting to know each other, small workshops where people start doing things. We do data collection and devise small plans to set up career paths, that will enable techies to become independent and gradually build the alternative system.</p>
                        </div>
                        <div className="timeline-item reveal">
                            <div className="step">STEP 03</div>
                            <p>Recurring workshops to encourage cross collaboration between tech, and learning workshops for skill sharing.</p>
                        </div>
                    </div>
                    <div className="timeline-images reveal">
                        <div className="brutal-box">
                            <img src={`${m}/image19.svg`} alt="" loading="lazy" />
                        </div>
                        <div className="brutal-box">
                            <img src={`${m}/image20.png`} alt="" loading="lazy" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
                        <img src={`${m}/image25.svg`} alt="" style={{ width: 80, opacity: 0.4 }} />
                        <img src={`${m}/image27.svg`} alt="" style={{ width: 20, opacity: 0.4 }} />
                    </div>
                </div>
            </section>

            {/* ELIGIBILITY — image21.svg, image22.png, image28.png, image30.png */}
            <section className="eligibility-section m-section" ref={setSectionRef(9)}>
                <div className="m-inner">
                    <div className="eligibility-callout reveal">
                        <h2>You are eligible</h2>
                        <p>People with no experience are also welcome, to learn and contribute to the community</p>
                    </div>
                    <div className="eligibility-images reveal">
                        <div className="brutal-box">
                            <img src={`${m}/image21.svg`} alt="" loading="lazy" />
                        </div>
                        <div className="brutal-box">
                            <img src={`${m}/image22.png`} alt="" loading="lazy" />
                        </div>
                        <div className="brutal-box">
                            <img src={`${m}/image28.png`} alt="" loading="lazy" />
                        </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <img src={`${m}/image30.png`} alt="" style={{ width: 40, opacity: 0.5 }} />
                    </div>
                </div>
            </section>

            {/* ENDING — image24.png, image29.svg, image23.svg, image25.svg, image31.svg */}
            <section className="ending-section" ref={setSectionRef(10)}>
                <div className="ending-content">
                    <div className="hero-badge reveal">Join The Movement</div>
                    <h2 className="reveal">LETS BUILD THE 3AM TECH COMMUNITY, CONNECT ALL THE COMMUNITIES</h2>
                    <div className="ending-divider reveal" />
                    <p className="closing reveal">NANDRI ! VANAKKAM !</p>
                    <div className="ending-images reveal">
                        <div className="brutal-box big">
                            <img src={`${m}/image29.svg`} alt="" loading="lazy" />
                        </div>
                        <div className="brutal-box small">
                            <img src={`${m}/image24.png`} alt="" loading="lazy" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
                        <img src={`${m}/image23.svg`} alt="" style={{ width: 40, opacity: 0.3 }} />
                        <img src={`${m}/image25.svg`} alt="" style={{ width: 80, opacity: 0.3 }} />
                        <img src={`${m}/image31.svg`} alt="" style={{ width: 40, opacity: 0.3 }} />
                    </div>
                </div>
            </section>

            {/* FOOTER — image27.svg */}
            <footer className="manifesto-footer">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                    <img src={`${m}/image27.svg`} alt="" style={{ width: 16, filter: 'brightness(10)' }} />
                    <p>3AM COLLECTIVE &mdash; Tech Community</p>
                </div>
            </footer>
        </div>
    );
}