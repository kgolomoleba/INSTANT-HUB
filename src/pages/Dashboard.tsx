import { useEffect, useState, useRef } from 'react'
import type { User } from '@supabase/auth-js'
import { Bell, BriefcaseBusiness, Compass, MessageCircleMore, Sparkles, UserRound } from 'lucide-react'
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

interface PendingVerification {
  id: string
  username?: string | null
  bio?: string | null
  role?: string | null
  location?: string | null
  verification_method?: string | null
  verification_reference?: string | null
  verification_note?: string | null
  verification_document_url?: string | null
  verification_status?: string | null
  verification_submitted_at?: string | null
  verification_approved_at?: string | null
}

interface Inquiry {
  id: string
  sender_username: string
  recipient_username?: string
  listing_type: string
  listing_title: string
  message: string
  created_at: string
  read: boolean
  status?: string
  responded_at?: string | null
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

// Unified global date formatter to prevent duplicate declarations
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ products: 0, services: 0, posts: 0 })
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [sentInquiries, setSentInquiries] = useState<Inquiry[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const mainRef = useRef<HTMLElement>(null)

  const fetchDashboard = async (showSilentLoad = false) => {
    if (!showSilentLoad) setLoading(true)
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

      if (profileData?.role === 'admin') {
        const { data: pendingProfiles, error: pendingError } = await supabase
          .from('profiles')
          .select('id, username, bio, role, location, verification_method, verification_reference, verification_note, verification_document_url, verification_status, verification_submitted_at, verification_approved_at')
          .eq('verification_status', 'pending')
          .order('verification_submitted_at', { ascending: false })
          .limit(10)
        if (pendingError) {
          console.error('Failed to fetch pending verification requests', pendingError)
        } else {
          setPendingVerifications(pendingProfiles ?? [])
        }
      }

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

      // Sort items safely using raw ISO timestamps prior to string formatting
      const allRecent = [
        ...(recentProducts ?? []).map(p => ({ type: 'product' as const, name: p.title, rawDate: p.created_at })),
        ...(recentServices ?? []).map(s => ({ type: 'service' as const, name: s.title, rawDate: s.created_at })),
        ...(recentPosts ?? []).map(p => ({ type: 'post' as const, name: p.title, rawDate: p.created_at })),
      ]
        .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
        .slice(0, 5)
        .map(item => ({
          type: item.type,
          name: item.name,
          date: formatDate(item.rawDate)
        }))

      setRecent(allRecent)

      const [{ data: inquiryData }, { data: sentInquiryData }] = await Promise.all([
        supabase
          .from('inquiries')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('inquiries')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      setInquiries((inquiryData || []) as Inquiry[])
      setSentInquiries((sentInquiryData || []) as Inquiry[])
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

  const markAsResponded = async (id: string) => {
    const { error } = await supabase.from('inquiries').update({
      status: 'responded',
      responded_at: new Date().toISOString(),
    }).eq('id', id)
    if (!error) {
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: 'responded', responded_at: new Date().toISOString() } : i))
    }
  }

  const approveVerificationRequest = async (id: string) => {
    setApprovingId(id)
    const { error } = await supabase.from('profiles').update({
      verified: true,
      verification_status: 'verified',
      verification_approved_at: new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      console.error('Failed to approve verification request', error)
      setApprovingId(null)
      return
    }

    setPendingVerifications(prev => prev.filter(item => item.id !== id))
    setApprovingId(null)
  }

  // Hook handles dynamic data parsing and attaches real-time WebSockets setup
  useEffect(() => {
    fetchDashboard()

    const channel = supabase
      .channel('realtime-dashboard-inquiries')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for inserts, updates, and status marks
          schema: 'public',
          table: 'inquiries'
        },
        () => {
          // Silent refresh synchronization on any incoming database event
          void fetchDashboard(true)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const profileComplete = !!(profile?.bio && profile?.role && profile?.location)
  const isAdmin = profile?.role === 'admin'
  const verificationStatus = profile?.verified || profile?.verification_status === 'verified'
    ? 'verified'
    : profile?.verification_status === 'pending'
      ? 'pending'
      : 'unverified'
  const totalListings = stats.products + stats.services

  if (loading) return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
      <p className="loading-text">Loading your dashboard...</p>
    </main>
  )

  if (error) return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>
      <p className="error-text">{error}</p>
      <button className="btn-secondary" onClick={() => fetchDashboard()}>Retry</button>
    </main>
  )

  return (
    <main className="dashboard-container" role="main" tabIndex={-1} ref={mainRef}>

      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <span className="welcome-chip"><Sparkles size={14} /> Business command center</span>
            <h1>
              Welcome back, <span className="accent-text">{profile?.username || user?.email}</span>
            </h1>
            <p>Track your business, connect with the community, and discover new opportunities.</p>
          </div>
          <div className="dashboard-header-badges">
            {profile?.role && (
              <span className="dashboard-role">{ROLE_LABELS[profile.role] || profile.role}</span>
            )}
            {unreadCount > 0 && (
              <span className="dashboard-pill"><Bell size={14} /> {unreadCount} unread</span>
            )}
          </div>
        </div>
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={() => { trackEvent('dashboard_browse_products_click', { user_id: user?.id }); window.location.href = '/products' }}><Compass size={16} /> Browse Products</button>
          <button className="btn-primary" onClick={() => { trackEvent('dashboard_browse_services_click', { user_id: user?.id }); window.location.href = '/services' }}><BriefcaseBusiness size={16} /> Find Services</button>
          <button className="btn-primary" onClick={() => { trackEvent('dashboard_open_feed_click', { user_id: user?.id }); window.location.href = '/feed' }}><MessageCircleMore size={16} /> Community Feed</button>
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
            <div className="stat-icon-wrap"><BriefcaseBusiness size={18} /></div>
            <strong>{stats.products}</strong>
            <span>Products Listed</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap"><Compass size={18} /></div>
            <strong>{stats.services}</strong>
            <span>Services Offered</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap"><MessageCircleMore size={18} /></div>
            <strong>{stats.posts}</strong>
            <span>Posts Shared</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap"><Bell size={18} /></div>
            <strong>{unreadCount}</strong>
            <span>Unread Inquiries</span>
          </div>
        </div>
      </section>

      <section className="dashboard-performance">
        <h2>Trust & performance</h2>
        <div className="performance-grid">
          <div className="performance-card">
            <strong>{totalListings}</strong>
            <span>Active listings</span>
          </div>
          <div className="performance-card">
            <strong>{unreadCount}</strong>
            <span>Incoming inquiries</span>
          </div>
          <div className="performance-card performance-card--trust">
            <div className={`trust-badge trust-badge--${verificationStatus}`}>
              {verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending' : 'Unverified'}
            </div>
            <span>Trust status</span>
            <p>
              {verificationStatus === 'verified'
                ? 'Your profile already shows verified trust signals.'
                : verificationStatus === 'pending'
                  ? 'Your proof is under review.'
                  : 'Submit proof details to unlock trust badges.'}
            </p>
          </div>
        </div>
      </section>

      {/* Admin verification queue */}
      {isAdmin && (
        <section className="dashboard-verification-queue">
          <h2>Verification approvals</h2>
          {pendingVerifications.length === 0 ? (
            <p className="empty-hint">No pending verification requests at the moment.</p>
          ) : (
            <div className="verification-queue-list">
              {pendingVerifications.map(request => (
                <div key={request.id} className="verification-request-card">
                  <div className="verification-request-top">
                    <div>
                      <h3>{request.username || 'Unnamed user'}</h3>
                      <p>{request.role ? request.role : 'No role set'} • {request.location || 'No location'}</p>
                    </div>
                    <button
                      className="btn-approve"
                      type="button"
                      onClick={() => approveVerificationRequest(request.id)}
                      disabled={approvingId === request.id}
                    >
                      {approvingId === request.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                  <div className="verification-request-body">
                    <p><strong>Proof type:</strong> {request.verification_method || 'Not provided'}</p>
                    <p><strong>Reference:</strong> {request.verification_reference || 'Not provided'}</p>
                    <p><strong>Note:</strong> {request.verification_note || 'None'}</p>
                    {request.verification_document_url && (
                      <p><strong>Proof link:</strong> <a href={request.verification_document_url} target="_blank" rel="noreferrer">View document</a></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
                    <div className="inquiry-actions">
                      {!inquiry.read && (
                        <button
                          className="btn-mark-read"
                          onClick={() => markAsRead(inquiry.id)}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        className="btn-mark-read"
                        onClick={() => markAsResponded(inquiry.id)}
                      >
                        {inquiry.status === 'responded' ? 'Responded' : 'Mark responded'}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="inquiry-message">{inquiry.message}</p>
                {inquiry.responded_at && (
                  <p className="inquiry-status">Responded {formatDate(inquiry.responded_at)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sent Inquiries Folder */}
      <section className="dashboard-inquiries">
        <h2>Your Sent Inquiries</h2>
        {sentInquiries.length === 0 ? (
          <p className="empty-hint">You have not sent any inquiries yet.</p>
        ) : (
          <div className="inquiries-list">
            {sentInquiries.map(inquiry => (
              <div key={inquiry.id} className="inquiry-card">
                <div className="inquiry-header">
                  <div>
                    <span className="inquiry-name">{inquiry.recipient_username || 'Recipient'}</span>
                    <span className="inquiry-about">{inquiry.listing_title}</span>
                  </div>
                  <div className="inquiry-meta">
                    <span className="inquiry-date">{formatDate(inquiry.created_at)}</span>
                    <span className={`inquiry-status-pill ${inquiry.status === 'responded' ? 'responded' : 'sent'}`}>
                      {inquiry.status === 'responded' ? 'Responded' : 'Sent'}
                    </span>
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
            <UserRound size={24} />
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