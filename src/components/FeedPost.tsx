import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import VerifiedBadge from './VerifiedBadge'
import type { VerificationStatus } from './VerifiedBadge'
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
  const [authorVerification, setAuthorVerification] = useState<VerificationStatus>(null)
  const [isInquiring, setIsInquiring] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [actionStatus, setActionStatus] = useState<{ success?: boolean; error?: string | null }>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setAuthorVerification((data?.verification_status as VerificationStatus) ?? 'unverified')
      })
  }, [userId])

  const isOwner = currentUserId === userId

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !currentUserId) return

    setActionStatus({})
    try {
      // Fetch sender's profile username
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUserId)
        .single()

      const { error } = await supabase.from('inquiries').insert([{
        sender_id: currentUserId,
        recipient_id: userId,
        sender_username: senderProfile?.username || 'Anonymous User',
        listing_type: type,
        listing_title: title,
        message: messageText.trim(),
        read: false
      }])

      if (error) throw error

      setActionStatus({ success: true })
      setMessageText('')
      setTimeout(() => setIsInquiring(false), 2000)
    } catch (err: any) {
      setActionStatus({ error: err.message || 'Failed to dispatch your request link.' })
    }
  }

  return (
    <div className="feed-post">
      {/* Header */}
      <div className="feed-post-header">
        <div className="feed-post-avatar">{author?.[0]?.toUpperCase() || '?'}</div>
        <div className="feed-post-meta">
          <span className="feed-post-author-row">
            <span className="feed-post-author">@{author}</span>
            <VerifiedBadge status={authorVerification} />
          </span>
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
            type="button"
          >
            Delete
          </button>
        )}
      </div>

      {/* Image */}
      {image && (
        <div className="feed-post-image-wrapper">
          <img 
            src={image} 
            alt={title} 
            className="feed-post-image" 
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/23262f/ffffff?text=Image+Unavailable'
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="feed-post-body">
        <div className="feed-post-title-row">
          <h3 className="feed-post-title">{title}</h3>
          {price && <span className="feed-post-price">{price}</span>}
        </div>
        {description && <p className="feed-post-desc">{description}</p>}
      </div>

      {/* Actions Selector Panel */}
      <div className="feed-post-actions">
        {!isOwner && (
          <button 
            className={`feed-action-btn ${isInquiring ? 'active' : ''}`} 
            onClick={() => setIsInquiring(!isInquiring)}
            type="button"
          >
            {isInquiring ? 'Cancel' : 'Message'}
          </button>
        )}
        {type === 'product' && <button className="feed-action-btn btn-accent" onClick={() => setIsInquiring(true)} type="button">Buy Now</button>}
        {type === 'service' && <button className="feed-action-btn btn-accent" onClick={() => setIsInquiring(true)} type="button">Hire</button>}
        {type === 'request' && <button className="feed-action-btn btn-accent" onClick={() => setIsInquiring(true)} type="button">Help Out</button>}
        {type === 'general' && <button className="feed-action-btn" type="button">Like</button>}
      </div>

      {/* Inline Messenger Dropdown View */}
      {isInquiring && (
        <div className="feed-post-inquiry-box">
          <h4>Inquire about this {type}</h4>
          {actionStatus.success && <p className="success-text">Message dispatched successfully!</p>}
          {actionStatus.error && <p className="error-text">{actionStatus.error}</p>}
          
          <form onSubmit={handleInquirySubmit}>
            <textarea
              placeholder={`Hi @${author}, I'm interested in this...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
              maxLength={400}
              rows={3}
            />
            <button className="btn-primary" type="submit" disabled={!messageText.trim()}>
              Send Message
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default FeedPost