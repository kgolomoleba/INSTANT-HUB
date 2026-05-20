import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ServiceCard from '../components/ServiceCard'
import './ServicesPage.css'

interface Service {
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

const CATEGORIES = ['All', 'Tutoring', 'Web Development', 'Photography', 'Design', 'Consulting', 'Other']

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
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

  const fetchServices = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setServices(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to offer a service.')

      const { error } = await supabase.from('services').insert([
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
      await fetchServices()
    } catch (err: any) {
      setError(err.message || 'Failed to add service.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = services.filter((s) => {
    const matchCategory = selectedCategory === 'All' || s.category === selectedCategory
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <main className="services-container">
      <header className="services-header">
        <h1>Services Marketplace</h1>
        <p>Find and offer skills within the Instant Hub community. Connect with local experts and grow your hustle!</p>
        <div className="services-actions">
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : '+ Offer a Service'}
          </button>
          <button className="btn-secondary" onClick={() => (window.location.href = '/products')}>
            Browse Products
          </button>
        </div>
      </header>

      {/* Add Service Form */}
      {showForm && (
        <section className="add-service-form">
          <h2>List a New Service</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Service Title *</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Logo Design"
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
                  placeholder="Describe what you offer..."
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
              {submitting ? 'Listing...' : 'List Service'}
            </button>
          </form>
        </section>
      )}

      {/* Search & Filter */}
      <div className="services-filters">
        <input
          className="search-input"
          type="text"
          placeholder="Search services..."
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

      {/* Services Grid */}
      <section className="services-list">
        {loading ? (
          <p className="loading-text">Loading services...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No services found. Be the first to offer your skills!</p>
          </div>
        ) : (
          <div className="services-grid">
            {filtered.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                price={service.price}
                provider={service.user_id}
                imageUrl={service.image_url}
                location={service.location}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default ServicesPage