import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from '@supabase/auth-js'
import { Bell, BriefcaseBusiness, Compass, MessageCircleMore } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { timeAgo } from '../utils/time'
import { trackEvent } from '../utils/analytics'
import OnboardingPanel from '../components/OnboardingPanel'
import { ListingSkeletons } from '../components/ui/Skeleton'
import './Dashboard.css'
import { errorMessage } from '../utils/errors'

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
const formatDate = (iso: string) => timeAgo(iso)

export default function Dashboard() {
  const navigate = useNavigate()
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
      if (authError || !user) { navigate('/login'); return }
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
    } catch (err) {
      setError(errorMessage(err, 'Failed to load dashboard.'))
    } finally {
      setLoading(false)
      setTimeout(() => mainRef.current?.focus({ preventScroll: true }), 100)
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

  if (loading) return (
    <main className="dash" role="main" tabIndex={-1} ref={mainRef}>
      <ListingSkeletons count={4} />
    </main>
  )

  if (error) return (
    <main className="dash" role="main" tabIndex={-1} ref={mainRef}>
      <p className="error-text">{error}</p>
      <button className="btn-secondary" onClick={() => fetchDashboard()}>Try again</button>
    </main>
  )

  const go = (path: string, event: string) => {
    void trackEvent(event, { user_id: user?.id })
    navigate(path)
  }
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const trustText =
    verificationStatus === 'verified'
      ? 'Your profile shows verified trust signals to buyers.'
      : verificationStatus === 'pending'
        ? 'Your proof is under review. We will update this when it is checked.'
        : 'Submit proof of your business to earn a verified badge on your listings.'

  return (
    <main className="dash" role="main" tabIndex={-1} ref={mainRef}>
      <header className="page-head">
        <div>
          <p className="eyebrow">{greeting}</p>
          <h1>{profile?.username || user?.email}</h1>
          <p className="dash-sub">
            {profile?.role && <span className="pill">{ROLE_LABELS[profile.role] || profile.role}</span>}
            <span className={`pill pill-${verificationStatus}`}>
              {verificationStatus === 'verified' ? '✓ Verified' : verificationStatus === 'pending' ? 'Verification pending' : 'Not verified'}
            </span>
          </p>
        </div>
        <div className="actions">
          <button className="btn-secondary" onClick={() => go('/services', 'dashboard_browse_services_click')}>
            <BriefcaseBusiness size={16} /> Find services
          </button>
          <button className="btn-primary" onClick={() => go('/products', 'dashboard_browse_products_click')}>
            <Compass size={16} /> Browse products
          </button>
        </div>
      </header>

      <section className="stat-row" aria-label="Your numbers">
        <div className="stat-tile">
          <span className="stat-ico"><BriefcaseBusiness size={18} /></span>
          <strong>{stats.products}</strong>
          <span>Products listed</span>
        </div>
        <div className="stat-tile">
          <span className="stat-ico"><Compass size={18} /></span>
          <strong>{stats.services}</strong>
          <span>Services offered</span>
        </div>
        <div className="stat-tile">
          <span className="stat-ico"><MessageCircleMore size={18} /></span>
          <strong>{stats.posts}</strong>
          <span>Posts shared</span>
        </div>
        <div className={`stat-tile ${unreadCount > 0 ? 'hot' : ''}`}>
          <span className="stat-ico"><Bell size={18} /></span>
          <strong>{unreadCount}</strong>
          <span>Unread inquiries</span>
        </div>
      </section>

      <div className="dash-grid">
        <div className="dash-main">
          {isAdmin && (
            <section className="dash-card" aria-labelledby="admin-q">
              <h2 id="admin-q">Verification approvals</h2>
              {pendingVerifications.length === 0 ? (
                <p className="empty-hint">No pending verification requests.</p>
              ) : (
                <div className="verification-queue-list">
                  {pendingVerifications.map(request => (
                    <div key={request.id} className="verification-request-card">
                      <div className="verification-request-top">
                        <div>
                          <h3>{request.username || 'Unnamed user'}</h3>
                          <p>{request.role ? request.role : 'No role set'} · {request.location || 'No location'}</p>
                        </div>
                        <button className="btn-primary" type="button" onClick={() => approveVerificationRequest(request.id)} disabled={approvingId === request.id}>
                          {approvingId === request.id ? 'Approving…' : 'Approve'}
                        </button>
                      </div>
                      <div className="verification-request-body">
                        <p><strong>Proof type:</strong> {request.verification_method || 'Not provided'}</p>
                        <p><strong>Reference:</strong> {request.verification_reference || 'Not provided'}</p>
                        <p><strong>Note:</strong> {request.verification_note || 'None'}</p>
                        {request.verification_document_url && /^https?:\/\//i.test(request.verification_document_url) && (
                          <p><strong>Proof link:</strong> <a href={request.verification_document_url} target="_blank" rel="noreferrer">View document</a></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="dash-card" aria-labelledby="inbox">
            <div className="card-head">
              <h2 id="inbox">Inquiries</h2>
              {unreadCount > 0 && <span className="inbox-badge">{unreadCount} new</span>}
            </div>
            {inquiries.length === 0 ? (
              <div className="empty-block">
                <strong>No inquiries yet</strong>
                <p>List a product or service and buyers can message you here.</p>
              </div>
            ) : (
              <div className="inquiries-list">
                {inquiries.map(inquiry => (
                  <article key={inquiry.id} className={`inquiry-card ${!inquiry.read ? 'unread' : ''}`}>
                    <span className="inquiry-avatar">{inquiry.sender_username?.[0]?.toUpperCase() || '?'}</span>
                    <div className="inquiry-body">
                      <div className="inquiry-top">
                        <span className="inquiry-name">{inquiry.sender_username}</span>
                        <span className="inquiry-date">{formatDate(inquiry.created_at)}</span>
                      </div>
                      <span className="inquiry-about">
                        About <strong>{inquiry.listing_title}</strong>
                        <span className={`inquiry-type-badge ${inquiry.listing_type}`}>{inquiry.listing_type}</span>
                      </span>
                      <p className="inquiry-message">{inquiry.message}</p>
                      <div className="inquiry-actions">
                        {!inquiry.read && (
                          <button className="btn-mark-read" onClick={() => markAsRead(inquiry.id)}>Mark read</button>
                        )}
                        <button className="btn-mark-read" onClick={() => markAsResponded(inquiry.id)} disabled={inquiry.status === 'responded'}>
                          {inquiry.status === 'responded' ? '✓ Responded' : 'Mark responded'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="dash-card" aria-labelledby="sent">
            <div className="card-head">
              <h2 id="sent">Inquiries you sent</h2>
            </div>
            {sentInquiries.length === 0 ? (
              <div className="empty-block">
                <strong>Nothing sent yet</strong>
                <p>Found something you like? Send the seller an inquiry from any listing.</p>
              </div>
            ) : (
              <div className="inquiries-list">
                {sentInquiries.map(inquiry => (
                  <article key={inquiry.id} className="inquiry-card">
                    <span className="inquiry-avatar">{(inquiry.recipient_username || '?')[0]?.toUpperCase()}</span>
                    <div className="inquiry-body">
                      <div className="inquiry-top">
                        <span className="inquiry-name">{inquiry.recipient_username || 'Recipient'}</span>
                        <span className="inquiry-date">{formatDate(inquiry.created_at)}</span>
                      </div>
                      <span className="inquiry-about">{inquiry.listing_title}</span>
                      <p className="inquiry-message">{inquiry.message}</p>
                      <span className={`inquiry-status-pill ${inquiry.status === 'responded' ? 'responded' : 'sent'}`}>
                        {inquiry.status === 'responded' ? 'Responded' : 'Sent'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="dash-side">
          <OnboardingPanel profileComplete={profileComplete} products={stats.products} services={stats.services} />

          <section className="dash-card" aria-labelledby="trust">
            <h2 id="trust">Trust status</h2>
            <div className={`trust-badge trust-badge--${verificationStatus}`}>
              {verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending review' : 'Not verified'}
            </div>
            <p>{trustText}</p>
            {verificationStatus === 'unverified' && (
              <Link to="/profile" className="btn-secondary small-btn">Submit proof</Link>
            )}
          </section>

          <section className="dash-card" aria-labelledby="recent">
            <h2 id="recent">Recent activity</h2>
            {recent.length === 0 ? (
              <p className="empty-hint">No activity yet. Your listings and posts will show up here.</p>
            ) : (
              <ul className="recent-list">
                {recent.map((item, idx) => (
                  <li key={idx}>
                    <span className={`recent-type recent-type-${item.type}`}>{item.type}</span>
                    <span className="recent-name">{item.name}</span>
                    <span className="recent-date">{item.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  )
}