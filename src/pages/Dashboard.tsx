import { useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/auth-js'
import { supabase } from '../supabaseClient'
import { trackEvent } from '../utils/analytics'
import OnboardingPanel from '../components/OnboardingPanel'
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
  verified?: boolean
  verification_status?: string
}

interface Inquiry {
  id: string
  sender_username: string
  listing_type: string
  listing_title: string
  message: string
  created_at: string
  read: boolean
}

const ROLE_LABELS: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  supplier: 'Supplier',
  manufacturer: 'Manufacturer',
  worker: 'Worker',
  hr: 'HR Professional',
  entrepreneur: 'Entrepreneur',
  investor: 'Investor',
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ products: 0, services: 0, posts: 0 })
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const mainRef = useRef<HTMLElement>(null)

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { window.location.href = '/login'; return }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, bio, role, location, verified, verification_status')
        .eq('id', user.id)
        .single()
      setProfile(profileData ?? null)

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

      // Fetch inquiries received
      const { data: inquiryData } = await supabase
        .from('inquiries')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setInquiries(inquiryData || [])
      setUnreadCount((inquiryData || []).filter(i => !i.read).length)

      if (user) {
        try {
          trackEvent('dashboard_view', { user_id: user.id })
        } catch {
          // ignore analytics failures
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
      setTimeout(() => mainRef.current?.focus(), 100)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase.from('inquiries').update({ read: true }).eq('id', id)
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, read: true } : i))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  useEffect(() => { fetchDashboard() }, [])

  const profileComplete = !!(profile?.bio && profile?.role && profile?.location)
  const verificationStatus = profile?.verified || profile?.verification_status === 'verified'
    ? 'verified'
    : profile?.verification_status === 'pending'
      ? 'pending'
      : 'unverified'
  const totalListings = stats.products + stats.services

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

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
          Welcome back, <span className="accent-text">{profile?.username || user?.email}</span>
        </h1>
        <p>Track your business, connect with the community, and discover new opportunities.</p>
        {profile?.role && (
          <span className="dashboard-role">{ROLE_LABELS[profile.role] || profile.role}</span>
        )}
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => { trackEvent('dashboard_browse_products_click', { user_id: user?.id }); window.location.href = '/products' }}>Browse Products</button>
          <button className="btn-primary" onClick={() => { trackEvent('dashboard_browse_services_click', { user_id: user?.id }); window.location.href = '/services' }}>Find Services</button>
          <button className="btn-primary" onClick={() => { trackEvent('dashboard_open_feed_click', { user_id: user?.id }); window.location.href = '/feed' }}>Community Feed</button>
        </div>
      </header>

      <OnboardingPanel
        profileComplete={profileComplete}
        products={stats.products}
        services={stats.services}
      />

      {/* Profile completeness nudge */}
      {!profileComplete && (
        <div className="dashboard-nudge">
          <span>Your profile is not complete. Add your bio, role and location to increase visibility.</span>
          <a href="/profile" className="nudge-link">Complete Profile</a>
        </div>
      )}

      {/* Stats */}
      <section className="dashboard-stats">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{stats.products}</strong>
            <span>Products Listed</span>
          </div>
          <div className="stat-card">
            <strong>{stats.services}</strong>
            <span>Services Offered</span>
          </div>
          <div className="stat-card">
            <strong>{stats.posts}</strong>
            <span>Posts Shared</span>
          </div>
          <div className="stat-card">
            <strong>{unreadCount}</strong>
            <span>Unread Inquiries</span>
          </div>
        </div>
      </section>

      <section className="dashboard-performance">
        <h2>Listing performance</h2>
        <div className="performance-grid">
          <div className="performance-card">
            <strong>{totalListings}</strong>
            <span>Active listings</span>
          </div>
          <div className="performance-card">
            <strong>{unreadCount}</strong>
            <span>Incoming inquiries</span>
          </div>
          <div className="performance-card">
            <strong>{verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending' : 'Unverified'}</strong>
            <span>Trust status</span>
          </div>
        </div>
      </section>

      {/* Inquiries Inbox */}
      <section className="dashboard-inquiries">
        <h2>
          Inquiries Inbox
          {unreadCount > 0 && <span className="inbox-badge">{unreadCount} new</span>}
        </h2>
        {inquiries.length === 0 ? (
          <p className="empty-hint">No inquiries yet. List a product or service to start receiving messages.</p>
        ) : (
          <div className="inquiries-list">
            {inquiries.map(inquiry => (
              <div
                key={inquiry.id}
                className={`inquiry-card ${!inquiry.read ? 'unread' : ''}`}
              >
                <div className="inquiry-header">
                  <div className="inquiry-sender">
                    <span className="inquiry-avatar">{inquiry.sender_username?.[0]?.toUpperCase() || '?'}</span>
                    <div>
                      <span className="inquiry-name">{inquiry.sender_username}</span>
                      <span className="inquiry-about">
                        re: <strong>{inquiry.listing_title}</strong>
                        <span className={`inquiry-type-badge ${inquiry.listing_type}`}>{inquiry.listing_type}</span>
                      </span>
                    </div>
                  </div>
                  <div className="inquiry-meta">
                    <span className="inquiry-date">{formatDate(inquiry.created_at)}</span>
                    {!inquiry.read && (
                      <button
                        className="btn-mark-read"
                        onClick={() => markAsRead(inquiry.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
                <p className="inquiry-message">{inquiry.message}</p>
              </div>
            ))}
          </div>
        )}
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
            <li>Profile Complete: <strong className={profileComplete ? 'text-success' : 'text-gold'}>{profileComplete ? 'Yes' : 'Incomplete'}</strong></li>
            <li>Verification: <strong className={`text-gold verification-status-${verificationStatus}`}>{verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending review' : 'Not verified'}</strong></li>
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
          <button className="btn-primary" onClick={() => window.location.href = '/products'}>Products</button>
          <button className="btn-primary" onClick={() => window.location.href = '/services'}>Services</button>
          <button className="btn-primary" onClick={() => window.location.href = '/feed'}>Community Feed</button>
          <button className="btn-primary" onClick={() => window.location.href = '/profile'}>Profile</button>
        </div>
      </section>

    </main>
  )
}