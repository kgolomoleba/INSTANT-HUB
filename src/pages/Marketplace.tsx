import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { withProfiles } from '../utils/publicProfiles'
import { ListingSkeletons } from '../components/ui/Skeleton'
import ProductCard from '../components/ProductCard'
import ServiceCard from '../components/ServiceCard'
import './Listings.css'
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
  const [totals, setTotals] = useState({ products: 0, services: 0 })
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [{ data: p, count: pc }, { data: s, count: sc }] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
          supabase.from('services').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(12),
        ])
        setTotals({ products: pc ?? (p ?? []).length, services: sc ?? (s ?? []).length })
        const [pp, ss] = await Promise.all([withProfiles((p ?? []) as Product[]), withProfiles((s ?? []) as Service[])])
        setProducts(pp)
        setServices(ss)
      } catch {
        // Listings still show without author details.
      } finally {
        setLoading(false)
      }
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
      <header className="page-head">
        <div>
          <h1>Marketplace</h1>
          <p>
            {totals.products} products and {totals.services} services from local businesses. Hiring or asking for help? Use the{' '}
            <Link to="/feed">Community Feed</Link>.
          </p>
        </div>
        <div className="actions">
          <Link to="/products" className="btn-secondary">List a product</Link>
          <Link to="/services" className="btn-primary">Offer a service</Link>
        </div>
      </header>

      <div className="listing-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search products and services"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search marketplace"
          maxLength={100}
        />
        <div className="chip-row" role="group" aria-label="Show">
          {(['all', 'products', 'services'] as Tab[]).map(t => (
            <button key={t} className={tab === t ? 'active' : ''} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === 'all' ? 'Everything' : t === 'products' ? 'Products' : 'Services'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ListingSkeletons />
      ) : (
        <>
          {showProducts && (
            <section className="marketplace-section">
              <div className="marketplace-section-header">
                <h2>Products</h2>
                <Link to="/products" className="marketplace-see-all">See all</Link>
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
                <Link to="/services" className="marketplace-see-all">See all</Link>
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