import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import FeedPost from '../components/FeedPost'
import './FeedPage.css'

interface Post {
  id: string
  user_id: string
  username: string
  type: 'product' | 'service' | 'request' | 'general'
  title: string
  description: string
  image_url: string
  price: string
  created_at: string
}

const POST_TYPES = ['All', 'general', 'product', 'service', 'request']

const TYPE_LABELS: Record<string, string> = {
  All: 'All',
  general: 'General',
  product: 'Product',
  service: 'Service',
  request: 'Request',
}

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('All')

  const [form, setForm] = useState({
    type: 'general',
    title: '',
    description: '',
    image_url: '',
    price: '',
  })

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPosts(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to post.')

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      const { error } = await supabase.from('posts').insert([{
        user_id: user.id,
        username: profile?.username || user.email,
        type: form.type,
        title: form.title,
        description: form.description,
        image_url: form.image_url,
        price: form.price,
      }])
      if (error) throw error

      setForm({ type: 'general', title: '', description: '', image_url: '', price: '' })
      setShowForm(false)
      await fetchPosts()
    } catch (err: any) {
      setError(err.message || 'Failed to create post.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', id)
    await fetchPosts()
  }

  const filtered = filter === 'All' ? posts : posts.filter(p => p.type === filter)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <main className="feed-container">
      <header className="feed-header">
        <h1>Community Feed</h1>
        <p>Share your hustle, ask for help, promote your products and services.</p>
        <div className="feed-actions">
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Create Post'}
          </button>
          <button className="btn-secondary" onClick={() => window.location.href = '/products'}>
            Browse Products
          </button>
          <button className="btn-secondary" onClick={() => window.location.href = '/services'}>
            Find Services
          </button>
        </div>
      </header>

      {/* Create Post Form */}
      {showForm && (
        <section className="feed-form">
          <h2>New Post</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="feed-form-grid">
              <div className="form-group">
                <label htmlFor="type">Post Type</label>
                <select
                  id="type"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="request">Request</option>
                </select>
              </div>
              {(form.type === 'product' || form.type === 'service') && (
                <div className="form-group">
                  <label htmlFor="price">Price</label>
                  <input
                    id="price"
                    type="text"
                    placeholder="e.g. R150 or R60/hr"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              )}
              <div className="form-group form-group-full">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  placeholder="What's your post about?"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Tell the community more..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="image_url">Image URL</label>
                <input
                  id="image_url"
                  type="url"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post to Community'}
            </button>
          </form>
        </section>
      )}

      {/* Filter tabs */}
      <div className="feed-filters">
        {POST_TYPES.map(type => (
          <button
            key={type}
            className={`feed-filter-btn ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Posts */}
      <section className="feed-posts">
        {loading ? (
          <p className="loading-text">Loading posts...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <div className="feed-grid">
            {filtered.map(post => (
              <FeedPost
                key={post.id}
                id={post.id}
                type={post.type}
                title={post.title}
                description={post.description}
                image={post.image_url}
                price={post.price}
                author={post.username}
                createdAt={formatDate(post.created_at)}
                userId={post.user_id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default FeedPage