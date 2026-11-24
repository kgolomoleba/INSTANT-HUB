import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { timeAgo } from '../utils/time'
import FeedPost from '../components/FeedPost'
import { ListingSkeletons } from '../components/ui/Skeleton'
import './FeedPage.css'
import { errorMessage } from '../utils/errors'

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
  All: 'All', general: 'General', product: 'Product', service: 'Service', request: 'Request',
}

// ===== VALIDATION =====
const sanitize = (str: string) => str.trim().replace(/[<>{}]/g, '')

const validatePost = (form: {
  title: string
  description: string
  image_url: string
  price: string
}): string | null => {
  if (!form.title.trim()) return 'Title is required.'
  if (form.title.trim().length < 3) return 'Title must be at least 3 characters.'
  if (form.title.trim().length > 100) return 'Title must be under 100 characters.'
  if (form.description.length > 500) return 'Description must be under 500 characters.'
  if (form.image_url.trim()) {
    try { new URL(form.image_url) } catch { return 'Image URL must start with https://.' }
  }
  return null
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

  const fetchPosts = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      setError(errorMessage(err, 'Failed to load posts.'))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Hook handles stream setup and real-time synchronization updates
  useEffect(() => {
    void fetchPosts()

    const channel = supabase
      .channel('realtime-community-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          void fetchPosts(true)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validatePost(form)
    if (validationError) { setError(validationError); return }

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
        title: sanitize(form.title),
        description: sanitize(form.description),
        image_url: form.image_url.trim(),
        price: form.type === 'product' || form.type === 'service' ? sanitize(form.price) : '',
      }])
      if (error) throw error

      setForm({ type: 'general', title: '', description: '', image_url: '', price: '' })
      setShowForm(false)
      await fetchPosts()
    } catch (err) {
      setError(errorMessage(err, 'Failed to create post.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
      await fetchPosts()
    } catch (err) {
      setError(errorMessage(err, 'Could not delete post selection.'))
    }
  }

  const filtered = filter === 'All' ? posts : posts.filter(p => p.type === filter)

  const formatDate = (iso: string) => timeAgo(iso)

  return (
    <main className="feed-container">
      <header className="page-head">
        <div>
          <h1>Community feed</h1>
          <p>Share what you are working on, ask for help, post a job, or promote what you sell.</p>
        </div>
        <div className="actions">
          <button className="btn-primary" onClick={() => { setShowForm(v => !v); setError(null) }}>
            {showForm ? 'Cancel' : '+ New post'}
          </button>
        </div>
      </header>

      {showForm && (
        <section className="feed-form">
          <h2>New post</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="feed-form-grid">
              <div className="form-group">
                <label htmlFor="type">Type of post</label>
                <select id="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
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
                    maxLength={30}
                  />
                </div>
              )}
              <div className="form-group form-group-full">
                <label htmlFor="title">Title * <span className="count-hint">{form.title.length}/100</span></label>
                <input
                  id="title"
                  type="text"
                  placeholder="What's your post about?"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="description">Description <span className="count-hint">{form.description.length}/500</span></label>
                <textarea
                  id="description"
                  placeholder="Tell the community more..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  maxLength={500}
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
              {submitting ? 'Posting…' : 'Post to the community'}
            </button>
          </form>
        </section>
      )}

      <div className="chip-row feed-filters" role="group" aria-label="Post type">
        {POST_TYPES.map(type => (
          <button
            key={type}
            className={filter === type ? 'active' : ''}
            aria-pressed={filter === type}
            onClick={() => setFilter(type)}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <section className="feed-posts">
        {loading ? (
          <ListingSkeletons count={4} />
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