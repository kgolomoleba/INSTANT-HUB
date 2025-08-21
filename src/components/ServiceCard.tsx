import React from 'react';

interface ServiceCardProps {
  title: string;
  description: string;
  price: number;
  provider: string;
  location?: string;
  onClick?: () => void;
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
      <h3 className="service-title">{title}</h3>
      <p className="service-description">{description}</p>
      <div className="service-meta">
        <span className="service-provider">By: {provider}</span>
        {location && <span className="service-location"> | {location}</span>}
      </div>
      <div className="service-price">
        <strong>${price.toFixed(2)}</strong>
      </div>
    </div>
  );
};

export default ServiceCard;