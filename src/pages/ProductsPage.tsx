import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { trackEvent } from '../utils/analytics'
import ProductCard from '../components/ProductCard'
import { CreateListingModal } from '../components/CreateListingModal'
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

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Replaced showForm with isModalOpen
  const [isModalOpen, setIsModalOpen] = useState(false) 
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

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
              setIsModalOpen(true)
              setError(null)
              void trackEvent('product_form_toggle', { showForm: true })
            }}
          >
            + Add Product
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

      {/* Render the unified modal component instead of inline form */}
      <CreateListingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProducts}
        type="product" 
      />

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
        ) : error ? (
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
                listingId={product.id}
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