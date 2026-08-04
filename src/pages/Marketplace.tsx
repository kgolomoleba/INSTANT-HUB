import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ProductCard from '../components/ProductCard'
import ServiceCard from '../components/ServiceCard'
import './Marketplace.css'

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

type Tab = 'all' | 'products' | 'services'

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('products').select('*, profiles(*)').order('created_at', { ascending: false }).limit(12),
        supabase.from('services').select('*, profiles(*)').order('created_at', { ascending: false }).limit(12),
      ])
      setProducts(p || [])
      setServices(s || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredServices = services.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  )

  const showProducts = tab === 'all' || tab === 'products'
  const showServices = tab === 'all' || tab === 'services'

  return (
    <main className="marketplace-container">
      <section className="marketplace-hero">
        <div className="marketplace-hero-grid" aria-hidden="true" />
        <span className="marketplace-label">Instant Hub Marketplace</span>
        <h1 className="marketplace-title">MARKETPLACE<br /><span className="marketplace-gold">FOR PRODUCTS & SERVICES</span></h1>
        <div className="marketplace-pill-row">
          <span className="marketplace-pill">Verified • Local</span>
          <span className="marketplace-pill">Fast inquiries</span>
          <span className="marketplace-pill">Trusted businesses</span>
        </div>
        <p className="marketplace-desc">
          Browse verified products and services from trusted businesses, suppliers and local providers.
        </p>
        <p className="marketplace-note">
          The marketplace is for paid product listings and service offers. For hiring, requests and talent sourcing, use the Community Feed.
        </p>
        <div className="marketplace-search-wrap">
          <input
            className="marketplace-search"
            type="text"
            placeholder="Search products and services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search marketplace"
            maxLength={100}
          />
        </div>
        <div className="marketplace-stats">
          <div className="mp-stat">
            <span className="mp-stat-num">{products.length}</span>
            <span className="mp-stat-label">Products</span>
          </div>
          <div className="mp-stat-divider" />
          <div className="mp-stat">
            <span className="mp-stat-num">{services.length}</span>
            <span className="mp-stat-label">Services</span>
          </div>
          <div className="mp-stat-divider" />
          <div className="mp-stat">
            <span className="mp-stat-num">ZA</span>
            <span className="mp-stat-label">Based</span>
          </div>
        </div>
      </section>

      <div className="marketplace-tabs">
        {(['all', 'products', 'services'] as Tab[]).map(t => (
          <button
            key={t}
            className={`marketplace-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'all' ? 'All Listings' : t === 'products' ? 'Products' : 'Services'}
          </button>
        ))}
        <div className="marketplace-tab-actions">
          <Link to="/products" className="btn-mp-outline">List Product</Link>
          <Link to="/services" className="btn-mp-outline">Offer Service</Link>
        </div>
      </div>

      {loading ? (
        <p className="marketplace-loading">Loading marketplace...</p>
      ) : (
        <>
          {showProducts && (
            <section className="marketplace-section">
              <div className="marketplace-section-header">
                <h2>Products</h2>
                <Link to="/products" className="marketplace-see-all">See all →</Link>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="marketplace-empty">
                  <p>No products found. <Link to="/products">Be the first to list one!</Link></p>
                </div>
              ) : (
                <div className="marketplace-grid">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      title={product.title}
                      description={product.description}
                      price={product.price}
                      seller={product.profiles?.username || 'Unknown'}
                      verified={product.profiles?.verified || product.profiles?.verification_status === 'verified'}
                      userId={product.user_id}
                      listingId={product.id}
                      imageUrl={product.image_url}
                      location={product.location}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {showServices && (
            <section className="marketplace-section">
              <div className="marketplace-section-header">
                <h2>Services</h2>
                <Link to="/services" className="marketplace-see-all">See all →</Link>
              </div>
              {filteredServices.length === 0 ? (
                <div className="marketplace-empty">
                  <p>No services found. <Link to="/services">Be the first to offer one!</Link></p>
                </div>
              ) : (
                <div className="marketplace-grid">
                  {filteredServices.map(service => (
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
          )}
        </>
      )}
    </main>
  )
}