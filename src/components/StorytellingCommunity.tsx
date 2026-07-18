'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


interface ShadowStory {
  id: string;
  tag: string;
  quote: string;
  tamilQuote?: string;
  duration: string;
  waveform: string;
  solidarityCount: number;
}

const SAMPLE_SHADOW_STORIES: ShadowStory[] = [
  {
    id: 'story-1',
    tag: '#பாலின_சமத்துவம் (Gender Equality)',
    quote: '"When I speak without showing my face, I am no longer judged by my background, class, or caste—only by the truth of my experience and my pain."',
    tamilQuote: 'என் முகத்தை காட்டாமல் பேசும்போது, சமூகம் என்னை சாதி, மதம் அல்லது அந்தஸ்தை வைத்து எடைபோடுவதில்லை; என் குரலின் உண்மையையும் வலியையும் மட்டுமே கேட்கிறது.',
    duration: '03:42',
    waveform: '▮▮▯▮▮▮▯▯▮▮▯▮▮▮▯▯▮▮▯▮▮▮▯▯▮',
    solidarityCount: 42
  },
  {
    id: 'story-2',
    tag: '#மனநலம் (Mental Health & Healing)',
    quote: '"We are taught that productivity is our only worth. Sharing my burnout here anonymously felt like taking a full breath for the first time in ten years."',
    tamilQuote: 'உழைப்பு மட்டுமே நமது மதிப்பு என்று கற்றுக்கொடுக்கப்பட்டுள்ளது. என் மனச்சோர்வை இங்கு பகிர்ந்தபோது பத்து வருடங்களில் முதன்முறையாக நிம்மதியாக மூச்சு விடுவது போல் இருந்தது.',
    duration: '05:15',
    waveform: '▯▮▮▯▮▮▮▯▮▮▮▯▯▮▮▯▮▮▯▯▮▮▮▯▮',
    solidarityCount: 68
  },
  {
    id: 'story-3',
    tag: '#சாதி_மத_பிரச்சனை (Caste & Social Justice)',
    quote: '"True anti-hierarchical community begins when we dismantle the walls in our own neighborhoods. This is my story of organizing in our local village circle."',
    tamilQuote: 'உண்மையான சமத்துவ சமூகம் நமது தெருக்களில் உள்ள சுவர்களை உடைப்பதில் இருந்து தொடங்குகிறது. இது எங்கள் கிராமத்தில் நாங்கள் முன்னெடுத்த மாற்றத்தின் கதை.',
    duration: '04:08',
    waveform: '▮▮▮▯▯▮▮▯▮▮▮▯▮▮▯▯▮▮▮▯▮▮▯▯▮',
    solidarityCount: 89
  }
];

