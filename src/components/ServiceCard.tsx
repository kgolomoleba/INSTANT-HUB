import React, { useState } from 'react'
import { trackEvent } from '../utils/analytics'
import './ServiceCard.css'
import ContactModal from './Contactmodal'

interface ServiceCardProps {
  title: string
  description: string
  price: number
  provider: string
  verified?: boolean
  userId?: string
  listingId?: string
  location?: string
  imageUrl?: string
  onClick?: () => void
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  price,
  provider,
  verified,
  userId,
  listingId,
  location,
  imageUrl,
  onClick,
}) => {
  const [showContact, setShowContact] = useState(false)
  const isVerified = Boolean(verified)
  const statusLabel = isVerified ? 'Verified provider' : location ? 'Local service' : 'New service'

  return (
    <>
      <div
        className={`service-card ${isVerified ? 'is-verified' : 'is-unverified'}`}
        onClick={() => {
          onClick?.()
          void trackEvent('view_listing', { listing_type: 'service', title, provider, user_id: userId })
        }}
        tabIndex={0}
        role="article"
      >
        <div className="service-avatar-wrapper">
          <img
            src={imageUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'}
            alt={title}
            className="service-avatar"
          />
          <span className="service-badge">{statusLabel}</span>
        </div>
        <div className="service-content">
          <div className="service-heading-row">
            <h3 className="service-title">{title}</h3>
            <div className="service-price">
              <strong>R{price.toFixed(2)}</strong>
            </div>
          </div>
          <p className="service-description">{description}</p>
          <div className="service-meta">
            <span className="service-provider">
              By {provider}
              {isVerified && <span className="verified-badge">Verified</span>}
            </span>
            {location && <span className="service-location">{location}</span>}
          </div>
          <div className="service-extra">
            <span className="service-rating">★ 4.9</span>
            <span className="service-availability">Available</span>
          </div>
        </div>
        {userId && (
          <button
            className="btn-contact"
            onClick={e => {
              e.stopPropagation()
              void trackEvent('contact_seller_click', { listing_type: 'service', title, provider, provider_id: userId })
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
          recipientUsername={provider}
          listingTitle={title}
          listingType="service"
          listingId={listingId}
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  )
}

export default ServiceCard