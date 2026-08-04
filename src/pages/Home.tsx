import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home-wrapper">

      {/* HERO */}
      <section className="hero" role="banner">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-dot" aria-hidden="true" />
            Verified · Local · African
          </div>

          <h1 className="hero-title">
            WHERE <span className="hero-gold">AFRICAN</span><br />
            BUSINESS<br />
            HAPPENS
          </h1>

          <p className="hero-sub">Verified trade, local sourcing and trusted business relationships</p>

          <p className="hero-desc">
            One platform for <strong>buyers, sellers, suppliers, contractors,
            entrepreneurs and investors</strong>, built to make business across Africa easier and more reliable.
          </p>
          <p className="hero-desc">
            The marketplace is for fee-based products and services. Hiring, work requests and talent sourcing are handled in the Community Feed.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn-hero">Create Free Account</Link>
            <Link to="/products" className="btn-hero-outline">Explore Marketplace</Link>
          </div>

          <div className="hero-preview" aria-label="Platform highlights">
            <div className="preview-card">
              <div className="preview-top">
                <span className="preview-chip">Live network</span>
                <span className="preview-pill">Verified • Fast</span>
              </div>
              <div className="preview-list">
                <div className="preview-item">
                  <span className="preview-bullet" />
                  <span>Discover trusted products, services, and talent</span>
                </div>
                <div className="preview-item">
                  <span className="preview-bullet" />
                  <span>Connect with verified business partners in minutes</span>
                </div>
                <div className="preview-item">
                  <span className="preview-bullet" />
                  <span>Launch deals and grow with one modern hub</span>
                </div>
              </div>
            </div>
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
        </div>
      </section>

      {/* WHO WE CONNECT */}
      <section className="ecosystem-section" id="ecosystem" aria-labelledby="ecosystem-title">
        <span className="section-label">The Ecosystem</span>
        <h2 id="ecosystem-title" className="section-title">WHO WE CONNECT</h2>
        <p className="section-desc">Every role in African commerce on one verified business network.</p>

        <div className="roles-grid">
          {[
            { name: 'Buyers', desc: 'Find verified products and services', icon: '01' },
            { name: 'Sellers', desc: 'Reach the right customers', icon: '02' },
            { name: 'Suppliers', desc: 'Connect with businesses at scale', icon: '03' },
            { name: 'Manufacturers', desc: 'Showcase capacity and output', icon: '04' },
            { name: 'Workers', desc: 'Skilled and semi-skilled talent', icon: '05' },
            { name: 'HR Pros', desc: 'Source verified candidates', icon: '06' },
            { name: 'Entrepreneurs', desc: 'Build, launch, and grow', icon: '07' },
            { name: 'Investors', desc: 'Discover fundable businesses', icon: '08' },
          ].map((role) => (
            <div className="role-card" key={role.name}>
              <span className="role-icon">{role.icon}</span>
              <span className="role-name">{role.name}</span>
              <span className="role-desc">{role.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEMS WE SOLVE */}
      <section className="problems-section" aria-labelledby="problems-title">
        <span className="section-label">Why Instant Hub</span>
        <h2 id="problems-title" className="section-title">PROBLEMS WE SOLVE</h2>
        <p className="section-desc">The issues holding back real commerce and how our marketplace solves them.</p>

        <div className="problems-grid">
          <div className="problem-card">
            <span className="problem-num" aria-hidden="true">01</span>
            <h3 className="problem-title">Invisibility</h3>
            <p className="problem-desc">Many businesses struggle to be seen by the right buyers, suppliers, and partners. We make every listing searchable and easier to discover.</p>
            <span className="problem-tag">Improved discovery</span>
          </div>
          <div className="problem-card">
            <span className="problem-num" aria-hidden="true">02</span>
            <h3 className="problem-title">Unverified partners</h3>
            <p className="problem-desc">It is hard to trust suppliers, contractors and buyers without a verified business identity. Instant Hub gives every listing and profile a trust signal.</p>
            <span className="problem-tag">Verified profiles</span>
          </div>
          <div className="problem-card">
            <span className="problem-num" aria-hidden="true">03</span>
            <h3 className="problem-title">Fragmentation</h3>
            <p className="problem-desc">Sourcing, listing and hiring are spread across too many disconnected platforms. Instant Hub brings them together in one secure business network.</p>
            <span className="problem-tag">One business network</span>
          </div>
        </div>
      </section>

      {/* CURRENT SERVICES */}
      <section className="services-section" id="services" aria-labelledby="services-title">
        <span className="section-label">The Bootstrap</span>
        <h2 id="services-title" className="section-title">CURRENT SERVICES</h2>
        <p className="section-desc">Real services from sellers, contractors, and business operators you can hire, book or collaborate with today.</p>

        <div className="services-grid" id="features">
          {[
            { name: 'Auto Care', desc: 'Mobile car washing and detailing', status: 'Running', cls: 'status-running' },
            { name: 'Procurement', desc: 'Connecting products and services for a fee', status: 'Running', cls: 'status-running' },
            { name: 'Hygienic Services', desc: 'Commercial and residential cleaning', status: 'Launching', cls: 'status-launching' },
            { name: 'The App', desc: 'First version of the ecosystem platform', status: 'In Dev', cls: 'status-dev' },
            { name: 'Automation', desc: 'Business automation for African SMEs', status: 'Coming Soon', cls: 'status-soon' },
          ].map((s) => (
            <div className="service-item" key={s.name}>
              <span className={`service-status ${s.cls}`}>{s.status}</span>
              <span className="service-name">{s.name}</span>
              <span className="service-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" aria-labelledby="how-title">
        <span className="section-label">Simple Process</span>
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
            <p>Our network connects you with the right buyers, suppliers and partners so your business can scale.</p>
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
          Join free and start listing products, booking services, or sourcing trusted suppliers. <strong>No credit card required.</strong>
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn-hero">Create Your Account</Link>
          <Link to="/products" className="btn-hero-outline">Browse Marketplace</Link>
        </div>
      </section>

    </div>
  )
}