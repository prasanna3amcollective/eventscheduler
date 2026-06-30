'use client';

import { useRouter } from 'next/navigation';
import './WritersCommunity.css';

export default function WritersCommunity() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="writers-wrapper">
            <button className="writers-back" onClick={handleBack} aria-label="Go back">
                ← BACK
            </button>

            <div className="writers-container">
                {/* HEADER */}
                <header className="writers-header">
                    <h1>3AM WRITERS<br />COMMUNITY</h1>
                    <div className="tagline">Those who dare to write...</div>
                </header>

                {/* STAMP QUOTE */}
                <div className="stamp-quote">
                    <p>&ldquo;Community is an anti-thesis to the separatist individualism.&rdquo;</p>
                </div>

                {/* WHAT IS THIS */}
                <section className="writers-section">
                    <h2>
                        <span className="ink-icon">&#9998;</span> What is This?
                    </h2>
                    <p>This community is a group of writers united by their passion for writing, not a filtered echo chamber.</p>
                    <p>Through regular events and meetings, you&rsquo;ll be part of a vibrant community that supports each member&rsquo;s growth and challenges them to improve.</p>
                </section>

                {/* WHY */}
                <section className="writers-section">
                    <h2>
                        <span className="ink-icon">&#10002;</span> Why?
                    </h2>
                    <p>To build a system that empowers the creators, its about time we assume the power and stop blaming producers, market demands, or political climates.</p>
                    <p>Writers should pursue original ideas, not just write what sells.</p>
                    <p>We hold an important responsibility to be &ldquo;the&rdquo; society&rsquo;s conscience. It is important that we do not allow our voices to be silenced or influenced by the capitalistic powers.</p>
                </section>

                {/* FOR WHOM */}
                <section className="writers-section">
                    <h2>
                        <span className="ink-icon">&#10047;</span> For Whom?
                    </h2>
                    <p>This community is open to anyone interested in writing. We warmly welcome both novice and experienced writers.</p>
                    <p>All formats of writers are encouraged to join our community. Participation in these events is completely free of charge.</p>
                    <div className="writer-types">
                        <div className="writer-type-card">
                            <h4>Novice</h4>
                            <p>Just starting your writing journey</p>
                        </div>
                        <div className="writer-type-card">
                            <h4>Experienced</h4>
                            <p>Seasoned writers looking for community</p>
                        </div>
                    </div>
                </section>

                {/* HOW */}
                <section className="writers-section">
                    <h2>
                        <span className="ink-icon">&#9998;</span> How?
                    </h2>
                    <p>There will be a regular gathering of writers and a variety of workshops and events. Challenging different aspects of writing.</p>
                    <p>Sophisticated feedback sessions are an essential part of this commune. Healthy discussion of the craft as well as the politics of the creation can be expected.</p>
                    <p>There will be also syndicates of other artists like cinematographers and actors, who will work alongside us, with whom writers are encouraged to work with to take their writing an extra mile.</p>
                </section>

                {/* BOTTOM QUOTE */}
                <div className="bottom-quote">
                    <p>&ldquo;The need for community is primal, as fundamental as the need for air, water and food.&rdquo;</p>
                </div>
            </div>
        </div>
    );
}