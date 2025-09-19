
import { useEffect, useState } from 'react'
import type { User } from '@supabase/auth-js'
import { supabase } from '../supabaseClient'
import './Profile.css'
import './ProductsPage.css'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error) throw error
        if (!user) throw new Error('No user logged in')
        setUser(user)
        // Fetch username from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        if (profileError && profileError.code !== 'PGRST116') throw profileError
        setUsername(profileData?.username ?? '')
        // Fetch stats (mocked)
        setStats({
          products: Math.floor(Math.random() * 10),
          services: Math.floor(Math.random() * 8),
          posts: Math.floor(Math.random() * 12),
          joined: '2025-01-10',
        })
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user info')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    if (!username.trim()) {
      setError('Username cannot be empty')
      setLoading(false)
      return
    }
    try {
      if (!user) throw new Error('No user')
      const updates = {
        id: user.id,
        username: username.trim(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error
      setMessage('Profile updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !user)
    return (
      <main className="profile-page" role="main" tabIndex={-1}>
        <p>Loading profile…</p>
      </main>
    )

  if (error && !user)
    return (
      <main className="profile-page" role="main" tabIndex={-1}>
        <p className="error">Error: {error}</p>
      </main>
    )

  return (
    <main className="profile-page" role="main" tabIndex={-1}>
      <h1>👤 Your Profile</h1>


      <section className="profile-info">
        {/* Avatar & Bio */}
        <div className="profile-avatar-bio" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div className="profile-avatar" style={{ flex: '0 0 auto' }}>
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${username || user?.email}`}
              alt="User avatar"
              width={100}
              height={100}
              style={{ borderRadius: '50%', marginBottom: '1rem', boxShadow: '0 4px 24px #ff6f6177' }}
            />
          </div>
          <div className="profile-bio" style={{ flex: '1 1 auto' }}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              placeholder="Tell us about yourself, your hustle, or your goals... (coming soon)"
              rows={3}
              style={{ width: '100%', resize: 'vertical', marginBottom: '0.5rem', background: '#23262f', color: '#e0e0e0', borderRadius: '12px', border: '2px solid #3a3a4e', fontSize: '1.1rem', padding: '0.8rem 1rem' }}
              disabled
            />
            <small className="description">Bio editing coming soon!</small>
          </div>
        </div>

        {/* Info & Edit */}
        <div className="profile-fields" style={{ marginBottom: '2rem' }}>
          <label htmlFor="email">Email (read-only)</label>
          <input type="email" id="email" value={user?.email || ''} disabled />

          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            placeholder="Enter your username"
            autoComplete="username"
            spellCheck={false}
            aria-describedby="username-desc"
          />
          <small id="username-desc" className="description">
            Your public username (max 30 characters)
          </small>

          <div className="actions">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Stats & Achievements */}
        <div className="profile-stats" style={{ background: '#23262f', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 12px #00000033' }}>
          <h2 style={{ color: '#ff6f61', fontWeight: 800, marginBottom: '1rem' }}>Your Stats</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.15rem', color: '#e0e0e0' }}>
            <li style={{ marginBottom: '0.7rem' }}>🛒 Products Listed: <strong>{stats?.products}</strong></li>
            <li style={{ marginBottom: '0.7rem' }}>🤝 Services Offered: <strong>{stats?.services}</strong></li>
            <li style={{ marginBottom: '0.7rem' }}>💬 Posts Shared: <strong>{stats?.posts}</strong></li>
            <li>📅 Member Since: <strong>{stats?.joined}</strong></li>
          </ul>
          <div className="profile-achievements" style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="achievement-badge" style={{ background: '#ff6f61', color: '#fff', borderRadius: '1rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 8px #ff6f6177' }}>🏆 Top Seller</div>
            <div className="achievement-badge" style={{ background: '#ff8a75', color: '#fff', borderRadius: '1rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 8px #ff8a7577' }}>🌟 Community Star</div>
            <div className="achievement-badge" style={{ background: '#292933', color: '#ff6f61', borderRadius: '1rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 8px #29293377' }}>💬 Active Contributor</div>
          </div>
        </div>

        {/* Success/Error messages */}
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {/* Tips & Links */}
      <section className="profile-tips">
        <h2>Tips & Quick Links</h2>
        <ul>
          <li>💡 Tip: Add a bio and profile picture for more trust.</li>
          <li>🌟 Highlight: Complete your profile for more visibility!</li>
          <li><a href="/dashboard">Go to Dashboard</a></li>
          <li><a href="/products">Your Products</a></li>
          <li><a href="/services">Your Services</a></li>
        </ul>
      </section>
    </main>
  )
}
