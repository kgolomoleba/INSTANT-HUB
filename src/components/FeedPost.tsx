import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './FeedPost.css'

export interface FeedPostProps {
  id: string
  type: 'product' | 'service' | 'request' | 'general'
  title: string
  description?: string
  image?: string
  price?: string
  author: string
  createdAt: string
  userId: string
  onDelete?: (id: string) => void
}

const TYPE_COLORS: Record<string, string> = {
  product: 'badge-product',
  service: 'badge-service',
  request: 'badge-request',
  general: 'badge-general',
}

const FeedPost: React.FC<FeedPostProps> = ({
  id,
  type,
  title,
  description,
  image,
  price,
  author,
  createdAt,
  userId,
  onDelete,
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null)
    })
  }, [])

  const isOwner = currentUserId === userId

  return (
    <div className="feed-post">
      {/* Header */}
      <div className="feed-post-header">
        <div className="feed-post-avatar">{author?.[0]?.toUpperCase() || '?'}</div>
        <div className="feed-post-meta">
          <span className="feed-post-author">{author}</span>
          <span className="feed-post-date">{createdAt}</span>
        </div>
        <span className={`feed-post-badge ${TYPE_COLORS[type]}`}>
          {type.toUpperCase()}
        </span>
        {isOwner && onDelete && (
          <button
            className="feed-post-delete"
            onClick={() => onDelete(id)}
            title="Delete post"
            aria-label="Delete post"
          >
            Delete
          </button>
        )}
      </div>

      {/* Image */}
      {image && (
        <div className="feed-post-image-wrapper">
          <img src={image} alt={title} className="feed-post-image" />
        </div>
      )}

      {/* Content */}
      <div className="feed-post-body">
        <h3 className="feed-post-title">{title}</h3>
        {description && <p className="feed-post-desc">{description}</p>}
        {price && <span className="feed-post-price">{price}</span>}
      </div>

      {/* Actions */}
      <div className="feed-post-actions">
        <button className="feed-action-btn">Message</button>
        {type === 'product' && <button className="feed-action-btn">Buy Now</button>}
        {type === 'service' && <button className="feed-action-btn">Hire</button>}
        {type === 'request' && <button className="feed-action-btn">Help Out</button>}
        {type === 'general' && <button className="feed-action-btn">Like</button>}
      </div>
    </div>
  )
}

export default FeedPost