export default function StorytellingCommunity() {
  const router = useRouter();

  // Interactive States
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [solidarityGiven, setSolidarityGiven] = useState<Record<string, boolean>>({});
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState<'folk' | 'academic'>('folk');
  const [selectedContributionPath, setSelectedContributionPath] = useState<string>('voice');

  const currentStory = SAMPLE_SHADOW_STORIES[activeStoryIndex];

  const handleListenSolidarity = (id: string) => {
    if (!solidarityGiven[id]) {
      setSolidarityGiven(prev => ({ ...prev, [id]: true }));
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="story-wrapper">
      {/* TOP PLEDGE BAR */}
      <header className="story-top-bar">
        <button className="story-back-btn" onClick={() => router.push('/explore')} aria-label="Return to Explore">
          ← RETURN TO EXPLORE
        </button>
        <div className="story-pledge-badge" aria-label="Community Values">
          <span className="pledge-item"><span className="pledge-dot">◉</span> DECENTRALIZED</span>
          <span className="pledge-item"><span className="pledge-dot">◉</span> ZERO ALGORITHMS</span>
          <span className="pledge-item"><span className="pledge-dot">◉</span> ZERO MONETIZATION</span>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="story-hero-section">
        <div className="story-hearth-circle" aria-hidden="true">
          <svg viewBox="0 0 240 240" width="180" height="180" className="hearth-svg">
            <defs>
              <radialGradient id="hearthGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E27D12" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#BA4A28" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#171513" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Campfire / Concentric Ring Motif */}
            <circle cx="120" cy="120" r="110" fill="url(#hearthGlow)" />
            <circle cx="120" cy="120" r="88" stroke="#BA4A28" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.6" />
            <circle cx="120" cy="120" r="64" stroke="#E27D12" strokeWidth="2" fill="none" opacity="0.8" />
            <circle cx="120" cy="120" r="38" fill="#171513" stroke="#E27D12" strokeWidth="2.5" />
            <text x="120" y="125" textAnchor="middle" fill="#F6F3ED" fontSize="20" fontFamily="Courier Prime, monospace">3AM</text>
          </svg>
        </div>

        <div className="hero-eyebrow">CULTIVATED BY THE 3AM COLLECTIVE &amp; THE PEOPLE</div>
        <h1 className="story-main-title">
          3AM <span>Storytelling</span> Community
        </h1>
        <p className="story-subtitle">
          To connect with people without algorithms, filters, or hierarchy.
        </p>

        {/* THE ANTI-METRIC MANIFESTO */}
        <aside className="story-manifesto-box">
          <div className="manifesto-header">
            <span className="manifesto-tag">◉ THE ANTI-METRIC MANIFESTO // என்ன இது &amp; ஏன்?</span>
          </div>
          <p className="tamil-text manifesto-tamil">
            இந்த storytelling community என்பது மனிதர்கள் தங்கள் வாழ்க்கையில் அனுபவித்த உண்மையான சம்பவங்கள், உணர்ச்சிகள், சிந்தனைகள் மற்றும் சமூகத்தைப் பற்றிய கருத்துகளை கதையாக பகிரும் ஒரு தளம். இது ஒரு சாதாரண படைப்பு தளம் அல்ல; இது மக்கள் தங்களது கதைகளை எந்த பயமுமின்றி வெளிப்படுத்தக்கூடிய ஒரு பாதுகாப்பான இடம். தனிப்பட்ட கதைகள், புத்தகங்களில் இருந்து பெறப்படும் அறிவு, சமூக மற்றும் அரசியல் மாற்றங்களை பேசும் கதைகள், மேலும் முகம் காட்டாமல் பகிரப்படும் அனானிமஸ் கதைகள் இவைகள் ஒன்றாக இணைந்து உண்மையான குரல்களின் ஒரு community-யை உருவாக்குகின்றன.
          </p>
          <hr className="manifesto-divider" />
          <p className="tamil-text manifesto-tamil">
            இன்றைய சமூகத்தில் பலருக்கு சொல்ல வேண்டிய கதைகள் இருக்கின்றன, ஆனால் அதை பகிர ஒரு பாதுகாப்பான மற்றும் உண்மையான தளம் இல்லை. சமூக ஊடகங்களில் ஆழமில்லாத மேலோட்டமான விஷயங்கள் மற்றும் செய்திகள் அதிகமாக காணப்படுவதால், உண்மையான உணர்ச்சிகள் மற்றும் அனுபவங்கள் பின்னணியில் மறைந்து விடுகின்றன. இந்த storytelling community அந்த இடைவெளியை நிரப்புகிறது.
          </p>
          <div className="manifesto-principles-grid">
            <div className="manifesto-principle">
              <strong>NO VANITY METRICS</strong>
              <span>We do not rank your trauma or joy. No like counters, no follower ladders, no trending charts.</span>
            </div>
            <div className="manifesto-principle">
              <strong>DECENTRALIZED HEARTH</strong>
              <span>No influencers or gatekeepers. A story told by a villager holds the exact same weight as one told by a scholar.</span>
            </div>
            <div className="manifesto-principle">
              <strong>RADICAL SANCTUARY</strong>
              <span>We protect vulnerable truths through shadow silhouettes and voice-only preservation so you can speak without fear.</span>
            </div>
          </div>
        </aside>
      </section>

      {/* THE FOUR EQUAL PILLARS (Non-Hierarchical Rhizomatic Grid) */}
      <section className="story-pillars-section">
        <div className="section-title-wrap">
          <span className="section-kicker">◉ NON-HIERARCHICAL PILLARS OF OUR CIRCLE</span>
          <h2 className="section-heading">Four Dimensions, Equal Standing</h2>
          <p className="section-subtext">None is primary above another. Personal healing is tied directly to collective political transformation.</p>
        </div>

        <div className="story-pillars-grid">
          {/* PILLAR 1: SELF EXPRESSION */}
          <article className="story-pillar-card">
            <div className="pillar-header">
              <span className="pillar-index">PILLAR 01 // HEALING</span>
              <span className="pillar-symbol">◈</span>
            </div>
            <h3 className="pillar-title">
              தனிப்பட்ட கதைகள்
              <span>Self Expression</span>
            </h3>
            <p className="tamil-text pillar-body">
              ஒருவரின் உண்மை வாழ்க்கை அனுபவங்கள், உணர்ச்சி, பயம், சந்தோஷம் போன்றவற்றின் வெளிப்பாடு. தன்னை வெளிப்படுத்துதல் குறைந்துவிட்ட இன்றைய சூழலில், இது மனநலம் சார்ந்த விஷயங்களை பேச உதவுகிறது.
            </p>
            <div className="pillar-why">
              <strong>ஏன் இது வேலை செய்கிறது:</strong>
              <span>உணர்ச்சி இணைப்பு (Emotional Connection), மனநலம் சார்ந்த வெளிப்பாடு (Relatability).</span>
            </div>
            <div className="pillar-footer">
              <span className="pillar-format">FORMATS:</span>
              <div className="pillar-tags">
                <span>Talking Head</span>
                <span>Voice-over + Visuals</span>
                <span>Anonymous Voice</span>
              </div>
            </div>
          </article>

          {/* PILLAR 2: KNOWLEDGE TRANSFER */}
          <article className="story-pillar-card">
            <div className="pillar-header">
              <span className="pillar-index">PILLAR 02 // ANTI-ELITISM</span>
              <span className="pillar-symbol">◈</span>
            </div>
            <h3 className="pillar-title">
              புத்தகங்களில் இருந்து கதை
              <span>Knowledge Transfer</span>
            </h3>
            <p className="tamil-text pillar-body">
              புத்தகங்களில் உள்ள கருத்துகளை எளிய கதையாக மாற்றுவது. பல எழுத்தாளர்களின் கதைகளை மக்களுக்கு கொண்டு சேர்ப்பது, அது மட்டுமின்றி வாசிப்பு பழக்கத்தை தூண்டுவது.
            </p>
            <div className="pillar-why">
              <strong>ஏன் இது முக்கியம்:</strong>
              <span>சிக்கலான கருத்துகளை எளிதாக புரிய வைக்கும். புத்தகங்களை படிக்காதவர்களுக்கும் அறிவை கொண்டு சேர்க்கும்.</span>
            </div>
            <div className="pillar-footer">
              <span className="pillar-format">FORMATS:</span>
              <div className="pillar-tags">
                <span>Narration + Visuals</span>
                <span>Short Folk Explainers</span>
              </div>
            </div>
          </article>

          {/* PILLAR 3: SOCIAL / POLITICAL TRANSFORMATION */}
          <article className="story-pillar-card highlighted">
            <div className="pillar-header">
              <span className="pillar-index">PILLAR 03 // RESISTANCE</span>
              <span className="pillar-symbol">◈</span>
            </div>
            <h3 className="pillar-title">
              சமூக / அரசியல் மாற்றக் கதைகள்
              <span>Social &amp; Political Change</span>
            </h3>
            <p className="tamil-text pillar-body">
              சமூகத்தில் புதைந்துள்ள அநீதிகளை குறித்து பேசுவது. விழிப்புணர்வு ஏற்படுத்துதல், விவாதத்தை தொடங்குதல் மற்றும் மாற்றத்திற்கான சிந்தனையை உருவாக்குதல்.
            </p>
            <div className="pillar-why">
              <strong>முக்கிய களங்கள் (Core Fronts):</strong>
              <div className="pillar-highlight-tags">
                <span className="tag-bold">#சாதி/மத_பிரச்சனை</span>
                <span className="tag-bold">#பாலின_சமத்துவம்</span>
                <span className="tag-bold">#சமூக_அநீதிகள்</span>
              </div>
            </div>
            <div className="pillar-footer">
              <span className="pillar-format">PURPOSE:</span>
              <div className="pillar-tags">
                <span>Dismantle Hierarchy</span>
                <span>Sparks Dialogue</span>
              </div>
            </div>
          </article>

          {/* PILLAR 4: ANONYMOUS STORIES */}
          <article className="story-pillar-card">
            <div className="pillar-header">
              <span className="pillar-index">PILLAR 04 // SANCTUARY</span>
              <span className="pillar-symbol">◈</span>
            </div>
            <h3 className="pillar-title">
              Anonymous Stories
              <span>முகம் காட்டாமல் கதைகள்</span>
            </h3>
            <p className="tamil-text pillar-body">
              முகம் காட்டாமல் கதைகள் சொல்லுதல். தற்காலத்தில் அந்த கதையில் வரும் மனிதர்கள் வாழ்ந்து கொண்டிருக்கலாம், அல்லது கதையை சொல்லும் நபர்களுக்கு தங்களது முகத்தை காண்பிப்பதற்கு விருப்பமும் பயமும் இருக்கலாம் — அதனால் குரல் மட்டும் பயன்படுத்தலாம்.
            </p>
            <div className="pillar-why">
              <strong>பலன்கள் (Benefits):</strong>
              <span>பாதுகாப்பு அவசியம். உணமையாக பகிரும் தைரியம் அதிகரிக்கும். Sensitive ஆனா தகவல்களை எளிதாக பகிர முடியும்.</span>
            </div>
            <div className="pillar-footer">
              <span className="pillar-format">FORMATS:</span>
              <div className="pillar-tags">
                <span>Voice Over Visuals</span>
                <span>Shadow / Silhouette</span>
                <span>Text + Audio</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* INTERACTIVE FEATURE 1: THE SHADOW BOOTH (Anonymous Audio Stream) */}
      <section className="story-interactive-section shadow-booth-section">
        <div className="section-title-wrap">
          <span className="section-kicker">◉ THE SHADOW BOOTH // முகம் காட்டாத குரல்கள்</span>
          <h2 className="section-heading">Voice Without Surveillance</h2>
        </div>

        <div className="shadow-booth-container">

          <div className="booth-player-card">
            <div className="booth-player-header">
              <div className="booth-avatar-box">
                <svg viewBox="0 0 64 64" width="44" height="44">
                  <circle cx="32" cy="32" r="30" fill="#171513" stroke="#BA4A28" strokeWidth="2" />
                  <circle cx="32" cy="24" r="10" fill="#E27D12" opacity="0.9" />
                  <path d="M14 50 C 14 38, 50 38, 50 50 Z" fill="#E27D12" opacity="0.9" />
                </svg>
              </div>
            </div>

            <div className="booth-quote-wrap">
              <p className="booth-english-quote">{currentStory.quote}</p>
              {currentStory.tamilQuote && (
                <p className="tamil-text booth-tamil-quote">{currentStory.tamilQuote}</p>
              )}
            </div>


          </div>
        </div>
      </section>

      {/* INTERACTIVE FEATURE 2: DEMOCRATIZING KNOWLEDGE (Folk vs Academic Toggle) */}
      <section className="story-interactive-section knowledge-section">
        <div className="section-title-wrap">
          <span className="section-kicker">◉ BREAKING INTELLECTUAL ELITISM // அறிவை மக்களிடம் கொண்டு சேர்த்தல்</span>
          <h2 className="section-heading">Knowledge Belongs to the People</h2>
          <p className="section-subtext">How Section 04 transforms dense book theory into relatable folk narratives that spark collective critical consciousness.</p>
        </div>

        <div className="knowledge-toggle-card">
          <div className="toggle-tabs">
            <button
              className={`toggle-tab ${activeKnowledgeTab === 'folk' ? 'active' : ''}`}
              onClick={() => setActiveKnowledgeTab('folk')}
            >
              ◉ FOLK STORY TRANSLATION (எளிய கதை)
            </button>
            <button
              className={`toggle-tab ${activeKnowledgeTab === 'academic' ? 'active' : ''}`}
              onClick={() => setActiveKnowledgeTab('academic')}
            >
              ◇ ACADEMIC THEORY (சிக்கலான கருத்து)
            </button>
          </div>

          <div className="toggle-content">
            {activeKnowledgeTab === 'folk' ? (
              <div className="knowledge-view folk-view">
                <div className="view-tag">ACCESSIBLE NARRATIVE // வாசிப்பு பழக்கத்தை தூண்டுவது</div>
                <h3 className="tamil-text view-title">"மரத்தின் வேரும், எங்கள் தெருவின் கிணறும்" (The Tree's Root &amp; Our Street's Well)</h3>
                <p className="tamil-text view-text">
                  ஒரு ஊரில் இரண்டு கிணறுகள் இருந்தன. மேலத்தெரு கிணற்றில் நீர் எப்போதும் தெளிவாக இருந்தது; கீழத்தெரு கிணறு கோடையில் வறண்டுவிடும். ஒரு நாள் வயதான ஒரு பாட்டி சொன்னாள்: "கிணறு வறண்டது மழை இல்லாததால் அல்ல, நிலத்தடி நீரோடையை நடுவில் யார் தடுத்து வைத்தார்கள் என்று பாருங்கள்." சமூக ஏற்றத்தாழ்வும் அப்படித்தான்—அது இயற்கையானது அல்ல, சிலரால் செயற்கையாக உருவாக்கப்பட்ட தடுப்பு.
                </p>
                <div className="view-takeaway">
                  <strong>மக்கள் புரிதல் (Community Takeaway):</strong> Inequality is not natural or divine; it is structural and can be dismantled together.
                </div>
              </div>
            ) : (
              <div className="knowledge-view academic-view">
                <div className="view-tag">ORIGINAL BOOK CONCEPT // SOCIO-POLITICAL THEORY</div>
                <h3 className="view-title">Structural Hegemony &amp; Resource Monopolization</h3>
                <p className="view-text">
                  In sociological critique, systemic stratification persists because dominant institutions naturalize artificial resource disparities. By framing socio-economic privilege as inherent merit or natural order, hierarchical structures discourage subaltern communities from interrogating structural distribution mechanisms.
                </p>
                <div className="view-takeaway academic-note">
                  <strong>Why We Transform This:</strong> Academic jargon locks liberation theory inside university walls. Storytelling breaks the lock and distributes the key to everyone.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INTERACTIVE FEATURE 3: OPEN CIRCLE PROMPT BOX (Decentralized Contribution) */}
      <section className="story-interactive-section prompt-section">
        <div className="section-title-wrap">
          <span className="section-kicker">◉ THE OPEN CIRCLE // உங்கள் குரல்</span>
          <h2 className="section-heading">Step Into the Hearth</h2>
          <p className="section-subtext">We don&apos;t ask you to create &quot;content&quot; for engagement. We invite you to contribute a truth to the living memory of the collective.</p>
        </div>

        <div className="contribution-card">
          <div className="contribution-prompt-header">
            <span>CURRENT COMMUNITY PROMPT // இந்த வார சிந்தனை:</span>
            <h3>&quot;What is an unwritten hierarchy in your workplace or family that nobody speaks about, but everyone feels?&quot;</h3>
          </div>

          <div className="contribution-paths-grid">
            <button
              className={`path-option ${selectedContributionPath === 'voice' ? 'selected' : ''}`}
              onClick={() => setSelectedContributionPath('voice')}
            >
              <div className="path-icon">🎤 + 👥</div>
              <strong>Share via Anonymous Voice</strong>
              <span>Your voice pitch is preserved with shadow silhouettes. Zero facial identity required.</span>
            </button>

            <button
              className={`path-option ${selectedContributionPath === 'penname' ? 'selected' : ''}`}
              onClick={() => setSelectedContributionPath('penname')}
            >
              <div className="path-icon">✍️ + 📜</div>
              <strong>Share with Pen Name</strong>
              <span>Publish written reflection or poem under an alias to spark dialogue across our network.</span>
            </button>

            <button
              className={`path-option ${selectedContributionPath === 'archive' ? 'selected' : ''}`}
              onClick={() => setSelectedContributionPath('archive')}
            >
              <div className="path-icon">🗃️ + 🔒</div>
              <strong>Deposit to Memory Archive</strong>
              <span>No public broadcasting. Stored strictly in the collective circle vault for historical record.</span>
            </button>
          </div>

          <div className="contribution-action-area">
            <div className="selected-path-banner">
              <strong>SELECTED PATH:</strong>{' '}
              {selectedContributionPath === 'voice' && 'Anonymous Voice Booth (Shadow Audio)'}
              {selectedContributionPath === 'penname' && 'Pen Name Publication (Written Narrative)'}
              {selectedContributionPath === 'archive' && 'Private Memory Deposit (No Public Stream)'}
            </div>
          </div>
        </div>
      </section>

      {/* VISION & CREED FOOTER */}
      <footer className="story-grassroots-footer">
        <div className="footer-creed-box">
          <p className="tamil-text creed-line">ஒவ்வொருவருக்கும் ஒரு கதை உள்ளது.</p>
          <p className="tamil-text creed-line">சில கதைகள் குணப்படுத்தும்.</p>
          <p className="tamil-text creed-line">சில கதைகள் கற்றுதரும்.</p>
          <p className="tamil-text creed-line highlight">சில கதைகள் சமூகத்தை மாற்றும்.</p>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-collective-info">
            <strong>✦ 3AM COLLECTIVE &amp; THE STORYTELLING CIRCLE ✦</strong>
            <span>Built without venture capital, surveillance algorithms, or hierarchical gatekeepers.</span>
          </div>
          <button className="footer-top-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ↑ RETURN TO TOP OF CIRCLE
          </button>
        </div>
      </footer>
    </div>
  );
}
