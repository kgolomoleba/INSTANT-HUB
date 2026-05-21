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
  location,
  imageUrl,
  onClick,
}) => {
  const [showContact, setShowContact] = useState(false)
  const statusLabel = verified ? 'Verified provider' : location ? 'Local service' : 'New service'

  return (
    <>
      <div
        className="service-card"
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
        <h3 className="service-title">{title}</h3>
        <p className="service-description">{description}</p>
        <div className="service-meta">
          <span className="service-provider">
            By: {provider}
            {verified && <span className="verified-badge">Verified</span>}
          </span>
          {location && <span className="service-location"> | {location}</span>}
        </div>
        <div className="service-extra">
          <span className="service-rating">★ 4.9</span>
          <span className="service-availability">Available</span>
        </div>
        <div className="service-price">
          <strong>R{price.toFixed(2)}</strong>
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
            Contact Provider
          </button>
        )}
      </div>

      {showContact && userId && (
        <ContactModal
          recipientId={userId}
          recipientUsername={provider}
          listingTitle={title}
          listingType="service"
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  )
}

export default ServiceCard