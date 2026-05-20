import React, { useState } from 'react'
import './ProductCard.css'
import ContactModal from './Contactmodal'

interface ProductCardProps {
  title: string
  description: string
  price: number
  seller: string
  userId?: string
  imageUrl?: string
  location?: string
  onClick?: () => void
}

const ProductCard: React.FC<ProductCardProps> = ({
  title,
  description,
  price,
  seller,
  userId,
  imageUrl,
  location,
  onClick,
}) => {
  const [showContact, setShowContact] = useState(false)

  return (
    <>
      <div className="product-card" onClick={onClick} tabIndex={0} role="article">
        <div className="product-image-wrapper">
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=400&q=80'}
            alt={title}
            className="product-image"
          />
          <span className="product-badge">Featured</span>
        </div>
        <h3 className="product-title">{title}</h3>
        <p className="product-description">{description}</p>
        <div className="product-meta">
          <span className="product-seller">By: {seller}</span>
          {location && <span className="product-location"> | {location}</span>}
        </div>
        <div className="product-extra">
          <span className="product-rating">★ 4.8</span>
          <span className="product-stock">In Stock</span>
        </div>
        <div className="product-price">
          <strong>R{price.toFixed(2)}</strong>
        </div>
        {userId && (
          <button
            className="btn-contact"
            onClick={e => { e.stopPropagation(); setShowContact(true) }}
          >
            💬 Contact Seller
          </button>
        )}
      </div>

      {showContact && userId && (
        <ContactModal
          recipientId={userId}
          recipientUsername={seller}
          listingTitle={title}
          listingType="product"
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  )
}

export default ProductCard