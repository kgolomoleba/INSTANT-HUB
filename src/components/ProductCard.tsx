import { placeholderImage } from '../utils/placeholder'
import ShareButton from './ui/ShareButton'
import React, { useState } from 'react'
import { trackEvent } from '../utils/analytics'
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
            src={imageUrl || placeholderImage(title)}
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
        </div>
        <div className="card-actions">
          <ShareButton title={title} text={`${title} on Instant Hub`} url={`${window.location.origin}/products?q=${encodeURIComponent(title)}`} className="btn-share" />
          {userId && (
          <button
            className="btn-contact"
            onClick={e => {
              e.stopPropagation()
              void trackEvent('contact_seller_click', { listing_type: 'product', title, seller, seller_id: userId })
              setShowContact(true)
            }}
          >
            Send inquiry
          </button>
        )}
          </div>
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