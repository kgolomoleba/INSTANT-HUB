import React, { useState } from 'react'
import { trackEvent } from '../utils/analytics'
import './ProductCard.css'
import ContactModal from './Contactmodal'

interface ProductCardProps {
  title: string
  description: string
  price: number
  seller: string
  verified?: boolean
  userId?: string
  listingId?: string
  imageUrl?: string
  location?: string
  onClick?: () => void
}

const ProductCard: React.FC<ProductCardProps> = ({
  title,
  description,
  price,
  seller,
  verified,
  userId,
  listingId,
  imageUrl,
  location,
  onClick,
}) => {
  const [showContact, setShowContact] = useState(false)
  const isVerified = Boolean(verified)
  const statusLabel = isVerified ? 'Verified seller' : location ? 'Local supplier' : 'New listing'

  return (
    <>
      <div
        className={`product-card ${isVerified ? 'is-verified' : 'is-unverified'}`}
        onClick={() => {
          onClick?.()
          void trackEvent('view_listing', { listing_type: 'product', title, seller, user_id: userId })
        }}
        tabIndex={0}
        role="article"
      >
        <div className="product-image-wrapper">
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=400&q=80'}
            alt={title}
            className="product-image"
          />
          <span className="product-badge">{statusLabel}</span>
        </div>
        <div className="product-content">
          <div className="product-heading-row">
            <h3 className="product-title">{title}</h3>
            <div className="product-price">
              <strong>R{price.toFixed(2)}</strong>
            </div>
          </div>
          <p className="product-description">{description}</p>
          <div className="product-meta">
            <span className="product-seller">
              By {seller}
              {isVerified && <span className="verified-badge">Verified</span>}
            </span>
            {location && <span className="product-location">{location}</span>}
          </div>
          <div className="product-extra">
            <span className="product-rating">★ 4.8</span>
            <span className="product-stock">In Stock</span>
          </div>
        </div>
        {userId && (
          <button
            className="btn-contact"
            onClick={e => {
              e.stopPropagation()
              void trackEvent('contact_seller_click', { listing_type: 'product', title, seller, seller_id: userId })
              setShowContact(true)
            }}
          >
            Send Inquiry
          </button>
        )}
      </div>

      {showContact && userId && (
        <ContactModal
          recipientId={userId}
          recipientUsername={seller}
          listingTitle={title}
          listingType="product"
          listingId={listingId}
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  )
}

export default ProductCard