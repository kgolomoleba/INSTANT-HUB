import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <header className="hero" role="banner">
        <nav className="navbar" aria-label="Primary navigation">
          <div className="logo" tabIndex={0} aria-label="Instant Hub Logo">Instant Hub</div>
          <ul className="nav-links" role="menubar">
            <li role="none"><Link to="/" role="menuitem">Home</Link></li>
            <li role="none"><Link to="/login" role="menuitem">Login</Link></li>
            <li role="none"><Link to="/dashboard" role="menuitem">Dashboard</Link></li>
          </ul>
        </nav>
        <div className="hero-content">
          <h1 tabIndex={0}>Welcome to Instant Hub</h1>
          <p className="subtitle">
            Your AI-powered platform to discover, offer, and connect with products, services, and opportunities — all in one place.
          </p>
          <Link to="/signup" className="btn-primary" aria-label="Get Started with Instant Hub">Get Started</Link>
        </div>
      </header>

      <main role="main">
        <section className="features" aria-labelledby="features-title">
          <h2 id="features-title">Why Choose Instant Hub?</h2>
          <div className="feature-cards">
            <article className="card" tabIndex={0} aria-label="Discover Products and Services">
              <h3>Discover Products & Services</h3>
              <p>Explore a wide variety of trusted offerings near you.</p>
            </article>
            <article className="card" tabIndex={0} aria-label="Offer Your Skills and Goods">
              <h3>Offer Your Skills & Goods</h3>
              <p>Create listings for your talents, services, or products to connect with clients.</p>
            </article>
            <article className="card" tabIndex={0} aria-label="Earn and Network">
              <h3>Earn & Network</h3>
              <p>Turn your ideas into income and collaborate with a growing community.</p>
            </article>
          </div>
        </section>

        <section className="how-it-works" aria-labelledby="how-it-works-title">
          <h2 id="how-it-works-title">How It Works</h2>
          <div className="steps">
            <div className="step" tabIndex={0}>
              <strong>1. Sign Up</strong>
              <p>Create your free account and personalize your profile.</p>
            </div>
            <div className="step" tabIndex={0}>
              <strong>2. Explore & List</strong>
              <p>Find what you need or add your own products and services.</p>
            </div>
            <div className="step" tabIndex={0}>
              <strong>3. Connect & Grow</strong>
              <p>Chat, trade, or collaborate with other users directly.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <p>&copy; {new Date().getFullYear()} Instant Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
