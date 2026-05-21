import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { trackEvent } from '../utils/analytics'
import ProductCard from '../components/ProductCard'
import './ProductsPage.css'

interface ProfileData {
  username: string
  verified?: boolean
  verification_status?: string
}

interface Product {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  location: string
  image_url: string
  category: string
  created_at: string
  profiles: ProfileData | null
}

const CATEGORIES = ['All', 'Design', 'Handmade', 'Tutoring', 'Tech', 'Art', 'Other']

const sanitize = (str: string) => str.trim().replace(/[<>{}]/g, '')

const validateForm = (form: {
  title: string
  price: string
  location: string
  description: string
  image_url: string
  category: string
}): string | null => {
  if (!form.title.trim()) return 'Title is required.'
  if (form.title.trim().length < 3) return 'Title must be at least 3 characters.'
  if (form.title.trim().length > 100) return 'Title must be under 100 characters.'
  if (form.price && isNaN(parseFloat(form.price))) return 'Price must be a valid number.'
  if (form.price && parseFloat(form.price) < 0) return 'Price cannot be negative.'
  if (form.price && parseFloat(form.price) > 1000000) return 'Price is too high.'
  if (form.description && form.description.length > 500) return 'Description must be under 500 characters.'
  if (form.image_url && form.image_url.trim()) {
    try { new URL(form.image_url) } catch { return 'Image URL must be a valid URL (starting with https://).' }
  }
  return null
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    image_url: '',
    category: 'Other',
  })

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm(form)
    if (validationError) { setError(validationError); return }

    setSubmitting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to add a product.')

      const { error } = await supabase.from('products').insert([{
        user_id: user.id,
        title: sanitize(form.title),
        description: sanitize(form.description),
        price: parseFloat(form.price) || 0,
        location: sanitize(form.location),
        image_url: form.image_url.trim(),
        category: form.category,
      }])
      if (error) throw error

      void trackEvent('create_product', {
        user_id: user.id,
        title: sanitize(form.title),
        category: form.category,
        price: parseFloat(form.price) || 0,
      })

      setForm({ title: '', description: '', price: '', location: '', image_url: '', category: 'Other' })
      setShowForm(false)
      await fetchProducts()
    } catch (err: any) {
      setError(err.message || 'Failed to add product.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = products.filter((p) => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <main className="products-container">
      <header className="products-header">
        <h1>Products Marketplace</h1>
        <p>Browse and discover products offered by the Instant Hub community.</p>
        <div className="products-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(v => !v)
              setError(null)
              void trackEvent('product_form_toggle', { showForm: !showForm })
            }}
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              void trackEvent('navigate_to_services', {})
              window.location.href = '/services'
            }}
          >
            Explore Services
          </button>
        </div>
      </header>
      <div className="trust-chip badge-gold">
        Trusted sellers and verified product offers
      </div>

      {showForm && (
        <section className="add-product-form">
          <h2>List a New Product</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Product name"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  maxLength={100}
                  required
                />
                <span className="form-hint">{form.title.length}/100</span>
              </div>
              <div className="form-group">
                <label htmlFor="price">Price (R)</label>
                <input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  min="0"
                  max="1000000"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g. Cape Town"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Describe your product..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  maxLength={500}
                />
                <span className="form-hint">{form.description.length}/500</span>
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
              {submitting ? 'Listing...' : 'List Product'}
            </button>
          </form>
        </section>
      )}

      <div className="products-filters">
        <input
          className="search-input"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            void trackEvent('product_search', { query: e.target.value })
          }}
          maxLength={100}
        />
        <div className="categories-list">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat)
                void trackEvent('product_filter', { category: cat })
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="products-list">
        {loading ? (
          <p className="loading-text">Loading products...</p>
        ) : error && !showForm ? (
          <p className="error-text">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No products found. Be the first to list one!</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                price={product.price}
                seller={product.profiles?.username || 'Unknown'}
                verified={product.profiles?.verified || product.profiles?.verification_status === 'verified'}
                userId={product.user_id}
                imageUrl={product.image_url}
                location={product.location}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default ProductsPage