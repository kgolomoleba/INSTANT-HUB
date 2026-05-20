import { useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/auth-js'
import { supabase } from '../supabaseClient'
import './Dashboard.css'

interface Stats {
  products: number
  services: number
  posts: number
}

interface RecentItem {
  type: 'product' | 'service' | 'post'
  name: string
  date: string
}

interface Profile {
  username: string
  bio: string
  role: string
  location: string
}

const ROLE_LABELS: Record<string, string> = {
  buyer: '🛒 Buyer',
  seller: '🏪 Seller',
  supplier: '🏭 Supplier',
  manufacturer: '⚙️ Manufacturer',
  worker: '🔧 Worker',
  hr: '👥 HR Professional',
  entrepreneur: '🚀 Entrepreneur',
  investor: '💰 Investor',
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ products: 0, services: 0, posts: 0 })
  const [recent, setRecent] = useState<RecentItem[]>([])
  const mainRef = useRef<HTMLElement>(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { window.location.href = '/login'; return }
      setUser(user)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, bio, role, location')
        .eq('id', user.id)
        .single()
      setProfile(profileData ?? null)

      // Fetch real stats in parallel
      const [
        { count: productCount },
        { count: serviceCount },
        { count: postCount },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      setStats({
        products: productCount ?? 0,
        services: serviceCount ?? 0,
        posts: postCount ?? 0,
      })

      // Fetch real recent activity
      const [
        { data: recentProducts },
        { data: recentServices },
        { data: recentPosts },
      ] = await Promise.all([
        supabase.from('products').select('title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
        supabase.from('services').select('title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
        supabase.from('posts').select('title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
      ])

      const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

      const allRecent: RecentItem[] = [
        ...(recentProducts ?? []).map(p => ({ type: 'product' as const, name: p.title, date: formatDate(p.created_at) })),
        ...(recentServices ?? []).map(s => ({ type: 'service' as const, name: s.title, date: formatDate(s.created_at) })),
        ...(recentPosts ?? []).map(p => ({ type: 'post' as const, name: p.title, date: formatDate(p.created_at) })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      setRecent(allRecent)

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
      setTimeout(() => mainRef.current?.focus(), 100)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const profileComplete = !!(profile?.bio && profile?.role && profile?.location)

  if (loading) return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
      <p className="loading-text">Loading your dashboard...</p>
    </main>
  )

  if (error) return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
      <p className="error-text">{error}</p>
      <button className="btn-secondary" onClick={fetchDashboard}>Retry</button>
    </main>
  )

  return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>

      {/* Header */}
      <header className="dashboard-header">
        <h1>
          ⚡ Welcome back, <span className="accent-text">{profile?.username || user?.email}</span>
        </h1>
        <p>Track your hustle, connect with the community, and discover new opportunities.</p>
        {profile?.role && (
          <span className="dashboard-role">{ROLE_LABELS[profile.role] || profile.role}</span>
        )}
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/products'}>Browse Products</button>
          <button className="btn-primary" onClick={() => window.location.href = '/services'}>Find Services</button>
          <button className="btn-primary" onClick={() => window.location.href = '/feed'}>Community Feed</button>
        </div>
      </header>

      {/* Profile completeness nudge */}
      {!profileComplete && (
        <div className="dashboard-nudge">
          <span>⚡ Your profile is incomplete — add your bio, role and location to get discovered.</span>
          <a href="/profile" className="nudge-link">Complete Profile →</a>
        </div>
      )}

      {/* Stats */}
      <section className="dashboard-stats">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{stats.products}</strong>
            <span>Products Listed</span>
            <span className="stat-icon">🛒</span>
          </div>
          <div className="stat-card">
            <strong>{stats.services}</strong>
            <span>Services Offered</span>
            <span className="stat-icon">🤝</span>
          </div>
          <div className="stat-card">
            <strong>{stats.posts}</strong>
            <span>Posts Shared</span>
            <span className="stat-icon">💬</span>
          </div>
        </div>
      </section>

      {/* Profile Summary */}
      <section className="dashboard-profile-summary">
        <h2>Profile Summary</h2>
        <div className="profile-summary-grid">
          <div className="profile-avatar-circle">
            {(profile?.username || user?.email || '?')[0].toUpperCase()}
          </div>
          <ul>
            <li>Email: <strong>{user?.email}</strong></li>
            <li>Username: <strong>{profile?.username || '—'}</strong></li>
            {profile?.location && <li>Location: <strong>{profile.location}</strong></li>}
            {profile?.bio && <li>Bio: <strong>{profile.bio}</strong></li>}
            <li>Profile Complete: <strong style={{ color: profileComplete ? '#22c55e' : '#f59e0b' }}>{profileComplete ? 'Yes ✓' : 'Incomplete'}</strong></li>
          </ul>
        </div>
        <a href="/profile" className="btn-secondary">Edit Profile</a>
      </section>

      {/* Recent Activity */}
      <section className="dashboard-recent">
        <h2>Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="empty-hint">No activity yet. Start by listing a product or service!</p>
        ) : (
          <ul>
            {recent.map((item, idx) => (
              <li key={idx}>
                <span className={`recent-type recent-type-${item.type}`}>{item.type}</span>
                {item.name}
                <span className="recent-date">{item.date}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick links */}
      <section className="dashboard-widgets">
        <h2>Quick Links</h2>
        <div className="widgets-grid">
          <button className="btn-primary" onClick={() => window.location.href = '/products'}>🛒 Products</button>
          <button className="btn-primary" onClick={() => window.location.href = '/services'}>🤝 Services</button>
          <button className="btn-primary" onClick={() => window.location.href = '/feed'}>💬 Feed</button>
          <button className="btn-primary" onClick={() => window.location.href = '/profile'}>👤 Profile</button>
        </div>
      </section>

    </main>
  )
}