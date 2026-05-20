import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ProductCard from '../components/ProductCard'
import './ProductsPage.css'

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
}

const CATEGORIES = ['All', 'Design', 'Handmade', 'Tutoring', 'Tech', 'Art', 'Other']

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

  // Form state
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
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to add a product.')

      const { error } = await supabase.from('products').insert([
        {
          user_id: user.id,
          title: form.title,
          description: form.description,
          price: parseFloat(form.price) || 0,
          location: form.location,
          image_url: form.image_url,
          category: form.category,
        },
      ])
      if (error) throw error

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
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
          <button className="btn-secondary" onClick={() => (window.location.href = '/services')}>
            Explore Services
          </button>
        </div>
      </header>

      {/* Add Product Form */}
      {showForm && (
        <section className="add-product-form">
          <h2>List a New Product</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Product name"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price (R)</label>
                <input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  min="0"
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
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
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
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Listing...' : 'List Product'}
            </button>
          </form>
        </section>
      )}

      {/* Search & Filter */}
      <div className="products-filters">
        <input
          className="search-input"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="categories-list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <section className="products-list">
        {loading ? (
          <p className="loading-text">Loading products...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No products found. Be the first to list one!</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                price={product.price}
                seller={product.user_id}
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