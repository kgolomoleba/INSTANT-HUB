import React from 'react'
import './ProductsPage.css'
import ProductCard from '../components/ProductCard'


const sampleProducts = [
  {
    title: 'Smart LED Lamp',
    description: 'Touch control, color changing, and voice assistant compatible. Light up your vibe.',
    price: 80,
    seller: 'TechTrendz',
    imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80', // LED lamp
    location: 'Cape Town',
  },
  {
    title: 'Minimalist Backpack',
    description: 'Sleek, waterproof, and perfect for city life. Designed for creators.',
    price: 95,
    seller: 'UrbanNomad',
    imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80', // Backpack
    location: 'Johannesburg',
  },
  {
    title: 'Wireless Charging Pad',
    description: 'Fast charge your devices with this ultra-thin pad. Modern desk essential.',
    price: 40,
    seller: 'ChargeUp',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', // Charging pad
    location: 'Durban',
  },
]

const ProductsPage: React.FC = () => {
  return (
    <main className="products-container">
      <header className="products-header">
        <h1>Products Marketplace</h1>
        <p>Browse and discover products offered by the community. Find unique items, creative services, and more!</p>
        <div className="products-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/add-product'}>Add Product</button>
          <button className="btn-secondary" onClick={() => window.location.href = '/services'}>Explore Services</button>
        </div>
      </header>
      <section className="products-list">
        {sampleProducts.length > 0 ? (
          <div className="products-grid">
            {sampleProducts.map((product, idx) => (
              <ProductCard key={idx} {...product} />
            ))}
          </div>
        ) : (
          <p>No products available yet. Be the first to list a product!</p>
        )}
      </section>
      <aside className="products-info">
        <h2>How It Works</h2>
        <ul>
          <li>List your product for free and reach the community.</li>
          <li>Contact sellers directly for inquiries.</li>
          <li>Secure payments and trusted reviews coming soon!</li>
        </ul>
        <h2>Popular Categories</h2>
        <div className="categories-list">
          <span className="category">Design</span>
          <span className="category">Handmade</span>
          <span className="category">Tutoring</span>
          <span className="category">Tech</span>
          <span className="category">Art</span>
        </div>
      </aside>
    </main>
  )
}

export default ProductsPage
