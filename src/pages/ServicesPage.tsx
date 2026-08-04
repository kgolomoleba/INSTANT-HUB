import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { trackEvent } from '../utils/analytics'
import ServiceCard from '../components/ServiceCard'
import { CreateListingModal } from '../components/CreateListingModal'
import './ServicesPage.css'

interface ProfileData {
  username: string
  verified?: boolean
  verification_status?: string
}

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
  profiles: ProfileData | null
}

const CATEGORIES = ['All', 'Tutoring', 'Web Development', 'Photography', 'Design', 'Consulting', 'Other']

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Replaced showForm with isModalOpen
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

  const fetchServices = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setServices(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

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
        <p>Find and offer skills within the Instant Hub community.</p>
        <div className="services-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setIsModalOpen(true)
              setError(null)
              void trackEvent('service_form_toggle', { showForm: true })
            }}
          >
            + Offer a Service
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              void trackEvent('navigate_to_products', {})
              window.location.href = '/products'
            }}
          >
            Browse Products
          </button>
        </div>
      </header>
      
      <div className="trust-chip badge-gold">
        Verified providers and trusted service offers
      </div>

      {/* Render the unified modal component */}
      <CreateListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchServices}
        type="service" 
      />

      <div className="services-filters">
        <input
          className="search-input"
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            void trackEvent('service_search', { query: e.target.value })
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
                void trackEvent('service_filter', { category: cat })
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

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
            {filtered.map(service => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                price={service.price}
                provider={service.profiles?.username || 'Unknown'}
                verified={service.profiles?.verified || service.profiles?.verification_status === 'verified'}
                userId={service.user_id}
                listingId={service.id}
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