import { useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { withProfiles } from '../utils/publicProfiles'
import { ListingSkeletons } from '../components/ui/Skeleton'
import { SERVICE_CATEGORIES, matchesCategory } from '../utils/categories'
import { trackEvent } from '../utils/analytics'
import ServiceCard from '../components/ServiceCard'
import { CreateListingModal } from '../components/CreateListingModal'
import './Listings.css'
import { errorMessage } from '../utils/errors'

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

const CATEGORIES = ['All', ...SERVICE_CATEGORIES]

const ServicesPage: React.FC = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Replaced showForm with isModalOpen
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  // A shared listing link opens with its name in the search box.
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '')

  const fetchServices = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setServices(await withProfiles((data ?? []) as Service[]))
    } catch (err) {
      setError(errorMessage(err, 'Failed to load services.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  const filtered = services.filter((s) => {
    const matchCategory = matchesCategory(s.category, selectedCategory, SERVICE_CATEGORIES)
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <main className="services-container">
      <header className="page-head">
        <div>
          <h1>Services</h1>
          <p>Find skilled people and businesses near you.</p>
        </div>
        <div className="actions">
          <button
            className="btn-secondary"
            onClick={() => {
              void trackEvent('navigate_to_products', {})
              navigate('/products')
            }}
          >
            Products
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setIsModalOpen(true)
              setError(null)
              void trackEvent('service_form_toggle', { showForm: true })
            }}
          >
            + Add service
          </button>
        </div>
      </header>

      {/* Render the unified modal component */}
      <CreateListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchServices}
        type="service" 
      />

      <div className="listing-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search services"
          aria-label="Search services"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            void trackEvent('service_search', { query: e.target.value })
          }}
          maxLength={100}
        />
        <div className="chip-row" role="group" aria-label="Category">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={selectedCategory === cat ? 'active' : ''}
              aria-pressed={selectedCategory === cat}
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
          <ListingSkeletons />
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