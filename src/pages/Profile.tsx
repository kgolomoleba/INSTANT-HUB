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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ products: 0, services: 0, posts: 0, joined: '' })
  const profileComplete = !!(username.trim() && bio.trim() && role && location.trim())
  const hasListing = stats.products + stats.services > 0
  const verificationReady = profileComplete && hasListing

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Not logged in')
        setUser(user)

        // Fetch profile
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

          if (profile.verified || profile.verification_status === 'verified') {
            setVerificationStatus('verified')
          } else if (profile.verification_status === 'pending') {
            setVerificationStatus('pending')
          } else {
            setVerificationStatus('unverified')
          }
        }

        // Fetch real stats
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
    setVerificationRequested(true)
    setError(null)
    setMessage('Verification request submitted. We will review your profile and update your status soon.')
    void trackEvent('verification_request', { user_id: user?.id })
  }

  if (loading) return (
    <main className="profile-page">
      <p className="loading-text">Loading profile...</p>
    </main>
  )

  return (
    <main className="profile-page">

      {/* Header */}
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
            <span className="profile-status-badge" style={{ background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.25)', color: '#fecaca' }}>
              Not verified
            </span>
          )}
          {location && <span className="profile-location">{location}</span>}
        </div>
      </div>

      {/* Stats */}
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

      {/* Edit Form */}
      <section className="profile-verification-card">
        <h2>Verification</h2>
        <p>
          Verification makes your profile more trustworthy and gives you a visible badge on listings. Request verification once your profile is complete.
        </p>
        {verificationStatus === 'verified' ? (
          <p>Your account is verified.</p>
        ) : verificationStatus === 'pending' || verificationRequested ? (
          <p>Your verification request is pending review.</p>
        ) : (
          <>
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
            <button className="btn-verify" onClick={handleRequestVerification}>
              Request Verification
            </button>
            {!verificationReady && (
              <p className="verification-hint">Complete your profile and add at least one offer before requesting verification.</p>
            )}
          </>
        )}
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

        {/* Role Selection */}
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

      {/* Quick links */}
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