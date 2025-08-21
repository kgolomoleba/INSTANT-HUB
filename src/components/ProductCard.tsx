import React from 'react';

interface ProductCardProps {
  title: string;
  description: string;
  price: number;
  seller: string;
  imageUrl?: string;
  location?: string;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  title,
  description,
  price,
  seller,
  imageUrl,
  location,
  onClick,
}) => {
  return (
    <div className="product-card" onClick={onClick} tabIndex={0} role="button">
      {imageUrl && (
        <img src={imageUrl} alt={title} className="product-image" />
      )}
      <h3 className="product-title">{title}</h3>
      <p className="product-description">{description}</p>
      <div className="product-meta">
        <span className="product-seller">By: {seller}</span>
        {location && <span className="product-location"> | {location}</span>}
      </div>
      <div className="product-price">
        <strong>${price.toFixed(2)}</strong>
      </div>
    </div>
  );
};

export default ProductCard;