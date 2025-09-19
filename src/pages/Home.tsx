import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  return (
    <div className="home-wrapper">
      <header className="hero" role="banner" style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
        <div className="hero-text" style={{ flex: '1 1 350px', minWidth: '320px' }}>
          <h1 tabIndex={0} style={{ fontWeight: 900, fontSize: '3.2rem', color: '#00b8c4', marginBottom: '1.2rem', letterSpacing: '0.04em' }}>Welcome to Instant Hub</h1>
          <p className="subtitle" style={{ fontSize: '1.35rem', color: '#2b3138', marginBottom: '2rem', fontWeight: 500 }}>
            Discover, offer, and connect with products, services, and opportunities — all in one vibrant community.
          </p>
          <Link
            to="/signup"
            className="btn-primary"
            aria-label="Get Started with Instant Hub"
            style={{ fontSize: '1.2rem', padding: '1rem 2.5rem', borderRadius: '2rem', fontWeight: 700 }}
          >
            Get Started
          </Link>
        </div>
        <div className="hero-image-collage" style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', flex: '1 1 400px', minWidth: '320px' }}>
          <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80" alt="Backpack product" style={{ borderRadius: '1.5rem', width: '180px', height: '120px', objectFit: 'cover', boxShadow: '0 4px 18px #00b8c488' }} />
          <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" alt="Lamp product" style={{ borderRadius: '1.5rem', width: '120px', height: '120px', objectFit: 'cover', boxShadow: '0 4px 18px #00b8c488' }} />
          <img src="https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80" alt="Video editing service" style={{ borderRadius: '1.5rem', width: '120px', height: '180px', objectFit: 'cover', boxShadow: '0 4px 18px #00b8c488' }} />
          <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Drone product" style={{ borderRadius: '1.5rem', width: '180px', height: '120px', objectFit: 'cover', boxShadow: '0 4px 18px #00b8c488' }} />
        </div>
      </header>

      <main role="main">
        <section className="about" aria-labelledby="about-title">
          <h2 id="about-title">Our Mission & Vision</h2>
          <p>
            Instant Hub is an innovative, AI-powered platform designed to
            revolutionize the way people buy, sell, and connect through services
            and products—all in one seamless space. In today’s fast-paced and
            competitive world, many talented individuals and small business
            owners struggle to find effective ways to reach clients or
            customers, while consumers often face challenges locating
            trustworthy, affordable, and convenient solutions. Instant Hub
            addresses these challenges by providing a centralized marketplace
            where users can not only sell their products or services but also
            request services or post their needs openly to the community. This
            platform aims to empower users by creating economic opportunities,
            reducing unemployment, and fostering a supportive environment that
            encourages skill-sharing and entrepreneurship. By leveraging AI
            technology, Instant Hub enhances user experience through smart
            matchmaking between service providers and seekers, making
            transactions smoother and more efficient. Ultimately, Instant Hub is
            more than just a marketplace—it’s a catalyst for economic growth,
            social empowerment, and community-building.
          </p>
        </section>

        <section className="features" aria-labelledby="features-title">
          <h2 id="features-title">Why Choose Instant Hub?</h2>
          <div className="feature-cards" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
            <article
              className="feature-card"
              tabIndex={0}
              aria-label="Discover Products and Services"
              style={{ background: 'linear-gradient(135deg, #e0f7fa 60%, #fff 100%)', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '2rem 1.5rem', minWidth: '260px', maxWidth: '320px', textAlign: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            >
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
                alt="Browsing products"
                className="feature-icon"
                aria-hidden="true"
                style={{ borderRadius: '1rem', objectFit: 'cover', maxHeight: '80px', marginBottom: '1rem', boxShadow: '0 2px 12px #00b8c488' }}
              />
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#00b8c4', marginBottom: '0.7rem' }}>Discover Products & Services</h3>
              <p style={{ color: '#2b3138', fontSize: '1.05rem', fontWeight: 500 }}>Explore a wide variety of trusted offerings near you.</p>
            </article>

            <article
              className="feature-card"
              tabIndex={0}
              aria-label="Offer Your Skills and Goods"
              style={{ background: 'linear-gradient(135deg, #e0f7fa 60%, #fff 100%)', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '2rem 1.5rem', minWidth: '260px', maxWidth: '320px', textAlign: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            >
              <img
                src="https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80"
                alt="Offering services"
                className="feature-icon"
                aria-hidden="true"
                style={{ borderRadius: '1rem', objectFit: 'cover', maxHeight: '80px', marginBottom: '1rem', boxShadow: '0 2px 12px #00b8c488' }}
              />
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#00b8c4', marginBottom: '0.7rem' }}>Offer Your Skills & Goods</h3>
              <p style={{ color: '#2b3138', fontSize: '1.05rem', fontWeight: 500 }}>
                Create listings for your talents, services, or products to connect with clients.
              </p>
            </article>

            <article
              className="feature-card"
              tabIndex={0}
              aria-label="Earn and Network"
              style={{ background: 'linear-gradient(135deg, #e0f7fa 60%, #fff 100%)', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '2rem 1.5rem', minWidth: '260px', maxWidth: '320px', textAlign: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            >
              <img
                src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80"
                alt="Networking and earning"
                className="feature-icon"
                aria-hidden="true"
                style={{ borderRadius: '1rem', objectFit: 'cover', maxHeight: '80px', marginBottom: '1rem', boxShadow: '0 2px 12px #00b8c488' }}
              />
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#00b8c4', marginBottom: '0.7rem' }}>Earn & Network</h3>
              <p style={{ color: '#2b3138', fontSize: '1.05rem', fontWeight: 500 }}>
                Turn your ideas into income and collaborate with a growing community.
              </p>
            </article>
          </div>
        </section>
        <section className="trending-highlights" aria-labelledby="trending-title" style={{ margin: '4rem 0 2rem 0' }}>
          <h2 id="trending-title" style={{ fontWeight: 900, fontSize: '2.2rem', color: '#00b8c4', marginBottom: '2rem', textAlign: 'center' }}>Trending Now</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '1.5rem', minWidth: '220px', maxWidth: '260px', textAlign: 'center' }}>
              <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80" alt="Minimalist Backpack" style={{ borderRadius: '1rem', width: '100%', height: '120px', objectFit: 'cover', marginBottom: '1rem' }} />
              <h3 style={{ fontWeight: 700, color: '#00b8c4', marginBottom: '0.5rem' }}>Minimalist Backpack</h3>
              <p style={{ color: '#2b3138', fontSize: '1rem' }}>Urban style, modern function. Trending in Products.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '1.5rem', minWidth: '220px', maxWidth: '260px', textAlign: 'center' }}>
              <img src="https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80" alt="TikTok Edits" style={{ borderRadius: '1rem', width: '100%', height: '120px', objectFit: 'cover', marginBottom: '1rem' }} />
              <h3 style={{ fontWeight: 700, color: '#00b8c4', marginBottom: '0.5rem' }}>TikTok Edits</h3>
              <p style={{ color: '#2b3138', fontSize: '1rem' }}>Trendy video edits for creators. Trending in Services.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '1.5rem', minWidth: '220px', maxWidth: '260px', textAlign: 'center' }}>
              <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80" alt="Drone Photography" style={{ borderRadius: '1rem', width: '100%', height: '120px', objectFit: 'cover', marginBottom: '1rem' }} />
              <h3 style={{ fontWeight: 700, color: '#00b8c4', marginBottom: '0.5rem' }}>Drone Photography</h3>
              <p style={{ color: '#2b3138', fontSize: '1rem' }}>Aerial shots for events. Trending in Community.</p>
            </div>
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

      <section className="testimonials" aria-labelledby="testimonials-title" style={{ margin: '4rem 0 2rem 0' }}>
        <h2 id="testimonials-title" style={{ fontWeight: 900, fontSize: '2rem', color: '#00b8c4', marginBottom: '2rem', textAlign: 'center' }}>What Our Users Say</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <blockquote style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '2rem', maxWidth: '340px', textAlign: 'center', fontStyle: 'italic' }}>
            <img src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=400&q=80" alt="Smiling man" style={{ borderRadius: '50%', width: '56px', height: '56px', marginBottom: '1rem' }} />
            <p>“Instant Hub helped me launch my freelance business and connect with amazing clients!”</p>
            <footer style={{ marginTop: '1rem', fontWeight: 700, color: '#00b8c4' }}>Alex, Video Editor</footer>
          </blockquote>
          <blockquote style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '2rem', maxWidth: '340px', textAlign: 'center', fontStyle: 'italic' }}>
            <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" alt="Smiling woman" style={{ borderRadius: '50%', width: '56px', height: '56px', marginBottom: '1rem' }} />
            <p>“I found the perfect drone photographer for my event. The community is so supportive!”</p>
            <footer style={{ marginTop: '1rem', fontWeight: 700, color: '#00b8c4' }}>Maria, Event Organizer</footer>
          </blockquote>
          <blockquote style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #00b8c422', padding: '2rem', maxWidth: '340px', textAlign: 'center', fontStyle: 'italic' }}>
            <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80" alt="Laughing friends" style={{ borderRadius: '50%', width: '56px', height: '56px', marginBottom: '1rem' }} />
            <p>“The marketplace is full of opportunities. I’ve sold products and hired talented people!”</p>
            <footer style={{ marginTop: '1rem', fontWeight: 700, color: '#00b8c4' }}>Sam, Entrepreneur</footer>
          </blockquote>
        </div>
      </section>

      <section className="partners" aria-labelledby="partners-title" style={{ margin: '4rem 0 2rem 0' }}>
        <h2 id="partners-title" style={{ fontWeight: 900, fontSize: '2rem', color: '#00b8c4', marginBottom: '2rem', textAlign: 'center' }}>Trusted By</h2>
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" style={{ height: '48px', opacity: 0.7 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/47/React.svg" alt="React alt" style={{ height: '48px', opacity: 0.7 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/64/Expressjs.png" alt="Express" style={{ height: '48px', opacity: 0.7 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Supabase_logo.png" alt="Supabase" style={{ height: '48px', opacity: 0.7 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="JavaScript" style={{ height: '48px', opacity: 0.7 }} />
        </div>
      </section>

      <section className="cta-banner" aria-labelledby="cta-title" style={{ margin: '4rem 0 2rem 0', background: 'linear-gradient(90deg, #00b8c4 0%, #61f8ff 100%)', borderRadius: '2rem', boxShadow: '0 4px 24px #00b8c488', padding: '2.5rem', textAlign: 'center' }}>
        <h2 id="cta-title" style={{ fontWeight: 900, fontSize: '2.2rem', color: '#fff', marginBottom: '1.2rem' }}>Ready to join the future of community marketplaces?</h2>
        <Link to="/signup" className="btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2.5rem', borderRadius: '2rem', fontWeight: 700, background: '#fff', color: '#00b8c4', boxShadow: '0 2px 12px #00b8c488' }}>Get Started</Link>
      </section>

      <footer className="footer" role="contentinfo">
        <p>
          &copy; {new Date().getFullYear()} Instant Hub. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
