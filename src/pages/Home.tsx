import { Link } from 'react-router-dom'
import './Home.css'

const FEATURES = [
  { title: 'A marketplace for local trade', text: 'List products and services, search by category, and let buyers send you an inquiry in one tap.', tone: 'wide' },
  { title: 'Verified businesses', text: 'Submit proof of your business and earn a badge that buyers can see on every listing.', tone: '' },
  { title: 'Financial health you can share', text: 'Track money in and out each month. Give a funder a private link to a clear health report, choose what it shows, and switch it off any time.', tone: 'wide accent' },
  { title: 'Community feed', text: 'Post a job, ask for help or offer a deal to people nearby.', tone: '' },
  { title: 'One inbox for inquiries', text: 'Every message lands on your dashboard, with unread counts and replies tracked.', tone: '' },
  { title: 'Made for your phone', text: 'Add it to your home screen. Pages you have opened still work without signal.', tone: '' },
]

const ROLES = ['Buyers', 'Sellers', 'Suppliers', 'Manufacturers', 'Skilled workers', 'HR professionals', 'Entrepreneurs', 'Investors and funders']

const STEPS = [
  { title: 'Create a free account', text: 'Add your business, role and location so people know who you are.' },
  { title: 'List what you offer', text: 'Publish products or services, and submit proof to get a verified badge.' },
  { title: 'Grow with confidence', text: 'Answer inquiries, track your finances and share your progress with funders.' },
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero" role="banner">
        <div className="hero-copy">
          <span className="hero-pill">
            <span aria-hidden="true" className="hero-dot" /> For South African small business
          </span>
          <h1>Sell, find and fund small business in one place.</h1>
          <p className="hero-sub">
            Instant Hub connects buyers, sellers, suppliers and funders. List what you offer, get inquiries, and show the people who back you how your business is really doing.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn-primary big">Create free account</Link>
            <Link to="/login" className="btn-secondary big">Log in</Link>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <span className="art-label">Example</span>
          <div className="art-card art-listing">
            <div className="art-img">O</div>
            <div>
              <b>Organic butternut, 10 kg bag</b>
              <span className="art-price">R120.00</span>
              <span className="art-meta">Paarl · <em>Verified</em></span>
            </div>
          </div>
          <div className="art-card art-health">
            <span className="art-health-title">🟢 Financial health: Healthy</span>
            <span>Profitable in 6 of 7 months</span>
            <div className="art-bars">
              {[40, 55, 48, 66, 72, 88, 80].map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="art-card art-inquiry">
            <span className="art-avatar">S</span>
            <div>
              <b>New inquiry</b>
              <span>Can you deliver 5 bags on Friday?</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="home-section" aria-labelledby="features-title">
        <h2 id="features-title">Everything a small business needs to be trusted</h2>
        <div className="bento">
          {FEATURES.map((f) => (
            <article key={f.title} className={`bento-tile ${f.tone}`}>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="who" className="home-section" aria-labelledby="who-title">
        <h2 id="who-title">Built for everyone in the deal</h2>
        <div className="chip-cloud">
          {ROLES.map((r) => (
            <span key={r} className="chip">{r}</span>
          ))}
        </div>
      </section>

      <section id="how" className="home-section" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="step-dot">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-cta" aria-labelledby="cta-title">
        <h2 id="cta-title">Start with a free account</h2>
        <p>It takes a minute. List your first product or service today.</p>
        <Link to="/register" className="btn-primary big">Create free account</Link>
      </section>
    </div>
  )
}
