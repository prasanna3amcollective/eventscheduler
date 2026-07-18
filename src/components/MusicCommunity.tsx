'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import './MusicCommunity.css';

const comparisonData = [
    { others: 'Genre-siloed', us: 'All forms of Isai welcome — Anthems, Parai beats, Oppari, Gaana, folk verses, street play scores' },
    { others: 'Star-centric', us: 'Co-creation on the ground where every contributor has equal weight' },
    { others: 'Money-first', us: 'Music is nature; no one owns it. Pay-as-you-wish, direct redistribution' },
    { others: 'Urban centric', us: 'Village-first — mobile soil studios, street shows, co-creation with tribal & regional artists' },
    { others: 'Visuals as afterthought', us: 'Visuals and performance as one — actors, dancers, and musicians collaborate from day one' },
    { others: 'Politics as "edgy trend"', us: 'Political ethics as foundation — anti-caste, anti-communal, pro-dignity and self-respect' },
    { others: 'Individual freedom alone', us: 'Individual freedom + collective accountability to the soil' },
    { others: 'Profits to top artists / labels', us: 'Every artist gets paid directly — no record label accumulation, no studio middlemen' },
    { others: 'Platform-dependent (Spotify, Apple)', us: 'YouTube and street archives as our stage and global window' },
    { others: 'Rural outreach as charity', us: 'Rural co-creation as our core — we are students of their history, not charity workers' },
];

const roles = [
    'parai performers', 'thappu players', 'urumi players', 'thavil artists', 'nadaswaram blowers',
    'kuzhal (flute) players', 'oppari singers', 'gaana writers', 'lyricists', 'singers',
    'producers', 'sound engineers', 'videographers', 'street play actors', 'dancers',
    'village storytellers', 'researchers', 'anyone willing to learn from the soil'
];

const orgStructure = [
    { title: 'The Collective', desc: 'All Core Members vote on major decisions.' },
    { title: 'Mentors', desc: 'Handle disputes, ethics review, community grants.' },
    { title: 'Project Leads', desc: 'Rotate per project — no permanent hierarchy.' },
    { title: 'Indie Coordinators', desc: 'Connect with local artists, schedule village visits.' },
    { title: 'Tech & Finance', desc: 'Transparently manage platforms, funds, and equity logs.' },
];

const workflowSteps = [
    'Spark', 'Brainstorm', 'Creation Sprint', 'Village Test',
    'Refine', 'Final Polish', 'Release/Show', 'Document',
];

const workflowDetails = [
    { step: 'Spark', desc: 'A member brings an idea, a lyrics snippet, or a sound hook inspired by a social reality, a village custom, or an event.' },
    { step: 'Brainstorm', desc: 'The collective gathers over tea to debate and flesh out the ethics, structure, and collaborations required.' },
    { step: 'Creation Sprint', desc: 'Rappers, parai performers, and instrumentalists gather in our soil studio to compose and record the core stems.' },
    { step: 'Village Test', desc: 'We take the rough mix directly to the village. We play it on street corners to see if it resonates with local workers and folk artists.' },
    { step: 'Refine', desc: 'Based on feedback from the soil, we tweak the pitch, rewrite verses, and adjust the arrangement.' },
    { step: 'Final Polish', desc: 'Visual artists, street actors, and videographers shoot performances matching the final arrangement.' },
    { step: 'Release/Show', desc: 'The project is released on YouTube and showcased live in a village street show. 100% of receipts go to performers.' },
    { step: 'Document', desc: 'We archive the project details, stems, and financial equity log transparently for the public.' }
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
    { name: 'YouTube', desc: 'MAIN ARCHIVE. Releases go here first for free, universal access.' },
    { name: 'Discord', desc: 'Collaboration, brainstorming, vocal tracks, and voice chats.' },
    { name: 'Google Drive', desc: 'File sharing, raw stems, and project assets.' },
    { name: 'Bandcamp', desc: 'Pay-as-you-wish digital downloads for financial support.' },
    { name: 'Airtable', desc: 'Outreach logs and artist database.' },
    { name: 'Miro / Figma', desc: 'Visual moodboards and street play layouts.' },
    { name: 'Spreadsheet', desc: 'Publicly visible equity tracking.' },
];

const natureReasons = [
    { title: 'Older Than Humanity', desc: 'The rustling of leaves, the crash of waves, the birdsong. Music is nature itself; it predates human institutions.' },
    { title: 'No Owner, No Label', desc: 'Since music is natural, no executive, corporation, or copyright court can truly own a sound wave.' },
    { title: 'Soil-First', desc: 'Native instruments like the Parai and Urumi are made from clay, skin, and wood, carrying the direct acoustic properties of our geography.' },
    { title: 'Free Expression', desc: 'Art is not a product to package. It is the communal air we breathe.' },
];

