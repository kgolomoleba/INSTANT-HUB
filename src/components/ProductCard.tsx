import React from 'react'
import './ProductCard.css'

interface ProductCardProps {
  title: string
  description: string
  price: number
  seller: string
  imageUrl?: string
  location?: string
  onClick?: () => void
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
      {imageUrl ? (
        <div className="product-image-wrapper">
          <img src={imageUrl} alt={title} className="product-image" />
          <span className="product-badge">Featured</span>
        </div>
      ) : (
        <div className="product-image-wrapper">
          <img src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=400&q=80" alt="Real person" className="product-image" />
          <span className="product-badge">Featured</span>
        </div>
      )}
      <h3 className="product-title">{title}</h3>
      <p className="product-description">{description}</p>
      <div className="product-meta">
        <span className="product-seller">By: {seller}</span>
        {location && <span className="product-location"> | {location}</span>}
      </div>
      <div className="product-extra">
        <span className="product-rating" title="User rating">★ 4.8</span>
        <span className="product-stock">In Stock</span>
      </div>
      <div className="product-price">
        <strong>${price.toFixed(2)}</strong>
      </div>
    </div>
  )
}

export default ProductCard
