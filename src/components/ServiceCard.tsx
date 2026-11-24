import { placeholderImage } from '../utils/placeholder'
import ShareButton from './ui/ShareButton'
import React, { useState } from 'react'
import { trackEvent } from '../utils/analytics'
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
            src={imageUrl || placeholderImage(title)}
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
        </div>
        <div className="card-actions">
          <ShareButton title={title} text={`${title} on Instant Hub`} url={`${window.location.origin}/services?q=${encodeURIComponent(title)}`} className="btn-share" />
          {userId && (
          <button
            className="btn-contact"
            onClick={e => {
              e.stopPropagation()
              void trackEvent('contact_seller_click', { listing_type: 'service', title, provider, provider_id: userId })
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