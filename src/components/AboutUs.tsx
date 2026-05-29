import './AboutUs.css';

export default function AboutUs() {
  return (
    <>
      <section id="hero" className="about-section">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">An Indie Cult House · 2026</p>
          <h1 className="hero-title">
            3AM
            <span>tea cigaz.</span>
          </h1>
          <p className="hero-tagline">'The 3am independent film community is transforming into a creators' collective. We are building a decentralized structure to achieve autonomy and serve a unified mission.'</p>
        </div>
        <div className="hero-year">2026</div>
        <div className="scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      <section id="origin" className="about-section">
        <div className="origin-3d-block reveal-left">
          <div className="origin-card">
            <div className="big-quote">"</div>
            <p>One fine day, we decided to meet to discuss our cinematic dreams. The conversation lasted until 3 a.m. as we drank tea to stay refreshed and smoked cigarettes while sharing stories we had written.</p>
            <div className="origin-name">3AM TEA CIGAZ</div>
          </div>
        </div>
        <div className="origin-text reveal-right">
          <p className="section-label">The Three Names</p>
          <h2 className="section-title">This Inspired<br/>Our Name.</h2>
          <div className="divider"></div>
          <p className="section-body">Three names met at the intersection of dreams, dark hours, and defiance. Tea to stay awake. Cigarettes to stay honest. Stories to stay alive.<br/><br/>We do not wait for permission. We do not wait for funding. We build while the world sleeps.</p>
          <div className="big-statement">WE DO THINGS<br/><em>FOR WHAT WE LOVE.</em></div>
        </div>
      </section>

      <section id="decisions" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Decisions</p>
          <h2 className="section-title">How We Choose<br/>to Exist.</h2>
          <div className="divider center"></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--light)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.9 }}>If we expect equality, we should practice equity through an affirmative action, so everyone gets the support they need.</p>
        </div>
        <div className="decisions-grid stagger">
          <div className="decision-card">
            <span className="decision-icon">◎</span>
            <div className="decision-title">Community Space</div>
            <ul className="decision-items">
              <li>Ideas Discussion</li>
              <li>Creation Showcase</li>
              <li>Time Contribution</li>
              <li>Utility Access to Resources</li>
            </ul>
          </div>
          <div className="decision-card">
            <span className="decision-icon">⟡</span>
            <div className="decision-title">Creative Collaboration</div>
            <ul className="decision-items">
              <li>Sweat Equity</li>
              <li>Pay As You Wish</li>
              <li>Field Experience</li>
              <li>Skill Upgrade</li>
            </ul>
          </div>
          <div className="decision-card">
            <span className="decision-icon">◈</span>
            <div className="decision-title">Experiential Learning</div>
            <ul className="decision-items">
              <li>Skill Upgrade</li>
              <li>Field Experience</li>
              <li>Sweat Equity</li>
              <li>Pay As You Wish</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="actions" className="about-section">
        <div className="actions-layout">
          <div className="circles-visual reveal-left">
            <div className="circle-ring"><div className="circle-dot"></div></div>
            <div className="circle-ring"><div className="circle-dot"></div></div>
            <div className="circle-ring"><div className="circle-dot"></div></div>
            <div className="circle-center">
              <div className="circle-center-text">3 YEARS<br/>3 CIRCLES</div>
            </div>
          </div>
          <div className="actions-list reveal-right">
            <div className="section-label">The Three Actions</div>
            <h2 className="section-title">Cultivate.<br/>Embody.<br/>Forge.</h2>
            <div className="action-item">
              <div className="action-num">1</div>
              <div className="action-content">
                <h3>Cultivating Community Living.</h3>
                <p>Establishing a physical and virtual hub, launching creative residencies, integrating sustainable well-being, and fostering trust through regular rituals of critique and celebration.</p>
              </div>
            </div>
            <div className="action-item">
              <div className="action-num">2</div>
              <div className="action-content">
                <h3>Embodying a Collective Philosophy.</h3>
                <p>Ratifying a shared manifesto, empowering each member through an advice-process decision-making model, and committing to radical transparency in all operations and finances.</p>
              </div>
            </div>
            <div className="action-item">
              <div className="action-num">3</div>
              <div className="action-content">
                <h3>Forging an Alternative System.</h3>
                <p>Implementing a DAO framework for governance and project funding, creating a co-owned resource pool of equipment and assets, and developing an internal circular economy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="functions" className="about-section" style={{ padding: '120px 80px', background: 'var(--black)' }}>
        <div className="section-header reveal">
          <p className="section-label">The Three Functions</p>
          <h2 className="section-title">What We Do.<br/>Every Day.</h2>
        </div>
        <div className="oaths-layout stagger" style={{ marginTop: '80px' }}>
          <div className="oath-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '20px', opacity: 0.5 }}>↻</div>
            <h3>Sustain Our Daily Operations</h3>
            <p>We collectively manage the foundation of our shared space and time. Coordinating member availability, maintaining our physical environment, and hosting workshops and screenings based on our shared energy and willingness.</p>
          </div>
          <div className="oath-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '20px', opacity: 0.5 }}>⊙</div>
            <h3>Shape Our Collaborative Projects</h3>
            <p>We jointly steward the creative and logistical pipeline. Curating ideas, planning event programming, and managing collective finances to ensure the health and viability of our collaborative endeavors.</p>
          </div>
          <div className="oath-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '20px', opacity: 0.5 }}>◎</div>
            <h3>Direct Our Collective Vision</h3>
            <p>We actively work on our unifying mission. Defining our goals, aligning on our philosophy, and mobilizing coordinated actions to bring our shared vision into reality.</p>
          </div>
        </div>
      </section>

      <section id="structures" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Structures</p>
          <h2 className="section-title">The Structural Pillars.</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--light)', maxWidth: '440px', margin: '16px auto 0', lineHeight: 1.9, fontFamily: "'Courier Prime', monospace" }}>Together, they represent the different forms our foundational structure takes.</p>
        </div>
        <div className="structures-layout">
          <div className="venn-container reveal-left">
            <div className="venn-circle top"><span>3AM<br/>CORE</span></div>
            <div className="venn-circle bl"><span>3AM<br/>IN-HOUSE</span></div>
            <div className="venn-circle br"><span>3AM<br/>TEAM</span></div>
            <div className="venn-center-circle"><span>COLLECTIVE</span></div>
          </div>
          <div className="structure-defs reveal-right">
            <div className="structure-def">
              <h3>3AM Core</h3>
              <p>The Core Team carries the vision and mission forward. Working full-time, they establish the workflow and facilitate the In-House team to ensure execution.</p>
            </div>
            <div className="structure-def">
              <h3>3AM In-House</h3>
              <p>The In-House members execute the vision and mission to achieve our goals. They take on specific roles and are responsible for implementing projects and operations.</p>
            </div>
            <div className="structure-def">
              <h3>3AM Team</h3>
              <p>Team members provide support to the Core and In-House teams. They volunteer for part-time responsibilities as assigned by the In-House team.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="engagements" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Engagements</p>
          <h2 className="section-title">The Engagement<br/>Spectrum of Belonging.</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--light)', maxWidth: '440px', margin: '16px auto 0', lineHeight: 1.9 }}>They map the lifecycle of engagement, from active contribution to lasting legacy.</p>
        </div>
        <div className="engage-grid stagger">
          <div className="engage-card" data-num="1">
            <div className="sub">Active</div>
            <h3>3AM Member</h3>
            <p>Members are registered who support our activities and the drive toward indie filmmaking. They contribute financially as they wish to help us march toward our goals.</p>
          </div>
          <div className="engage-card" data-num="2">
            <div className="sub">Participating</div>
            <h3>3AM Participant</h3>
            <p>Members who participate in the activities conducted by 3AM. They are the energy in the room — turning ideas into actions, turning space into community.</p>
          </div>
          <div className="engage-card" data-num="3">
            <div className="sub">Legacy</div>
            <h3>3AM Alumni</h3>
            <p>The people who visited us at 3AM, while juggling their commitments in the cinema industry. They will be invited to every function, celebration, or release.</p>
          </div>
        </div>
      </section>

      <section id="forces" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Forces</p>
          <h2 className="section-title">The Creative Forces.</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--light)', maxWidth: '440px', margin: '16px auto 0', lineHeight: 1.9 }}>The intertwined roles every maker moves between — from providing support to leading vision.</p>
        </div>
        <div className="forces-layout stagger">
          <div className="force-card">
            <h3>3AM Collaborators</h3>
            <p>Fellow travelers — other collectives, organizations, or aligned groups who share our core vision. Our strategic partners, invited to join community meetings and co-create events. We engage through a barter system of mutual support, sharing resources, skills, and platforms. This is a conscious act of solidarity.</p>
          </div>
          <div className="force-card">
            <h3>3AM Contributors</h3>
            <p>The essential lifeblood of our collective. They engage on their own terms, participating in activities, using our space for discussion or personal creation, and supporting our work as an audience. Their contribution of energy and presence is a primary force that allows us to practice radical equality and keep our ecosystem accessible and alive.</p>
          </div>
          <div className="force-card">
            <h3>3AM Creators</h3>
            <p>Individual filmmakers, artists, and thinkers who fully align with our vision and integrate into the movement. They operate not as outsiders-for-hire but as committed freelancers within the collective, undertaking projects that advance our mission. The systematic challengers, using their craft and voice to dismantle and rebuild the status quo from within.</p>
          </div>
        </div>
      </section>

      <section id="ecosystem" className="about-section">
        <div className="orbit-system reveal">
          <div className="orbit-ring" style={{ width: '580px', height: '580px' }}></div>
          <div className="orbit-ring" style={{ width: '510px', height: '510px' }}></div>
          <div className="orbit-ring" style={{ width: '440px', height: '440px' }}></div>
          <div className="orbit-ring" style={{ width: '370px', height: '370px' }}></div>
          <div className="orbit-ring" style={{ width: '300px', height: '300px' }}></div>
          <div className="orbit-ring" style={{ width: '240px', height: '240px' }}></div>
          <div className="orbit-ring" style={{ width: '180px', height: '180px' }}></div>
          <div className="orbit-ring" style={{ width: '120px', height: '120px' }}></div>
          <div className="orbit-label" style={{ top: 'calc(50% - 295px)', left: '50%' }}>CREATORS</div>
          <div className="orbit-label" style={{ top: 'calc(50% - 258px)', left: '50%' }}>CONTRIBUTORS</div>
          <div className="orbit-label" style={{ top: 'calc(50% - 223px)', left: '50%' }}>COLLABORATORS</div>
          <div className="orbit-label" style={{ top: 'calc(50% - 188px)', left: '50%' }}>PARTICIPANT</div>
          <div className="orbit-label" style={{ top: 'calc(50% - 153px)', left: '50%' }}>ALUMNI</div>
          <div className="orbit-label" style={{ top: 'calc(50% - 118px)', left: '50%' }}>MEMBER</div>
          <div className="orbit-label" style={{ top: 'calc(50% - 83px)', left: '50%' }}>TEAM</div>
          <div className="orbit-label" style={{ top: 'calc(50% - 48px)', left: '50%' }}>IN-HOUSE</div>
          <div className="orbit-core">
            <div className="logo-3am">3AM</div>
            <div className="logo-sub">collective.</div>
          </div>
        </div>
      </section>

      <section id="oaths" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Oaths</p>
          <h2 className="section-title">These Oaths<br/>Are Our Bond.</h2>
        </div>
        <div className="oaths-layout stagger">
          <div className="oath-card">
            <h3>Oath of Collective Action.</h3>
            <p>We vow that our operations and vision are sustained not by leaders, but by the shared, rotating responsibility of every member. We are the crew, the curators, and the custodians of our own community. Our autonomy is built through mutual aid and trust.</p>
          </div>
          <div className="oath-card">
            <h3>Oath of Shared Purpose.</h3>
            <p>We vow to advance a unified mission above all. Our goals — the autonomy to act, the structure to decide, the mission that unites — form our foundation. Every action must serve our common aim. We build together, not in parallel.</p>
          </div>
          <div className="oath-card">
            <h3>Oath of Sovereign Space.</h3>
            <p>We vow that our operations and vision are sustained not by leaders, but by the shared, rotating responsibility of every member. We are the crew, the curators, and the custodians of our own community. Our autonomy is built through mutual aid and trust.</p>
          </div>
        </div>
      </section>

      <section id="nonneg" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Non-Negotiables</p>
          <h2 className="section-title">What We Will<br/>Never Tolerate.</h2>
          <div className="divider center"></div>
        </div>
        <div className="nonneg-items">
          <div className="nonneg-item reveal">
            <div className="nonneg-num">01</div>
            <div className="nonneg-head">
              <h3>We Avoid Transactional Networking.</h3>
              <span className="tag">Boundary</span>
            </div>
            <div className="nonneg-body">We are not a platform for opportunists seeking high-value connections or a stepping stone for personal career advancement. Our community is built on mutual aid, not mutual exploitation.</div>
          </div>
          <div className="nonneg-item reveal">
            <div className="nonneg-num">02</div>
            <div className="nonneg-head">
              <h3>We Reject Purely Commercial Interests.</h3>
              <span className="tag">Boundary</span>
            </div>
            <div className="nonneg-body">We vow to advance a unified mission above all. Our goals — the autonomy to act, the structure to decide, the mission that unites — form our foundation. Every action must serve our common aim. We build together, not in parallel.</div>
          </div>
          <div className="nonneg-item reveal">
            <div className="nonneg-num">03</div>
            <div className="nonneg-head">
              <h3>We Enforce Energetic & Philosophical Synergy.</h3>
              <span className="tag">Boundary</span>
            </div>
            <div className="nonneg-body">Alignment with our core values and mission is mandatory. If you cannot contribute to the collective spirit, collaborate in good faith, or respect our decentralized ethos, you will not find a home here. We protect our culture decisively.</div>
          </div>
        </div>
      </section>

      <section id="goals" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Goals</p>
          <h2 className="section-title">What We Are<br/>Building Toward.</h2>
        </div>
        <div className="goals-grid stagger">
          <div className="goal-card">
            <h3>Forge an Autonomous Structure.</h3>
            <p>To build a self-governing and self-sustaining ecosystem. Creating our own systems for funding, resources, and operations free from external control — enabling true creative and operational independence.</p>
          </div>
          <div className="goal-card">
            <h3>Practice De-centralized Governance.</h3>
            <p>To distribute power, responsibility, and decision-making to every member. Through tools like DAOs and principles like the advice-process, we ensure that leadership and direction emerge from the collective, not from a central hierarchy.</p>
          </div>
          <div className="goal-card">
            <h3>Advance a Unified Mission.</h3>
            <p>To align our diverse voices and projects under a single, powerful purpose. By codifying our shared vision in a living manifesto, we ensure that every action contributes to our common aim, giving our collective its direction and impact.</p>
          </div>
        </div>
      </section>

      <section id="fights" className="about-section">
        <div className="section-header reveal">
          <p className="section-label">The Three Fights</p>
          <h2 className="section-title">What We Are<br/>Fighting Against.</h2>
        </div>
        <div className="fights-layout">
          <div className="fight-item reveal">
            <div className="fight-label">
              <div className="num">01</div>
              <div className="type">The System</div>
            </div>
            <div className="fight-content">
              <h3>Artistic Integrity vs. Commercial System.</h3>
              <p>The artist's fundamental right is to unfiltered expression. The primary commercial system systematically violates this right, forcing compromises that prioritize market safety over artistic integrity, resulting in homogenized work.</p>
            </div>
          </div>
          <div className="fight-item reveal">
            <div className="fight-label">
              <div className="num">02</div>
              <div className="type">The Grind</div>
            </div>
            <div className="fight-content">
              <h3>Creator's Unseen War.</h3>
              <p>The creator's vision is besieged by a vicious cycle of financial constraints, costly collaboration, gatekeeping, and the grind of survival, which steals the very resources needed to develop ideas and practice the craft.</p>
            </div>
          </div>
          <div className="fight-item reveal">
            <div className="fight-label">
              <div className="num">03</div>
              <div className="type">The Act</div>
            </div>
            <div className="fight-content">
              <h3>Art as an Act of Endurance.</h3>
              <p>The filmmaker's true vision is an act of conscious, humane rebellion — to use storytelling to evolve humanity by questioning norms and upholding universal values. The ultimate act is to persist, transforming every constraint into the story's fabric, proving a humane idea can endure an inhumane process.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="manifesto" className="about-section">
        <div className="manifesto-bg"></div>
        <div className="section-header reveal">
          <p className="section-label">3AM Manifesto</p>
          <h2 className="section-title" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(60px,10vw,120px)', fontStyle: 'normal', letterSpacing: '0.05em' }}>3am manifesto.</h2>
        </div>
        <div className="manifesto-layout">
          <div className="manifesto-block reveal-left">
            <h3>The 3am Collective: A Declaration</h3>
            <p>We are the 3am Collective. We are filmmakers, artists, and thinkers who no longer wait for permission, funding, or a system that wasn't built for us. While the world sleeps, we are awake — building a new one.<br/><br/>Our project is the creation of a sovereign creative ecosystem: a decentralized, autonomous collective united by a single mission. This is not a group. It is a movement, a retaliation, and a blueprint for the future of creation.</p>
          </div>
          <div className="manifesto-block reveal-right">
            <h3>The 3am Collective: The Invitation</h3>
            <p>This is more than filmmaking. It is an exercise in consciousness and time. We break the constraints that limit our potential. We operate from a timeless state that fuels limitless creation.<br/><br/>Our ultimate goal is to solve the endless human problems that chain us — isolation, exploitation, creative suppression — by embodying a radical new principle: true reciprocity. The profound "give and take."<br/><br/>The structure is built. The synergies are alive. The oaths are sworn. This is how we fight. This is how we build.</p>
          </div>
        </div>
      </section>
    </>
  );
}