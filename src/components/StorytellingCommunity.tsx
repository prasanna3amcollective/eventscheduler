'use client';

import { useRouter } from 'next/navigation';
import './StorytellingCommunity.css';

export default function StorytellingCommunity() {
    const router = useRouter();

    const handleBack = () => {
        router.push('/home#explore');
    };

    return (
        <div className="story-wrapper">
            <button className="story-back" onClick={handleBack} aria-label="Go back">
                ← BACK
            </button>

            {/* HERO */}
            <header className="story-hero">
                <div className="story-hero-crescent" aria-hidden="true">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="180" height="180">
                        <defs>
                            <radialGradient id="crescentGlow" cx="40%" cy="40%" r="60%">
                                <stop offset="0%" stopColor="#FFD580"/>
                                <stop offset="50%" stopColor="#F2A832"/>
                                <stop offset="100%" stopColor="#C4660A"/>
                            </radialGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="6" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        {/* Outer soft glow ring */}
                        <circle cx="100" cy="100" r="88" fill="rgba(232,134,10,0.12)"/>
                        <circle cx="100" cy="100" r="72" fill="rgba(232,134,10,0.1)"/>
                        {/* Crescent moon shape via clipping */}
                        <g filter="url(#glow)">
                            <circle cx="100" cy="100" r="62" fill="url(#crescentGlow)"/>
                            <circle cx="128" cy="90" r="54" fill="#1C0E00"/>
                        </g>
                    </svg>
                </div>
                <p className="story-hero-sub">3AM Collective Presents</p>
                <h1 className="story-hero-title">
                    3AM <span>Storytelling</span> Community
                </h1>
                <p className="story-hero-sub" style={{ marginTop: '0.5rem' }}>
                    How to connect with your people
                </p>
                <hr className="story-hero-divider" />
            </header>

            {/* MAIN CONTENT */}
            <main className="story-container">

                {/* WHAT IS THIS */}
                <section className="story-section">
                    <h2>
                        <span className="section-icon">◉</span> What is This?
                    </h2>
                    <p className="tamil-text">
                        இந்த storytelling community என்பது மனிதர்கள் தங்கள் வாழ்க்கையில் அனுபவித்த உண்மையான சம்பவங்கள், உணர்ச்சிகள், சிந்தனைகள் மற்றும் சமூகத்தைப் பற்றிய கருத்துகளை கதையாக பகிரும் ஒரு தளம். இது ஒரு சாதாரண படைப்பு தளம் அல்ல; இது ஒரு பாதுகாப்பான மக்கள் தங்களது கதைகளை எந்த பயமுமின்றி வெளிப்படுத்தக்கூடிய இடம். தனிப்பட்ட கதைகள், புத்தகங்களில் இருந்து பெறப்படும் அறிவு, சமூக மற்றும் அரசியல் மாற்றங்களை பேசும் கதைகள், மேலும் முகம் காட்டாமல் பகிரப்படும் அனானிமஸ் கதைகள் இவைகள் ஒன்றாக இணைந்து உண்மையான குரல்களின் ஒரு community-யை உருவாக்குகின்றன. இந்த தளம் மனிதர்களுக்கிடையேயான உண்மையான இணைப்பை உருவாக்குவதற்காக இருக்கிறது.
                    </p>
                </section>

                {/* WHY STORYTELLING */}
                <section className="story-section alt">
                    <h2>
                        <span className="section-icon">◉</span> Why Storytelling?
                    </h2>
                    <p className="tamil-text">
                        இன்றைய சமூகத்தில் பலருக்கு சொல்ல வேண்டிய கதைகள் இருக்கின்றன, ஆனால் அதை பகிர ஒரு பாதுகாப்பான மற்றும் உண்மையான தளம் இல்லை. சமூக ஊடகங்களில் ஆழமில்லாத மேலோட்டமான விஷயங்கள் மற்றும் செய்திகள் அதிகமாக காணப்படுவதால், உண்மையான உணர்ச்சிகள் மற்றும் அனுபவங்கள் பின்னணியில் மறைந்து விடுகின்றன. இதனால் தன்னை வெளிப்படுத்துதல் குறைந்துவிட்டது, மனநலம் சார்ந்த விஷயங்கள் பேசப்படாமல் போகின்றன, மற்றும் சமூக பிரச்சனைகள் ஆழமாக விவாதிக்கப்படுவதில்லை. இந்த storytelling community அந்த இடைவெளியை நிரப்புகிறது. இது மக்களுக்கு தங்கள் குரலை வெளிப்படுத்த ஒரு அர்த்தமுள்ள தளமாக செயல்பட்டு, கேட்பவர்களுக்கு புரிதல், உணர்ச்சி மற்றும் விழிப்புணர்வை உருவாக்குகிறது.
                    </p>
                </section>

                {/* SELF EXPRESSION */}
                <section className="story-section">
                    <h2>
                        <span className="section-icon">◉</span> தனிப்பட்ட கதைகள் — Self Expression
                    </h2>
                    <ul className="story-category-list">
                        <li>ஒருவரின் உண்மை வாழ்க்கை அனுபவங்கள்.</li>
                        <li>உணர்ச்சி, பயம், சந்தோஷம் போன்றவற்றின் வெளிப்பாடு.</li>
                    </ul>

                    <div className="story-subsection">
                        <h3>ஏன் இது வேலை செய்கிறது</h3>
                        <div className="story-tags">
                            <span className="story-tag filled">தொடர்பு (Relatability)</span>
                            <span className="story-tag filled">உணர்ச்சி இணைப்பு</span>
                            <span className="story-tag filled">மனநலம் சார்ந்த வெளிப்பாடு</span>
                        </div>
                    </div>

                    <div className="story-subsection" style={{ marginTop: '1.5rem' }}>
                        <h3>Format</h3>
                        <div className="story-tags">
                            <span className="story-tag">நேரடி பேச்சு (Talking Head)</span>
                            <span className="story-tag">Voice-over + Visuals</span>
                            <span className="story-tag">Anonymous கதை</span>
                        </div>
                    </div>
                </section>

                {/* KNOWLEDGE TRANSFER */}
                <section className="story-section alt">
                    <h2>
                        <span className="section-icon">◉</span> புத்தகங்களில் இருந்து கதை — Knowledge Transfer
                    </h2>
                    <ul className="story-category-list">
                        <li>புத்தகங்களில் உள்ள கருத்துகளை எளிய கதையாக மாற்றுவது</li>
                        <li>பல எழுத்தாளர்களின் கதைகளை மக்களுக்கு கொண்டு சேர்ப்பது, அது மட்டுமின்றி வாசிப்பு பழக்கத்தை தூண்டுவது</li>
                    </ul>

                    <div className="story-subsection">
                        <h3>ஏன் இது முக்கியம்</h3>
                        <div className="story-benefit-grid">
                            <div className="story-benefit-card">
                                சிக்கலான கருத்துகளை எளிதாக புரிய வைக்கும்
                            </div>
                            <div className="story-benefit-card">
                                புத்தகங்களை படிக்காதவர்களுக்கும் அறிவை கொண்டு சேர்க்கும்
                            </div>
                        </div>
                    </div>

                    <div className="story-subsection" style={{ marginTop: '1.5rem' }}>
                        <h3>Format</h3>
                        <div className="story-tags">
                            <span className="story-tag">Narration + Visuals</span>
                            <span className="story-tag">Short Explainers</span>
                        </div>
                    </div>
                </section>

                {/* SOCIAL / POLITICAL */}
                <section className="story-section">
                    <h2>
                        <span className="section-icon">◉</span> சமூக / அரசியல் மாற்றக் கதைகள்
                    </h2>
                    <div className="story-tags" style={{ marginBottom: '1rem' }}>
                        <span className="story-tag filled">சாதி/மத பிரச்சனை</span>
                        <span className="story-tag filled">பாலின சமத்துவம்</span>
                        <span className="story-tag filled">சமூக அநீதிகள்</span>
                    </div>

                    <div className="story-subsection">
                        <h3>நோக்கம்</h3>
                        <ul className="story-category-list">
                            <li>விழிப்புணர்வு ஏற்படுத்துதல்</li>
                            <li>விவாதத்தை தொடங்குதல்</li>
                            <li>மாற்றத்திற்கான சிந்தனையை உருவாக்குதல்</li>
                        </ul>
                    </div>
                </section>

                {/* ANONYMOUS STORIES */}
                <section className="story-section alt">
                    <h2>
                        <span className="section-icon">◉</span> Anonymous Stories
                    </h2>
                    <p className="tamil-text">
                        முகம் காட்டாமல் கதைகள் சொல்லுதல். தற்காலத்தில் அந்த கதையில் வரும் மனிதர்கள் வாழ்ந்து கொண்டிருக்கலாம், அல்லது கதையை சொல்லும் நபர்களுக்கு தங்களது முகத்தை காண்பிப்பதற்கு விருப்பமும் பயமும் இருக்கலாம் — அதனால் குரல் மட்டும் பயன்படுத்தலாம்.
                    </p>

                    <div className="story-divider">Format</div>

                    <div className="story-tags">
                        <span className="story-tag">Voice Over with Visuals</span>
                        <span className="story-tag">Shadow or Silhouette Visuals</span>
                        <span className="story-tag">Text with Audio Storytelling</span>
                    </div>
                </section>

                {/* BENEFITS */}
                <section className="story-section">
                    <h2>
                        <span className="section-icon">◉</span> பலன்கள்
                    </h2>
                    <div className="story-benefit-grid">
                        <div className="story-benefit-card">
                            <strong>பாதுகாப்பு</strong> அவசியம்
                        </div>
                        <div className="story-benefit-card">
                            உண்மையாக பகிரும் <strong>தைரியம்</strong> அதிகரிக்கும்
                        </div>
                        <div className="story-benefit-card">
                            Sensitive ஆனா தகவல்களை <strong>எளிதாக</strong> பகிர முடியும்
                        </div>
                    </div>
                </section>

                {/* VISION */}
                <div className="story-vision">
                    <p>ஒவ்வொருவருக்கும் ஒரு கதை உள்ளது.</p>
                    <p>சில கதைகள் குணப்படுத்தும்.</p>
                    <p>சில கதைகள் கற்றுதரும்.</p>
                    <p>சில கதைகள் சமூகத்தை மாற்றும்.</p>
                </div>

                {/* FOOTER */}
                <footer className="story-footer">
                    ✦ &nbsp; Thank You &nbsp; ✦ &nbsp; 3AM Collective &nbsp; ✦
                </footer>

            </main>
        </div>
    );
}
