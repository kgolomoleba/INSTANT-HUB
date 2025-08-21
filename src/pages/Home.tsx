import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-wrapper">
      <header className="hero" role="banner">
        <div className="hero-text">
          <h1 tabIndex={0}>Welcome to Instant Hub</h1>
          <p className="subtitle">
            AI-powered platform to discover, offer, and connect with products, services, and opportunities — all in one place.
          </p>
          <Link to="/signup" className="btn-primary" aria-label="Get Started with Instant Hub">
            Get Started
          </Link>
        </div>
        <div className="hero-image-wrapper" aria-hidden="true">
          <img
            src="https://undraw.co/api/illustrations/undraw_online_shopping.svg"
            alt="Online shopping illustration"
            className="hero-image"
          />
        </div>
      </header>

      <main role="main">
        <section className="about" aria-labelledby="about-title">
          <h2 id="about-title">Our Mission & Vision</h2>
          <p>
            Instant Hub is an innovative, AI-powered platform designed to revolutionize the way people buy, sell, and connect through services and products—all in one seamless space.
            In today’s fast-paced and competitive world, many talented individuals and small business owners struggle to find effective ways to reach clients or customers, while consumers often face challenges locating trustworthy, affordable, and convenient solutions.
            Instant Hub addresses these challenges by providing a centralized marketplace where users can not only sell their products or services but also request services or post their needs openly to the community.
            This platform aims to empower users by creating economic opportunities, reducing unemployment, and fostering a supportive environment that encourages skill-sharing and entrepreneurship.
            By leveraging AI technology, Instant Hub enhances user experience through smart matchmaking between service providers and seekers, making transactions smoother and more efficient.
            Ultimately, Instant Hub is more than just a marketplace—it’s a catalyst for economic growth, social empowerment, and community-building.
          </p>
        </section>

        <section className="features" aria-labelledby="features-title">
          <h2 id="features-title">Why Choose Instant Hub?</h2>
          <div className="feature-cards">
            <article className="feature-card" tabIndex={0} aria-label="Discover Products and Services">
              <img
                src="https://img.icons8.com/ios-filled/64/3f83f8/search--v1.png"
                alt=""
                className="feature-icon"
                aria-hidden="true"
              />
              <h3>Discover Products & Services</h3>
              <p>Explore a wide variety of trusted offerings near you.</p>
            </article>

            <article className="feature-card" tabIndex={0} aria-label="Offer Your Skills and Goods">
              <img
                src="https://img.icons8.com/ios-filled/64/3f83f8/sell-stock.png"
                alt=""
                className="feature-icon"
                aria-hidden="true"
              />
              <h3>Offer Your Skills & Goods</h3>
              <p>Create listings for your talents, services, or products to connect with clients.</p>
            </article>

            <article className="feature-card" tabIndex={0} aria-label="Earn and Network">
              <img
                src="https://img.icons8.com/ios-filled/64/3f83f8/handshake.png"
                alt=""
                className="feature-icon"
                aria-hidden="true"
              />
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
