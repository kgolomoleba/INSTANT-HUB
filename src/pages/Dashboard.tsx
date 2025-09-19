
import { useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/auth-js'
import { supabase } from '../supabaseClient'
import './Dashboard.css'
import './ProductsPage.css'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const mainRef = useRef<HTMLElement>(null)

  // Fetch user and dashboard data
  const fetchUser = async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUser(user)
      // Fetch username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      if (profileError) throw profileError
      setUsername(profile?.username ?? null)

      // Fetch stats (mocked for now)
      setStats({
        products: Math.floor(Math.random() * 10),
        services: Math.floor(Math.random() * 8),
        posts: Math.floor(Math.random() * 12),
        profileComplete: Math.random() > 0.5 ? 'Yes' : 'No',
      })

      // Fetch recent activity (mocked)
      setRecent([
        { type: 'product', name: 'Logo Design', date: '2025-09-15' },
        { type: 'service', name: 'Tutoring', date: '2025-09-14' },
        { type: 'post', name: 'Shared a tip', date: '2025-09-13' },
      ])

      // Notifications (mocked)
      setNotifications([
        'Your product "Logo Design" received a new inquiry.',
        'Profile 80% complete. Add a bio to finish!',
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user.')
    } finally {
      setLoading(false)
      setTimeout(() => {
        mainRef.current?.focus()
      }, 100)
    }
  }

  useEffect(() => {
    fetchUser()
    // eslint-disable-next-line
  }, [])

  if (loading)
    return (
      <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
        <p className="loading-text">Loading your dashboard…</p>
      </main>
    )

  if (error)
    return (
      <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
        <p className="error-text">Error: {error}</p>
        <button className="btn-secondary" onClick={fetchUser} aria-label="Retry loading dashboard">
          Retry
        </button>
      </main>
    )

  return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
      <header className="dashboard-header">
        <h1>
          👋 Welcome back,{' '}
          <span className="accent-text">{username ? username : (user?.email ?? 'Guest')}</span>!
        </h1>
        <p>Here’s your personalized dashboard. Track your hustle, connect with the community, and discover new opportunities!</p>
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/products'}>Browse Products</button>
          <button className="btn-primary" onClick={() => window.location.href = '/services'}>Find Services</button>
          <button className="btn-primary" onClick={() => window.location.href = '/feed'}>Community Feed</button>
        </div>
      </header>

      {/* Profile Summary */}
      <section className="dashboard-profile-summary">
        <h2>Profile Summary</h2>
        <div className="profile-summary-grid">
          <div className="profile-avatar">
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${username || user?.email}`}
              alt="User avatar"
              width={60}
              height={60}
              style={{ borderRadius: '50%', marginBottom: '0.5rem' }}
            />
          </div>
          <ul>
            <li>Email: <strong>{user?.email}</strong></li>
            <li>Username: <strong>{username}</strong></li>
            <li>Profile Complete: <strong>{stats?.profileComplete}</strong></li>
          </ul>
        </div>
        <a href="/profile" className="btn-secondary">Edit Profile</a>
      </section>

      {/* User Stats */}
      <section className="dashboard-stats">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{stats?.products}</strong>
            <span>Products Listed</span>
            <span className="stat-icon">🛒</span>
          </div>
          <div className="stat-card">
            <strong>{stats?.services}</strong>
            <span>Services Offered</span>
            <span className="stat-icon">🤝</span>
          </div>
          <div className="stat-card">
            <strong>{stats?.posts}</strong>
            <span>Posts Shared</span>
            <span className="stat-icon">💬</span>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="dashboard-recent">
        <h2>Recent Activity</h2>
        <ul>
          {recent.map((item, idx) => (
            <li key={idx}>
              <span className={`recent-type recent-type-${item.type}`}>[{item.type}]</span> {item.name} <span className="recent-date">({item.date})</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Notifications */}
      <section className="dashboard-notifications">
        <h2>Notifications</h2>
        <ul>
          {notifications.length === 0 ? <li>No notifications.</li> : notifications.map((note, idx) => <li key={idx}>🔔 {note}</li>)}
        </ul>
      </section>

      {/* Tips / News */}
      <section className="dashboard-tips">
        <h2>Tips & News</h2>
        <ul>
          <li>💡 Tip: Complete your profile for better visibility!</li>
          <li>📰 News: New features coming soon. Stay tuned!</li>
          <li>🌟 Highlight: Top user this week is <strong>JaneDoe</strong>!</li>
        </ul>
      </section>

      {/* Community Highlights */}
      <section className="dashboard-community">
        <h2>Community Highlights</h2>
        <ul>
          <li>Top User: <strong>JaneDoe</strong> (25 products, 18 services)</li>
          <li>Trending Product: <strong>Logo Design</strong></li>
          <li>Trending Service: <strong>Tutoring</strong></li>
          <li>New Member: <strong>StartupGuy</strong></li>
        </ul>
      </section>

      {/* Useful Links & Widgets */}
      <section className="dashboard-widgets">
        <h2>Quick Links & Widgets</h2>
        <div className="widgets-grid">
          <button className="btn-primary" onClick={() => (window.location.href = '/products')} aria-label="Browse Products">🛒 Browse Products</button>
          <button className="btn-primary" onClick={() => (window.location.href = '/services')} aria-label="Find Services">🤝 Find Services</button>
          <button className="btn-primary" onClick={() => (window.location.href = '/feed')} aria-label="Community Feed">💬 Community Feed</button>
          <button className="btn-primary" onClick={() => (window.location.href = '/profile')} aria-label="Profile">👤 Profile</button>
          <button className="btn-primary" onClick={() => (window.location.href = '/register')} aria-label="Register">📝 Register</button>
        </div>
        <div className="dashboard-widget-row" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem', justifyContent: 'center' }}>
          <div className="widget-card" style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #2563eb22', padding: '1.5rem', minWidth: '220px', maxWidth: '260px', textAlign: 'center' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: '0.5rem' }}>Earnings</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>$1,250</p>
            <span style={{ color: '#64748b', fontSize: '0.95rem' }}>This month</span>
          </div>
          <div className="widget-card" style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #2563eb22', padding: '1.5rem', minWidth: '220px', maxWidth: '260px', textAlign: 'center' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: '0.5rem' }}>Profile Views</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>2,340</p>
            <span style={{ color: '#64748b', fontSize: '0.95rem' }}>This month</span>
          </div>
          <div className="widget-card" style={{ background: '#fff', borderRadius: '1.5rem', boxShadow: '0 4px 24px #2563eb22', padding: '1.5rem', minWidth: '220px', maxWidth: '260px', textAlign: 'center' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: '0.5rem' }}>Community Rank</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>#7</p>
            <span style={{ color: '#64748b', fontSize: '0.95rem' }}>This week</span>
          </div>
        </div>
      </section>
    </main>
  )
}
