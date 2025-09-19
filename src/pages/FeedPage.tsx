import React from 'react'
import './FeedPage.css'
import FeedPost from '../components/FeedPost'
import type { FeedPostProps } from '../components/FeedPost'


const samplePosts: FeedPostProps[] = [
  {
    type: "product",
    title: "Minimalist Backpack Launch!",
    description: "Just dropped a new line of waterproof backpacks. Urban style, modern function.",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80", // Backpack
    price: "$95",
    author: "UrbanNomad",
    createdAt: "Sep 18, 2025",
  },
  {
    type: "service",
    title: "TikTok Edits for Creators",
    description: "Offering trendy video edits and transitions for your next viral hit!",
    image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80", // Video editing
    price: "$60/edit",
    author: "EditGenie",
    createdAt: "Sep 17, 2025",
  },
  {
    type: "request",
    title: "Need Drone Shots for Event",
    description: "Looking for someone to capture aerial photos at my launch party.",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80", // Drone
    author: "EventHost",
    createdAt: "Sep 16, 2025",
  },
]

const FeedPage: React.FC = () => {
  return (
    <main className="feed-container">
      <header className="feed-header">
        <h1>Community Feed</h1>
        <p>
          Share your hustle, ask for advice, promote your products and services, or help others in the community!
        </p>
        <div className="feed-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/add-post'}>Create Post</button>
          <button className="btn-secondary" onClick={() => window.location.href = '/products'}>Browse Products</button>
          <button className="btn-secondary" onClick={() => window.location.href = '/services'}>Find Services</button>
        </div>
      </header>
      <section className="feed-posts">
        {samplePosts.length > 0 ? (
          <div className="feed-grid">
            {samplePosts.map((post, idx) => (
              <FeedPost key={idx} {...post} />
            ))}
          </div>
        ) : (
          <p>No posts yet. Be the first to share something with the community!</p>
        )}
      </section>
      <aside className="feed-info">
        <h2>How to Use the Feed</h2>
        <ul>
          <li>Share your products, services, or requests for help.</li>
          <li>Connect with other community members via messaging.</li>
          <li>Support and grow together!</li>
        </ul>
        <h2>Community Highlights</h2>
        <div className="highlights-list">
          <span className="highlight">Most Active: JaneDoe</span>
          <span className="highlight">Trending: Handmade Mug</span>
          <span className="highlight">New Service: Math Tutoring</span>
        </div>
      </aside>
    </main>
  )
}

export default FeedPage
