import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home-wrapper">

      {/* HERO */}
      <section className="hero" role="banner">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-badge">
          <span className="hero-dot" aria-hidden="true" />
          AI-Powered · Verified · African
        </div>

        <h1 className="hero-title">
          WHERE <span className="hero-gold">AFRICAN</span><br />
          BUSINESS<br />
          HAPPENS
        </h1>

        <p className="hero-sub">Verified · Connected · Powered by AI</p>

        <p className="hero-desc">
          One platform for <strong>buyers, sellers, suppliers, workers,
          entrepreneurs and investors</strong> — biometrically verified,
          AI-matched, built for Africa.
        </p>

        <div className="hero-cta">
          <Link to="/register" className="btn-hero">Get Started Free</Link>
          <Link to="/products" className="btn-hero-outline">Explore Marketplace</Link>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="stat-num">9+</span>
            <span className="stat-label">User Roles</span>
          </div>
          <div className="stat-divider" aria-hidden="true" />
          <div className="hero-stat">
            <span className="stat-num">1</span>
            <span className="stat-label">Platform</span>
          </div>
          <div className="stat-divider" aria-hidden="true" />
          <div className="hero-stat">
            <span className="stat-num">∞</span>
            <span className="stat-label">Opportunities</span>
          </div>
          <div className="stat-divider" aria-hidden="true" />
          <div className="hero-stat">
            <span className="stat-num">ZA</span>
            <span className="stat-label">Starting Here</span>
          </div>
        </div>
      </section>

      {/* WHO WE CONNECT */}
      <section className="ecosystem-section" id="ecosystem" aria-labelledby="ecosystem-title">
        <span className="section-label">⚡ The Ecosystem</span>
        <h2 id="ecosystem-title" className="section-title">WHO WE CONNECT</h2>
        <p className="section-desc">Every role in African commerce — on one verified platform.</p>

        <div className="roles-grid">
          {[
            { icon: '🛒', name: 'Buyers', desc: 'Find verified products & services' },
            { icon: '🏪', name: 'Sellers', desc: 'Reach the right customers' },
            { icon: '🏭', name: 'Suppliers', desc: 'Connect with businesses at scale' },
            { icon: '⚙️', name: 'Manufacturers', desc: 'Showcase capacity & output' },
            { icon: '🔧', name: 'Workers', desc: 'Skilled & semi-skilled talent' },
            { icon: '👥', name: 'HR Pros', desc: 'Source verified candidates' },
            { icon: '🚀', name: 'Entrepreneurs', desc: 'Build, launch, and grow' },
            { icon: '💰', name: 'Investors', desc: 'Discover fundable businesses' },
          ].map((role) => (
            <div className="role-card" key={role.name}>
              <span className="role-icon" aria-hidden="true">{role.icon}</span>
              <span className="role-name">{role.name}</span>
              <span className="role-desc">{role.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEMS WE SOLVE */}
      <section className="problems-section" aria-labelledby="problems-title">
        <span className="section-label">⚡ Why Instant Hub</span>
        <h2 id="problems-title" className="section-title">PROBLEMS WE SOLVE</h2>
        <p className="section-desc">The three things holding African business back — and how we fix them.</p>

        <div className="problems-grid">
          <div className="problem-card">
            <span className="problem-num" aria-hidden="true">01</span>
            <h3 className="problem-title">Invisibility</h3>
            <p className="problem-desc">African SMEs can't be found by the right buyers and investors. We make businesses discoverable, searchable, and reachable.</p>
            <span className="problem-tag">→ AI Matchmaking</span>
          </div>
          <div className="problem-card">
            <span className="problem-num" aria-hidden="true">02</span>
            <h3 className="problem-title">Distrust</h3>
            <p className="problem-desc">No verification system to confirm who businesses really are. We use biometric verification so every profile is trusted.</p>
            <span className="problem-tag">→ Verified Profiles</span>
          </div>
          <div className="problem-card">
            <span className="problem-num" aria-hidden="true">03</span>
            <h3 className="problem-title">Fragmentation</h3>
            <p className="problem-desc">Commerce is scattered across too many disconnected platforms. Instant Hub brings it all into one secure ecosystem.</p>
            <span className="problem-tag">→ One Platform</span>
          </div>
        </div>
      </section>

      {/* CURRENT SERVICES */}
      <section className="services-section" id="services" aria-labelledby="services-title">
        <span className="section-label">⚡ The Bootstrap</span>
        <h2 id="services-title" className="section-title">CURRENT SERVICES</h2>
        <p className="section-desc">Building the empire — one service at a time.</p>

        <div className="services-grid" id="features">
          {[
            { icon: '🚗', name: 'Auto Care', desc: 'Mobile car washing & detailing', status: 'Running', cls: 'status-running' },
            { icon: '🤝', name: 'Procurement', desc: 'Connecting products & services for a fee', status: 'Running', cls: 'status-running' },
            { icon: '🧹', name: 'Hygienic Services', desc: 'Commercial & residential cleaning', status: 'Launching', cls: 'status-launching' },
            { icon: '📱', name: 'The App', desc: 'First version of the ecosystem platform', status: 'In Dev', cls: 'status-dev' },
            { icon: '⚙️', name: 'Automation', desc: 'Business automation for African SMEs', status: 'Coming Soon', cls: 'status-soon' },
          ].map((s) => (
            <div className="service-item" key={s.name}>
              <span className={`service-status ${s.cls}`}>{s.status}</span>
              <span className="service-icon" aria-hidden="true">{s.icon}</span>
              <span className="service-name">{s.name}</span>
              <span className="service-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" aria-labelledby="how-title">
        <span className="section-label">⚡ Simple Process</span>
        <h2 id="how-title" className="section-title">HOW IT WORKS</h2>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">01</span>
            <h3>Sign Up</h3>
            <p>Create your free verified account and personalize your profile.</p>
          </div>
          <div className="step-card">
            <span className="step-num">02</span>
            <h3>List or Explore</h3>
            <p>Post your products, offer your skills, or browse the marketplace.</p>
          </div>
          <div className="step-card">
            <span className="step-num">03</span>
            <h3>Connect & Grow</h3>
            <p>AI matches you with the right people. Build, sell, and scale.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-glow" aria-hidden="true" />
        <h2 id="cta-title" className="cta-title">
          READY TO JOIN<br />THE <span className="hero-gold">ECOSYSTEM?</span>
        </h2>
        <p className="cta-desc">
          Start for free. <strong>No credit card required.</strong><br />
          Join the platform building the future of African commerce.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn-hero">Create Your Account</Link>
          <Link to="/products" className="btn-hero-outline">Browse Marketplace</Link>
        </div>
      </section>

    </div>
  )
}