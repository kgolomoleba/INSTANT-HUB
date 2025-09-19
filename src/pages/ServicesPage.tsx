import React from 'react'
import './ServicesPage.css'
import ServiceCard from '../components/ServiceCard'


const sampleServices = [
  {
    title: 'Brand Identity Design',
    description: 'Logo, colors, and style guide for startups and creators. Stand out online.',
    price: 150,
    provider: 'PixelPulse',
    location: 'Pretoria',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', // Design workspace
  },
  {
    title: 'TikTok Video Editing',
    description: 'Trendy edits, transitions, and effects for viral content. Fast turnaround.',
    price: 60,
    provider: 'EditGenie',
    location: 'Johannesburg',
    imageUrl: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80', // Video editing
  },
  {
    title: 'Drone Photography',
    description: 'Aerial shots for events, real estate, and travel. Modern perspective guaranteed.',
    price: 200,
    provider: 'SkySnap',
    location: 'Cape Town',
    imageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80', // Drone
  },
]

const ServicesPage: React.FC = () => {
  return (
    <main className="services-container">
      <header className="services-header">
        <h1>Services Marketplace</h1>
        <p>Find and offer services or skills within the community. Connect with local experts and grow your hustle!</p>
        <div className="services-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/add-service'}>Offer a Service</button>
          <button className="btn-secondary" onClick={() => window.location.href = '/products'}>Browse Products</button>
        </div>
      </header>
      <section className="services-list">
        {sampleServices.length > 0 ? (
          <div className="services-grid">
            {sampleServices.map((service, idx) => (
              <ServiceCard key={idx} {...service} />
            ))}
          </div>
        ) : (
          <p>No services available yet. Be the first to offer your skills!</p>
        )}
      </section>
      <aside className="services-info">
        <h2>How It Works</h2>
        <ul>
          <li>Offer your skills and connect with clients.</li>
          <li>Direct messaging and reviews coming soon!</li>
          <li>Grow your reputation in the community.</li>
        </ul>
        <h2>Popular Service Categories</h2>
        <div className="categories-list">
          <span className="category">Tutoring</span>
          <span className="category">Web Development</span>
          <span className="category">Photography</span>
          <span className="category">Design</span>
          <span className="category">Consulting</span>
        </div>
      </aside>
    </main>
  )
}

export default ServicesPage
