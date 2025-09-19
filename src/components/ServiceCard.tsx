import React from 'react'
import './ServiceCard.css'

interface ServiceCardProps {
  title: string
  description: string
  price: number
  provider: string
  location?: string
  onClick?: () => void
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  price,
  provider,
  location,
  onClick,
}) => {
  return (
    <div className="service-card" onClick={onClick} tabIndex={0} role="button">
      <div className="service-avatar-wrapper">
        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" alt="Real person" className="service-avatar" />
        <span className="service-badge">Top Rated</span>
      </div>
      <h3 className="service-title">{title}</h3>
      <p className="service-description">{description}</p>
      <div className="service-meta">
        <span className="service-provider">By: {provider}</span>
        {location && <span className="service-location"> | {location}</span>}
      </div>
      <div className="service-extra">
        <span className="service-rating" title="User rating">★ 4.9</span>
        <span className="service-availability">Available</span>
      </div>
      <div className="service-price">
        <strong>${price.toFixed(2)}</strong>
      </div>
    </div>
  )
}

export default ServiceCard
