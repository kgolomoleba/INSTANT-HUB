import { useEffect, useState } from 'react'
import type { User } from '@supabase/auth-js'
import { supabase } from '../supabaseClient'
import { trackEvent } from '../utils/analytics'
import './Profile.css'

const ROLES = [
  { value: 'buyer', label: 'Buyer', desc: 'Buy products and services' },
  { value: 'seller', label: 'Seller', desc: 'Sell products' },
  { value: 'supplier', label: 'Supplier', desc: 'Supply businesses' },
  { value: 'manufacturer', label: 'Manufacturer', desc: 'Manufacture goods' },
  { value: 'worker', label: 'Worker', desc: 'Offer skills' },
  { value: 'hr', label: 'HR Professional', desc: 'Source talent' },
  { value: 'entrepreneur', label: 'Entrepreneur', desc: 'Build businesses' },
  { value: 'investor', label: 'Investor', desc: 'Fund businesses' },
]

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [role, setRole] = useState('')
  const [location, setLocation] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'unverified'>('unverified')
  const [verificationRequested, setVerificationRequested] = useState(false)
  const [verificationSubmittedAt, setVerificationSubmittedAt] = useState<string | null>(null)
  const [verificationApprovedAt, setVerificationApprovedAt] = useState<string | null>(null)
  const [verificationMethod, setVerificationMethod] = useState('')
  const [verificationReference, setVerificationReference] = useState('')
  const [verificationNote, setVerificationNote] = useState('')
  const [verificationDocumentUrl, setVerificationDocumentUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submittingVerification, setSubmittingVerification] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ products: 0, services: 0, posts: 0, joined: '' })
  const [responseStats, setResponseStats] = useState({ handled: 0, avgHours: 0 })
  const profileComplete = !!(username.trim() && bio.trim() && role && location.trim())
  const hasListing = stats.products + stats.services > 0
  const verificationReady = profileComplete && hasListing
  const verificationProofProvided = Boolean(
    verificationMethod.trim() || verificationReference.trim() || verificationDocumentUrl.trim() || verificationNote.trim()
  )

  const verifyPersistedVerificationUpdate = async () => {
    if (!user) throw new Error('Not logged in')

    const { data: refreshedProfile, error: readError } = await supabase
      .from('profiles')
      .select('verification_status, verification_submitted_at')
      .eq('id', user.id)
      .maybeSingle()

    if (readError) throw readError
    if (!refreshedProfile || refreshedProfile.verification_status !== 'pending' || !refreshedProfile.verification_submitted_at) {
      throw new Error('The verification request did not persist to the database. The Supabase RLS policy for profile updates may not be active yet. Please apply the migration in the Supabase dashboard.')
    }

    return refreshedProfile
  }

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Not logged in')
        setUser(user)

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUsername(profile.username ?? '')
          setBio(profile.bio ?? '')
          setRole(profile.role ?? '')
          setLocation(profile.location ?? '')
          setVerificationMethod(profile.verification_method ?? '')
          setVerificationReference(profile.verification_reference ?? '')
          setVerificationNote(profile.verification_note ?? '')
          setVerificationDocumentUrl(profile.verification_document_url ?? '')
          setVerificationSubmittedAt(profile.verification_submitted_at ?? null)
          setVerificationApprovedAt(profile.verification_approved_at ?? null)
          setVerificationRequested(Boolean(profile.verification_status === 'pending' || profile.verification_submitted_at))

          if (profile.verified || profile.verification_status === 'verified') {
            setVerificationStatus('verified')
          } else if (profile.verification_status === 'pending') {
            setVerificationStatus('pending')
          } else {
            setVerificationStatus('unverified')
          }
        }

        const [{ count: productCount }, { count: serviceCount }, { count: postCount }] =
          await Promise.all([
            supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          ])

        setStats({
          products: productCount ?? 0,
          services: serviceCount ?? 0,
          posts: postCount ?? 0,
          joined: new Date(user.created_at).toLocaleDateString('en-ZA', {
            day: 'numeric', month: 'long', year: 'numeric'
          }),
        })

        const { data: inquiryData } = await supabase
          .from('inquiries')
          .select('created_at, responded_at, status')
          .eq('recipient_id', user.id)

        const handled = (inquiryData || []).filter(item => item.status === 'responded' && item.responded_at)
        const avgHours = handled.length
          ? handled.reduce((sum, item) => sum + ((new Date(item.responded_at as string).getTime() - new Date(item.created_at).getTime()) / 3600000), 0) / handled.length
          : 0

        setResponseStats({ handled: handled.length, avgHours })
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!username.trim()) { setError('Username cannot be empty'); return }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      if (!user) throw new Error('Not logged in')
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username.trim(),
        bio: bio.trim(),
        role,
        location: location.trim(),
        verification_status: verificationStatus === 'verified' ? 'verified' : verificationStatus === 'pending' ? 'pending' : 'unverified',
        verification_method: verificationMethod.trim() || null,
        verification_reference: verificationReference.trim() || null,
        verification_note: verificationNote.trim() || null,
        verification_document_url: verificationDocumentUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      setMessage('Profile saved!')
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleRequestVerification = async () => {
    if (!verificationMethod.trim() || (!verificationReference.trim() && !verificationDocumentUrl.trim() && !verificationNote.trim())) {
      setError('Add a verification method and at least one proof detail before submitting.')
      return
    }
    setSubmittingVerification(true)
    setError(null)
    setMessage(null)
    try {
      if (!user) throw new Error('Not logged in')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase is not configured for this app. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.')
      }
      const { error } = await supabase.from('profiles').update({
        verification_status: 'pending',
        verification_method: verificationMethod.trim(),
        verification_reference: verificationReference.trim() || null,
        verification_note: verificationNote.trim() || null,
        verification_document_url: verificationDocumentUrl.trim() || null,
        verification_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      if (error) throw error

      await verifyPersistedVerificationUpdate()
      setVerificationStatus('pending')
      setVerificationRequested(true)
      setVerificationSubmittedAt(new Date().toISOString())
      setVerificationApprovedAt(null)
      setMessage('Verification request submitted. An admin can mark your status as verified in Supabase when the proof is approved.')
      void trackEvent('verification_request', { user_id: user.id })
    } catch (err: any) {
      console.error('Verification submit failed', err)
      setError(err?.message || 'Failed to submit verification request')
    } finally {
      setSubmittingVerification(false)
    }
  }

  if (loading) return (
    <main className="profile-page">
      <p className="loading-text">Loading profile...</p>
    </main>
  )

  return (
    <main className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="profile-header-info">
          <h1>{username || user?.email}</h1>
          {role && (
            <span className="profile-role-badge">
              {ROLES.find(r => r.value === role)?.label}
            </span>
          )}
          {verificationStatus === 'verified' ? (
            <span className="profile-status-badge">Verified member</span>
          ) : verificationStatus === 'pending' ? (
            <span className="profile-status-badge">Verification pending</span>
          ) : (
            <span className="profile-status-badge profile-status-badge--muted">
              Not verified
            </span>
          )}
          {location && <span className="profile-location">{location}</span>}
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-num">{stats.products}</span>
          <span className="profile-stat-label">Products</span>
        </div>
        <div className="stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-num">{stats.services}</span>
          <span className="profile-stat-label">Services</span>
        </div>
        <div className="stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-num">{stats.posts}</span>
          <span className="profile-stat-label">Posts</span>
        </div>
        <div className="stat-divider" />
        <div className="profile-stat">
          <span className="profile-stat-num" style={{ fontSize: '0.9rem' }}>{stats.joined}</span>
          <span className="profile-stat-label">Joined</span>
        </div>
      </div>

      <section className="profile-verification-card">
        <h2>Verification</h2>
        <p>
          Verification makes your profile more trustworthy and gives you a visible badge on listings. Submit proof and an admin can approve it from Supabase.
        </p>
        {verificationStatus === 'verified' ? (
          <p>Your account is verified.</p>
        ) : verificationStatus === 'pending' || verificationRequested ? (
          <p>Your verification request is pending review.</p>
        ) : (
          <div className="verification-checklist">
            <div className={`check-item ${profileComplete ? 'complete' : ''}`}>
              <span className="check-mark">•</span>
              Profile complete
            </div>
            <div className={`check-item ${hasListing ? 'complete' : ''}`}>
              <span className="check-mark">•</span>
              At least one listing
            </div>
            <div className={`check-item ${verificationRequested ? 'complete' : ''}`}>
              <span className="check-mark">•</span>
              Verification request submitted
            </div>
          </div>
        )}

        <div className="trust-progress-card">
          <div className="trust-progress-header">
            <span className={`trust-pill trust-pill--${verificationStatus}`}>\n              {verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending review' : 'Not verified'}
            </span>
            <p>
              {verificationStatus === 'verified'
                ? 'Your profile is now showing trust signals across the marketplace.'
                : verificationStatus === 'pending'
                  ? 'Your proof is being reviewed. Buyers will see your trust badge once approved.'
                  : 'Add proof and a short reference to start building trust with buyers.'}
            </p>
          </div>
          <div className="trust-progress-grid">
            <div className={`trust-step ${profileComplete ? 'complete' : ''}`}>
              <span className="check-mark">•</span>
              Complete your profile
            </div>
            <div className={`trust-step ${hasListing ? 'complete' : ''}`}>
              <span className="check-mark">•</span>
              Add at least one listing
            </div>
            <div className={`trust-step ${verificationRequested ? 'complete' : ''}`}>
              <span className="check-mark">•</span>
              Submit proof details
            </div>
          </div>
        </div>

        {(verificationStatus !== 'verified') && (
          <div className="verification-form">
            <label className="form-label" htmlFor="verification-method">Proof type</label>
            <select
              id="verification-method"
              value={verificationMethod}
              onChange={e => setVerificationMethod(e.target.value)}
            >
              <option value="">Select proof type</option>
              <option value="business_registration">Business registration / CIPC</option>
              <option value="identity_document">ID or passport</option>
              <option value="industry_proof">Industry-specific proof</option>
              <option value="other">Other proof</option>
            </select>
            <label className="form-label" htmlFor="verification-reference">Reference or number</label>
            <input
              id="verification-reference"
              type="text"
              value={verificationReference}
              onChange={e => setVerificationReference(e.target.value)}
              placeholder="CIPC number, ID number, or reference"
            />
            <label className="form-label" htmlFor="verification-document-url">Proof link</label>
            <input
              id="verification-document-url"
              type="url"
              value={verificationDocumentUrl}
              onChange={e => setVerificationDocumentUrl(e.target.value)}
              placeholder="https://..."
            />
            <label className="form-label" htmlFor="verification-note">Notes</label>
            <textarea
              id="verification-note"
              value={verificationNote}
              onChange={e => setVerificationNote(e.target.value)}
              rows={3}
              placeholder="Share a short note for Auto Care, procurement, or other proof"
            />
            <button
              className="btn-verify"
              onClick={handleRequestVerification}
              disabled={submittingVerification || !verificationProofProvided}
              type="button"
            >
              {submittingVerification ? 'Submitting...' : 'Submit verification request'}
            </button>
            {!verificationReady && (
              <p className="verification-hint">A complete profile and at least one listing make your request stronger, but you can still submit proof details now.</p>
            )}
          </div>
        )}

        <div className="trust-summary">
          <div className="trust-metric">
            <strong>{responseStats.handled}</strong>
            <span>Inquiries handled</span>
          </div>
          <div className="trust-metric">
            <strong>{responseStats.handled ? `${responseStats.avgHours.toFixed(1)}h` : '—'}</strong>
            <span>Avg response</span>
          </div>
          <div className="trust-metric">
            <strong>{verificationSubmittedAt ? new Date(verificationSubmittedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}</strong>
            <span>Last request</span>
          </div>
        </div>

        <div className="verification-timeline">
          <h3>Verification timeline</h3>
          <ul>
            <li>
              <span className="timeline-label">Status</span>
              <strong>{verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending review' : 'Awaiting proof'}</strong>
            </li>
            <li>
              <span className="timeline-label">Submitted</span>
              <strong>{verificationSubmittedAt ? new Date(verificationSubmittedAt).toLocaleString('en-ZA') : 'Not submitted yet'}</strong>
            </li>
            <li>
              <span className="timeline-label">Approved</span>
              <strong>{verificationApprovedAt ? new Date(verificationApprovedAt).toLocaleString('en-ZA') : 'Pending manual approval'}</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Edit Profile</h2>

        {message && <div className="profile-success">{message}</div>}
        {error && <div className="profile-error">{error}</div>}

        <div className="profile-form-grid">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={20}
              placeholder="your_username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Cape Town, South Africa"
            />
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell the community about yourself, your hustle, or your goals..."
              rows={3}
              maxLength={300}
            />
            <span className="form-hint">{bio.length}/300</span>
          </div>
        </div>

        <div className="role-section">
          <label className="role-label">Your Role</label>
          <p className="role-hint">How do you use Instant Hub? Select the one that fits best.</p>
          <div className="roles-grid">
            {ROLES.map(r => (
              <button
                key={r.value}
                className={`role-option ${role === r.value ? 'selected' : ''}`}
                onClick={() => setRole(r.value)}
                type="button"
              >
                <span className="role-option-name">{r.label}</span>
                <span className="role-option-desc">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">Quick Links</h2>
        <div className="profile-links">
          <a href="/dashboard" className="profile-link">Dashboard</a>
          <a href="/products" className="profile-link">Your Products</a>
          <a href="/services" className="profile-link">Your Services</a>
          <a href="/feed" className="profile-link">Community Feed</a>
        </div>
      </section>

    </main>
  )
}