const channelFeatures = [
    'Isai videos (recorded in fields, village squares, and mobile setups)',
    'Street play audio-visual recordings',
    'Documentary-style co-creation films with tribal and folk artists',
    'Lyric sheets translated in Tamil + English for accessibility',
    'Behind-the-scenes — acoustic tracking in natural environments',
    'Live tracks from village street celebrations',
    'Artist manifestos and spoken-word dialogues',
];

const goalStats = [
    { number: '50', label: 'Village anthems co-created' },
    { number: '200', label: 'Local youths trained in raw production' },
    { number: '10', label: 'Street assemblies altering policy' },
    { number: '1M', label: 'Voices united in resistance globally' },
];

export default function MusicCommunity() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [activeWorkflowIdx, setActiveWorkflowIdx] = useState(0);

    // Audio system React state
    const [masterActive, setMasterActive] = useState(false);
    const [soundboardActive, setSoundboardActive] = useState(false);
    const [soundboardVol, setSoundboardVol] = useState(0.5);
    const [soundboardBlend, setSoundboardBlend] = useState(0.5); // 0 = 100% Urumi, 1 = 100% Wind

    // Mixer channels (0 to 100)
    const [mannVol, setMannVol] = useState(0);
    const [kuralVol, setKuralVol] = useState(0);
    const [isaiVol, setIsaiVol] = useState(0);
    const [oliVol, setOliVol] = useState(0);

    // Audio Web nodes references
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const gainNodesRef = useRef<{
        master: GainNode | null;
        wind: GainNode | null;
        urumi: GainNode | null;
        mann: GainNode | null;
        kural: GainNode | null;
        isai: GainNode | null;
        oli: GainNode | null;
    }>({ master: null, wind: null, urumi: null, mann: null, kural: null, isai: null, oli: null });

    const sourcesRef = useRef<{
        windOsc: AudioBufferSourceNode | null;
        windFilter: BiquadFilterNode | null;
        windLfo: OscillatorNode | null;
        urumiOsc: OscillatorNode | null;
        urumiLfo: OscillatorNode | null;
        kuralOsc1: OscillatorNode | null;
        kuralOsc2: OscillatorNode | null;
        isaiOsc: OscillatorNode | null;
        isaiLfo: OscillatorNode | null;
        isaiMelodyTimer: any | null;
        oliSource: AudioBufferSourceNode | null;
        mannTimer: any | null;
    }>({
        windOsc: null, windFilter: null, windLfo: null,
        urumiOsc: null, urumiLfo: null,
        kuralOsc1: null, kuralOsc2: null,
        isaiOsc: null, isaiLfo: null, isaiMelodyTimer: null,
        oliSource: null, mannTimer: null
    });

    const handleBack = () => {
        // Stop audio prior to leaving
        stopAllAudio();
        router.push('/explore');
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Draw visualizer canvas
    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#111111'; // Match charcoal background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grids for a blueprint/Neobrutalist look
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 15) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 15) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Render bars
            const barCount = 18;
            const gap = 5;
            const barWidth = (canvas.width - (barCount - 1) * gap) / barCount;

            for (let i = 0; i < barCount; i++) {
                // Focus on lower and middle frequencies (Indian folk instruments are bass-heavy)
                const dataIdx = Math.floor((i / barCount) * (bufferLength * 0.45));
                const value = dataArray[dataIdx] || 0;
                const percent = value / 255;
                const barHeight = percent * canvas.height * 0.9;

                const x = i * (barWidth + gap);
                const y = canvas.height - barHeight;

                // Alternate between Blood Red and Ember Gold
                ctx.fillStyle = i % 2 === 0 ? '#c0392b' : '#d4a457';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;

                ctx.fillRect(x, y, barWidth, barHeight);
                ctx.strokeRect(x, y, barWidth, barHeight);
            }
        };

        draw();
    };

    const startAudioSystem = () => {
        if (audioCtxRef.current) {
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
            setMasterActive(true);
            return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // Analyser node
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyserRef.current = analyser;

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.5, ctx.currentTime);
        masterGain.connect(analyser);
        analyser.connect(ctx.destination);
        gainNodesRef.current.master = masterGain;

        // Channel Gains
        const windGain = ctx.createGain();
        windGain.gain.setValueAtTime(0, ctx.currentTime);
        windGain.connect(masterGain);
        gainNodesRef.current.wind = windGain;

        const urumiGain = ctx.createGain();
        urumiGain.gain.setValueAtTime(0, ctx.currentTime);
        urumiGain.connect(masterGain);
        gainNodesRef.current.urumi = urumiGain;

        const mannGain = ctx.createGain();
        mannGain.gain.setValueAtTime(0, ctx.currentTime);
        mannGain.connect(masterGain);
        gainNodesRef.current.mann = mannGain;

        const kuralGain = ctx.createGain();
        kuralGain.gain.setValueAtTime(0, ctx.currentTime);
        kuralGain.connect(masterGain);
        gainNodesRef.current.kural = kuralGain;

        const isaiGain = ctx.createGain();
        isaiGain.gain.setValueAtTime(0, ctx.currentTime);
        isaiGain.connect(masterGain);
        gainNodesRef.current.isai = isaiGain;

        const oliGain = ctx.createGain();
        oliGain.gain.setValueAtTime(0, ctx.currentTime);
        oliGain.connect(masterGain);
        gainNodesRef.current.oli = oliGain;

        // Synthesize Audio Sources

        // 1. Wind (filtered white noise)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const windSource = ctx.createBufferSource();
        windSource.buffer = buffer;
        windSource.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.Q.setValueAtTime(2.0, ctx.currentTime);
        windFilter.frequency.setValueAtTime(350, ctx.currentTime);

        const windLfo = ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.05, ctx.currentTime);
        const windLfoGain = ctx.createGain();
        windLfoGain.gain.setValueAtTime(150, ctx.currentTime);

        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);
        windSource.connect(windFilter);
        windFilter.connect(windGain);

        windLfo.start();
        windSource.start();
        sourcesRef.current.windOsc = windSource;
        sourcesRef.current.windFilter = windFilter;
        sourcesRef.current.windLfo = windLfo;

        // 2. Urumi (Low Friction Saw)
        const urumiOsc = ctx.createOscillator();
        urumiOsc.type = 'sawtooth';
        urumiOsc.frequency.setValueAtTime(58.27, ctx.currentTime); // Bb1 (Low tribal resonance)

        const urumiFilter = ctx.createBiquadFilter();
        urumiFilter.type = 'lowpass';
        urumiFilter.frequency.setValueAtTime(100, ctx.currentTime);

        const urumiLfo = ctx.createOscillator();
        urumiLfo.frequency.setValueAtTime(5.5, ctx.currentTime); // Speed of rubber friction
        const urumiLfoGain = ctx.createGain();
        urumiLfoGain.gain.setValueAtTime(0.15, ctx.currentTime);

        urumiLfo.connect(urumiLfoGain);
        // Connect tremolo LFO directly to modulate urumi volume via gain node
        urumiLfoGain.connect(urumiGain.gain);

        urumiOsc.connect(urumiFilter);
        urumiFilter.connect(urumiGain);

        urumiOsc.start();
        urumiLfo.start();
        sourcesRef.current.urumiOsc = urumiOsc;
        sourcesRef.current.urumiLfo = urumiLfo;

        // 3. Mann Sequencer (Rhythmic Parai Loop)
        let step = 0;
        const triggerMannSequence = () => {
            if (!gainNodesRef.current.mann || gainNodesRef.current.mann.gain.value < 0.01) {
                step = (step + 1) % 8;
                return;
            }

            const playParaiBass = (pitch = 80, duration = 0.22, volume = 0.95) => {
                const osc = ctx.createOscillator();
                const gNode = ctx.createGain();
                osc.connect(gNode);
                gNode.connect(mannGain);

                osc.frequency.setValueAtTime(pitch, ctx.currentTime);
                // Pitch decays rapidly representing drum skin response
                osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + duration - 0.02);

                gNode.gain.setValueAtTime(volume, ctx.currentTime);
                gNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration + 0.03);
            };

            const playThappuSlap = (pitch = 240, duration = 0.08, volume = 0.6) => {
                const osc = ctx.createOscillator();
                const gNode = ctx.createGain();
                osc.connect(gNode);
                gNode.connect(mannGain);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(pitch, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);

                gNode.gain.setValueAtTime(volume, ctx.currentTime);
                gNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration + 0.03);
            };

            // Classic 8-step Tamil street rhythm
            if (step === 0) {
                playParaiBass(85, 0.24, 0.9);
            } else if (step === 2) {
                playParaiBass(75, 0.18, 0.7);
            } else if (step === 3) {
                playThappuSlap(240, 0.09, 0.5);
            } else if (step === 4) {
                playParaiBass(90, 0.24, 0.9);
            } else if (step === 6) {
                playParaiBass(80, 0.18, 0.7);
            } else if (step === 7) {
                playThappuSlap(240, 0.07, 0.45);
                setTimeout(() => {
                    if (gainNodesRef.current.mann && gainNodesRef.current.mann.gain.value > 0.01) {
                        playThappuSlap(260, 0.05, 0.4);
                    }
                }, 60);
            }

            step = (step + 1) % 8;
        };

        sourcesRef.current.mannTimer = setInterval(triggerMannSequence, 160); // fast tempo

        // 4. Kural voice humming (Folk / Lamentation vocal simulation)
        const kOsc1 = ctx.createOscillator();
        kOsc1.type = 'sawtooth';
        kOsc1.frequency.setValueAtTime(110.0, ctx.currentTime); // A2

        const kOsc2 = ctx.createOscillator();
        kOsc2.type = 'triangle';
        kOsc2.frequency.setValueAtTime(110.3, ctx.currentTime); // detuned

        const kFilter = ctx.createBiquadFilter();
        kFilter.type = 'bandpass';
        kFilter.frequency.setValueAtTime(550, ctx.currentTime); // vocal formant filter
        kFilter.Q.setValueAtTime(2.5, ctx.currentTime);

        const kFilterLow = ctx.createBiquadFilter();
        kFilterLow.type = 'lowpass';
        kFilterLow.frequency.setValueAtTime(280, ctx.currentTime);

        kOsc1.connect(kFilter);
        kOsc2.connect(kFilter);
        kFilter.connect(kFilterLow);
        kFilterLow.connect(kuralGain);

        kOsc1.start();
        kOsc2.start();
        sourcesRef.current.kuralOsc1 = kOsc1;
        sourcesRef.current.kuralOsc2 = kOsc2;

        // 5. Isai (Kuzhal Bamboo Flute Synthesizer)
        const isaiOsc = ctx.createOscillator();
        isaiOsc.type = 'triangle';
        isaiOsc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 fundamental note

        // Breath breathiness filter
        const isaiFilter = ctx.createBiquadFilter();
        isaiFilter.type = 'bandpass';
        isaiFilter.frequency.setValueAtTime(1400, ctx.currentTime);
        isaiFilter.Q.setValueAtTime(0.8, ctx.currentTime);

        // Connect noise to flute filter to simulate breath blow
        const breathSource = ctx.createBufferSource();
        breathSource.buffer = buffer;
        breathSource.loop = true;
        const breathGain = ctx.createGain();
        breathGain.gain.setValueAtTime(0.015, ctx.currentTime);

        breathSource.connect(isaiFilter);
        isaiFilter.connect(isaiGain);

        // Flute pitch vibrato
        const isaiLfo = ctx.createOscillator();
        isaiLfo.frequency.setValueAtTime(5.6, ctx.currentTime); // 5.6 Hz vibrato
        const isaiLfoGain = ctx.createGain();
        isaiLfoGain.gain.setValueAtTime(10, ctx.currentTime); // Vibrato depth

        isaiLfo.connect(isaiLfoGain);
        isaiLfoGain.connect(isaiOsc.frequency);

        isaiOsc.connect(isaiGain);

        isaiOsc.start();
        isaiLfo.start();
        breathSource.start();
        sourcesRef.current.isaiOsc = isaiOsc;
        sourcesRef.current.isaiLfo = isaiLfo;

        // Ancient Tamil Pan (melody scale: D5, F5, G5, A5, C6)
        const panNotes = [587.33, 698.46, 783.99, 880.00, 1046.50];
        const playNextPanNote = () => {
            if (!gainNodesRef.current.isai || gainNodesRef.current.isai.gain.value < 0.01) return;

            const nextNote = panNotes[Math.floor(Math.random() * panNotes.length)];
            // Portamento glissando typical of bamboo flutes
            isaiOsc.frequency.exponentialRampToValueAtTime(nextNote, ctx.currentTime + 0.5);
        };

        sourcesRef.current.isaiMelodyTimer = setInterval(playNextPanNote, 2200);

        // 6. Oli (Nature environment: Rain sound)
        const oliSource = ctx.createBufferSource();
        oliSource.buffer = buffer;
        oliSource.loop = true;

        const oliFilter = ctx.createBiquadFilter();
        oliFilter.type = 'bandpass';
        oliFilter.frequency.setValueAtTime(2500, ctx.currentTime);
        oliFilter.Q.setValueAtTime(0.4, ctx.currentTime);

        oliSource.connect(oliFilter);
        oliFilter.connect(oliGain);

        oliSource.start();
        sourcesRef.current.oliSource = oliSource;

        // Start drawing visualizer
        setTimeout(drawVisualizer, 100);

        setMasterActive(true);
    };

    const stopAllAudio = () => {
        if (audioCtxRef.current) {
            audioCtxRef.current.suspend();
        }
        setMasterActive(false);
        setSoundboardActive(false);
    };

    const toggleMasterPower = () => {
        if (masterActive) {
            stopAllAudio();
        } else {
            startAudioSystem();
        }
    };

    const toggleSoundboard = () => {
        if (!masterActive) {
            startAudioSystem();
        }
        setSoundboardActive(prev => !prev);
    };

    // Update soundboard volume and wind/Urumi mix levels
    useEffect(() => {
        const g = gainNodesRef.current;
        if (!g.master || !audioCtxRef.current) return;
        const active = soundboardActive && masterActive;
        const tWind = active ? soundboardVol * soundboardBlend * 0.12 : 0;
        const tUrumi = active ? soundboardVol * (1 - soundboardBlend) * 0.28 : 0;

        const time = audioCtxRef.current.currentTime;
        g.wind?.gain.setTargetAtTime(tWind, time, 0.1);
        g.urumi?.gain.setTargetAtTime(tUrumi, time, 0.1);
    }, [soundboardActive, soundboardVol, soundboardBlend, masterActive]);

    // Update mixer channels
    useEffect(() => {
        const g = gainNodesRef.current;
        if (!g.master || !audioCtxRef.current) return;
        const time = audioCtxRef.current.currentTime;

        g.mann?.gain.setTargetAtTime(masterActive ? (mannVol / 100) * 0.55 : 0, time, 0.05);
        g.kural?.gain.setTargetAtTime(masterActive ? (kuralVol / 100) * 0.28 : 0, time, 0.1);
        g.isai?.gain.setTargetAtTime(masterActive ? (isaiVol / 100) * 0.18 : 0, time, 0.1);
        g.oli?.gain.setTargetAtTime(masterActive ? (oliVol / 100) * 0.22 : 0, time, 0.1);
    }, [mannVol, kuralVol, isaiVol, oliVol, masterActive]);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (sourcesRef.current.mannTimer) clearInterval(sourcesRef.current.mannTimer);
            if (sourcesRef.current.isaiMelodyTimer) clearInterval(sourcesRef.current.isaiMelodyTimer);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    // Intersection observer scroll effect
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
            { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
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
            {/* Back Button */}
            <button className="music-back" onClick={handleBack} aria-label="Go back">
                ← BACK
            </button>

            <div className="music-container">
                {/* HERO SECTION */}
                <header className="music-hero">
                    <div className="hero-logo-box">
                        <h1 className="music-hero-title">
                            3AM Tea Cigaz
                            <span className="accent">Music Community</span>
                        </h1>
                    </div>
                    <p className="music-hero-subtitle">
                        "Music is not a product inside a studio cabinet. It is the breeze, the forest, and the heartbeat of resistance. No one owns it, for it belongs to nature."
                    </p>
                </header>

                {/* VISUAL MARQUEE BAND */}
                <div className="marquee-wrapper">
                    <div className="marquee-content">
                        Isai is Nature · Born from the Soil · Power to the People · No Commercial Middlemen · Music is Not a Commodity · Isai is Nature · Born from the Soil · Power to the People · No Commercial Middlemen · Music is Not a Commodity
                    </div>
                </div>

                {/* SOUND SYSTEM CONTROLLER */}
                <section className="music-section sound-console-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Sonic Activator</h2>
                        <p className="music-section-subtitle">Engage the grassroots synthesizers</p>
                    </div>

                    <div className="power-card music-reveal">
                        <div className="power-status-box">
                            <span className={`status-indicator ${masterActive ? 'active' : ''}`} />
                            <span className="status-label">
                                {masterActive ? 'AUDIO ENGINE ACTIVE' : 'AUDIO ENGINE OFFLINE'}
                            </span>
                        </div>
                        <button
                            type="button"
                            className={`power-button ${masterActive ? 'power-on' : ''}`}
                            onClick={toggleMasterPower}
                        >
                            {masterActive ? 'SHUTDOWN SOUND ENGINE' : 'ACTIVATE SOUND ENGINE'}
                        </button>
                    </div>

                    <div className="dual-sound-grid music-reveal">
                        {/* 1. NILA SOUNDSCAPE */}
                        <div className="neobrutalist-card soundboard-card">
                            <div className="card-header-tag">NILA SOUNDSCAPE</div>
                            <h3 className="card-header-title">Isai of the Soil</h3>
                            <p className="card-desc">
                                A raw drone representing nature and geography. Fuses the friction-hum of the <strong>Urumi</strong> drum with ambient <strong>wind</strong> sweeps.
                            </p>

                            <button
                                type="button"
                                className={`play-soundboard-btn ${soundboardActive ? 'active' : ''}`}
                                onClick={toggleSoundboard}
                            >
                                {soundboardActive ? '⏸ STOP DRONE' : '▶ LISTEN TO DRONE'}
                            </button>

                            <div className="slider-group">
                                <label htmlFor="sb-volume">Drone Volume</label>
                                <input
                                    id="sb-volume"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={soundboardVol}
                                    onChange={(e) => setSoundboardVol(parseFloat(e.target.value))}
                                    disabled={!soundboardActive}
                                />
                            </div>

                            <div className="slider-group">
                                <div className="slider-labels">
                                    <span>Urumi Friction</span>
                                    <span>Wind Breeze</span>
                                </div>
                                <input
                                    id="sb-blend"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={soundboardBlend}
                                    onChange={(e) => setSoundboardBlend(parseFloat(e.target.value))}
                                    disabled={!soundboardActive}
                                />
                            </div>
                        </div>

                        {/* 2. REAL-TIME CANVAS VISUALIZER */}
                        <div className="neobrutalist-card visualizer-card">
                            <div className="card-header-tag">Acoustic Spectrum</div>
                            <h3 className="card-header-title">Live Frequency Canvas</h3>
                            <div className="canvas-wrapper">
                                <canvas
                                    ref={canvasRef}
                                    width="380"
                                    height="180"
                                    id="mixer-visualizer-canvas"
                                />
                            </div>
                            <p className="visualizer-hint">
                                {!masterActive ? 'Activate the Sound Engine to view frequencies' : 'Frequency activity of active channels'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* THE CO-CREATION MIXER CONSOLE */}
                <section className="music-section music-section--alt">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Co-Creation Console</h2>
                        <p className="music-section-subtitle">Slide the faders to mix human expression and nature</p>
                    </div>

                    <div className="mixer-console neobrutalist-card music-reveal">
                        <div className="mixer-header-strip">
                            <span>4-CHANNEL FOLK SYNTHESIZER CONSOLE</span>
                            <span className="mono-code">SYS.VER.3AM_SOIL</span>
                        </div>

                        <div className="mixer-tracks">
                            {/* CHANNEL 1: MANN */}
                            <div className="mixer-track">
                                <div className="channel-number">CH 01</div>
                                <div className="fader-wrapper">
                                    <input
                                        type="range"
                                        className="vertical-fader"
                                        min="0"
                                        max="100"
                                        value={mannVol}
                                        onChange={(e) => setMannVol(parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="track-meta">
                                    <div className="track-name">MANN</div>
                                    <div className="track-desc">Parai Beat (Heartbeat)</div>
                                    <div className="track-db">{mannVol}%</div>
                                </div>
                            </div>

                            {/* CHANNEL 2: KURAL */}
                            <div className="mixer-track">
                                <div className="channel-number">CH 02</div>
                                <div className="fader-wrapper">
                                    <input
                                        type="range"
                                        className="vertical-fader"
                                        min="0"
                                        max="100"
                                        value={kuralVol}
                                        onChange={(e) => setKuralVol(parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="track-meta">
                                    <div className="track-name">KURAL</div>
                                    <div className="track-desc">Throat Hum (Vocal)</div>
                                    <div className="track-db">{kuralVol}%</div>
                                </div>
                            </div>

                            {/* CHANNEL 3: ISAI */}
                            <div className="mixer-track">
                                <div className="channel-number">CH 03</div>
                                <div className="fader-wrapper">
                                    <input
                                        type="range"
                                        className="vertical-fader"
                                        min="0"
                                        max="100"
                                        value={isaiVol}
                                        onChange={(e) => setIsaiVol(parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="track-meta">
                                    <div className="track-name">ISAI</div>
                                    <div className="track-desc">Kuzhal (Woodwind)</div>
                                    <div className="track-db">{isaiVol}%</div>
                                </div>
                            </div>

                            {/* CHANNEL 4: OLI */}
                            <div className="mixer-track">
                                <div className="channel-number">CH 04</div>
                                <div className="fader-wrapper">
                                    <input
                                        type="range"
                                        className="vertical-fader"
                                        min="0"
                                        max="100"
                                        value={oliVol}
                                        onChange={(e) => setOliVol(parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="track-meta">
                                    <div className="track-name">OLI</div>
                                    <div className="track-desc">Rain &amp; Rustle (Nature)</div>
                                    <div className="track-db">{oliVol}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="mixer-footer-strip">
                            <span>* USER WARNING: ADJUST SLIDERS GRADUALLY TO PREVENT INTENSE FOLK FREQUENCIES</span>
                        </div>
                    </div>
                </section>

                {/* GEOGRAPHY & PHILOSOPHY */}
                <section className="music-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Music &amp; The Soil</h2>
                        <p className="music-section-subtitle">Nature exists before the copyright ledger</p>
                    </div>

                    <div className="why-grid music-reveal">
                        {natureReasons.map((reason, i) => (
                            <div key={i} className="neobrutalist-card why-neo-card">
                                <div className="why-card-number">{String(i + 1).padStart(2, '0')}</div>
                                <h3 className="why-neo-title">{reason.title}</h3>
                                <p className="why-neo-text">{reason.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* THE 10 COMPARISONS */}
                <section className="music-section music-section--alt">
                    <div className="music-reveal">
                        <h2 className="music-section-title">De-Commodifying Sound</h2>
                        <p className="music-section-subtitle">How we differ from the commercial studio industry</p>
                    </div>

                    <div className="comparison-table-wrapper music-reveal">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Commercial Industry</th>
                                    <th>3AM Tea Cigaz Movement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map((row, i) => (
                                    <tr key={i}>
                                        <td>
                                            <span className="comparison-row-number">{(i + 1).toString().padStart(2, '0')}</span>
                                            {row.others}
                                        </td>
                                        <td>{row.us}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* CREATIVE COMMONS & STEMS */}
                <section className="music-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">The Stems Vault</h2>
                        <p className="music-section-subtitle">All frequencies are shared. Download, remix, and reclaim.</p>
                    </div>

                    <div className="neobrutalist-card stems-card music-reveal">
                        <p className="stems-text">
                            "We reject copyright hoarding. The woodwind pitches, the parai beats, and vocal takes belong to the collective air. Download raw multi-tracks under copyleft license. Re-record, perform, and repurpose for your own street resistance."
                        </p>
                        <div className="stems-action-row">
                            <span className="stems-badge">LICENSE: CREATIVE COMMONS BY-NC-SA 4.0</span>
                            <button type="button" className="stems-btn" onClick={() => alert('Stems directory loaded: /stems-archive (All tracks in WAV format)')}>
                                ACCESS OPEN STEMS →
                            </button>
                        </div>
                    </div>
                </section>

                {/* WHO WE WELCOME & THE INSTRUMENTARIUM */}
                <section className="music-section music-section--alt">
                    <div className="music-reveal">
                        <h2 className="music-section-title">The Instrumentarium of Liberation</h2>
                        <p className="music-section-subtitle">Reclaiming tools of historical oppression for protest</p>
                    </div>

                    <div className="instrumentarium-block music-reveal">
                        <p>
                            Historically, instruments like the <strong>Parai</strong> and <strong>Thappu</strong> drums were forced upon oppressed communities to announce deaths or perform forced labor. Under the 3AM collective, these tools are reclaimed as symbols of pride, self-respect, and loud, earth-shaking resistance.
                        </p>
                    </div>

                    <div className="roles-cloud music-reveal">
                        {roles.map((role) => (
                            <span key={role} className="role-tag">{role}</span>
                        ))}
                    </div>

                    <div className="not-welcome-box music-reveal">
                        <div className="not-welcome-title">WE DO NOT WELCOME:</div>
                        <p>
                            Exploiters who treat rural folk artists as cheap "exotic textures", those seeking commercial fame, agents pushing casteist or communal agendas, or anyone commodifying sound for private capital accumulation.
                        </p>
                    </div>
                </section>

                {/* THE WORKFLOW WAVEFORM (INTERACTIVE SVG) */}
                <section className="music-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">The Creation Flow</h2>
                        <p className="music-section-subtitle">How songs emerge from the soil (Click nodes to inspect)</p>
                    </div>

                    <div className="workflow-waveform-container neobrutalist-card music-reveal">
                        <div className="svg-wrapper">
                            <svg viewBox="0 0 900 120" className="waveform-svg">
                                {/* Zigzag soundwave background line */}
                                <polyline
                                    points="40,60 160,20 280,100 400,30 520,90 640,15 760,105 860,60"
                                    fill="none"
                                    stroke="#222222"
                                    strokeWidth="6"
                                />
                                <polyline
                                    points="40,60 160,20 280,100 400,30 520,90 640,15 760,105 860,60"
                                    fill="none"
                                    stroke="#c0392b"
                                    strokeWidth="3"
                                    strokeDasharray="8,5"
                                />

                                {/* Interactive square nodes */}
                                {[
                                    { cx: 40, cy: 60 },
                                    { cx: 160, cy: 20 },
                                    { cx: 280, cy: 100 },
                                    { cx: 400, cy: 30 },
                                    { cx: 520, cy: 90 },
                                    { cx: 640, cy: 15 },
                                    { cx: 760, cy: 105 },
                                    { cx: 860, cy: 60 }
                                ].map((node, idx) => (
                                    <g key={idx} className="waveform-node-group" onClick={() => setActiveWorkflowIdx(idx)}>
                                        <rect
                                            x={node.cx - 10}
                                            y={node.cy - 10}
                                            width="20"
                                            height="20"
                                            className={`waveform-node-rect ${activeWorkflowIdx === idx ? 'active' : ''}`}
                                        />
                                        <text
                                            x={node.cx}
                                            y={node.cy - 16}
                                            className={`waveform-node-text ${activeWorkflowIdx === idx ? 'active' : ''}`}
                                        >
                                            {workflowSteps[idx]}
                                        </text>
                                    </g>
                                ))}
                            </svg>
                        </div>

                        {/* Interactive Console display */}
                        <div className="waveform-console">
                            <div className="console-tag">STAGE 0{activeWorkflowIdx + 1} // {workflowSteps[activeWorkflowIdx].toUpperCase()}</div>
                            <h4 className="console-title">{workflowDetails[activeWorkflowIdx].step}</h4>
                            <p className="console-desc">{workflowDetails[activeWorkflowIdx].desc}</p>
                        </div>
                    </div>
                </section>

                {/* HOW WE ORGANISE */}
                <section className="music-section music-section--alt">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Structure &amp; Accountability</h2>
                        <p className="music-section-subtitle">Flat coordination, no permanent hierarchies</p>
                    </div>

                    <div className="org-grid music-reveal">
                        {orgStructure.map((org) => (
                            <div key={org.title} className="neobrutalist-card org-neo-card">
                                <h3 className="org-neo-title">{org.title}</h3>
                                <p className="org-neo-text">{org.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="platforms-grid music-reveal">
                        {platforms.map((p) => (
                            <div key={p.name} className="neobrutalist-card platform-card">
                                <h4 className="platform-title">{p.name}</h4>
                                <p className="platform-text">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FINANCIAL MODEL (MONOSPACE LEDGER) */}
                <section className="music-section music-section--dark">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Financial Ledger</h2>
                        <p className="music-section-subtitle">Zero accumulation, 100% direct pay-out</p>
                    </div>

                    <div className="ledger-console neobrutalist-card music-reveal">
                        <div className="ledger-header">
                            <div>LEDGER: REVENUE_DISTRIBUTION</div>
                            <div className="mono-code">STATUS: AUDITED_PUBLIC</div>
                        </div>

                        <div className="ledger-table-wrapper">
                            <table className="ledger-table">
                                <thead>
                                    <tr>
                                        <th>CODE</th>
                                        <th>REVENUE SOURCE</th>
                                        <th>REDISTRIBUTION FORMULA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {revenueItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="mono-code">REV_0{idx + 1}</td>
                                            <td className="source-name">{item.source}</td>
                                            <td className="dist-formula">{item.dist}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="ledger-rule-box">
                            <p>
                                <strong>THE GOLDEN LEDGER LAW:</strong> "No interest collection. No capital storage. Every single unit of currency generated flows directly back to the artists who put in the tracking hours or into purchasing raw field instruments. If the collective ever disbands, the final treasury balance is distributed to regional tribal artists."
                            </p>
                        </div>
                    </div>
                </section>

                {/* THE GOAL STATS */}
                <section className="music-section">
                    <div className="music-reveal">
                        <h2 className="music-section-title">Ultimate Vision</h2>
                        <p className="music-section-subtitle">Acoustic footprints over five years</p>
                    </div>

                    <div className="goal-stats music-reveal">
                        {goalStats.map((stat) => (
                            <div key={stat.label} className="stat-neo-box">
                                <div className="stat-number">{stat.number}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* THE NON-NEGOTIABLE RULE */}
                <div className="non-negotiable-rule-box music-reveal">
                    <div className="non-negotiable-title">THE NON-NEGOTIABLE LAW</div>
                    <p>
                        "No project is released unless it has been showcased in at least one communal meeting. No folk artist is recorded without direct consent and equal equity credits. No middleman cut. No label branding. The soil speaks directly."
                    </p>
                </div>

                {/* CTA FOOTER */}
                <footer className="music-cta-footer">
                    <h2 className="cta-heading">We are a Movement</h2>
                    <p className="cta-subheading">Not a studio. A sonic uprising.</p>

                    <div className="tamil-manifesto-quote">
                        "யாதும் ஊரே யாவரும் கேளிர்."
                    </div>
                    <p className="tamil-translation-sub">
                        (All places are ours, all people our kin.)
                    </p>

                    <div className="cta-links">
                        <button type="button" className="cta-link-btn" onClick={() => alert('Accessing YouTube Channel...')}>YOUTUBE CHANNEL</button>
                        <button type="button" className="cta-link-btn" onClick={() => alert('Joining Discord Communal Stage...')}>DISCORD SERVER</button>
                        <button type="button" className="cta-link-btn" onClick={() => alert('Redirecting to Pay-As-You-Wish portal...')}>SUPPORT DIRECTLY</button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
