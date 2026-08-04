import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { trackEvent } from '../utils/analytics'
import './Contactmodal.css'

interface ContactModalProps {
  recipientId: string
  recipientUsername: string
  listingTitle: string
  listingType: 'product' | 'service'
  listingId?: string
  onClose: () => void
}

export default function ContactModal({
  recipientId,
  recipientUsername,
  listingTitle,
  listingType,
  listingId,
  onClose,
}: ContactModalProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to send a message.')
      if (user.id === recipientId) throw new Error("You can't contact yourself.")

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      const { error } = await supabase.from('inquiries').insert([{
        sender_id: user.id,
        sender_username: profile?.username || user.email,
        recipient_id: recipientId,
        recipient_username: recipientUsername,
        listing_id: listingId ?? null,
        listing_type: listingType,
        listing_title: listingTitle,
        message: message.trim(),
        status: 'sent',
      }])
      
      if (error) throw error
      
      void trackEvent('contact_seller', {
        sender_id: user.id,
        recipient_id: recipientId,
        listing_type: listingType,
        listing_title: listingTitle,
      })
      
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">Close</button>

        {sent ? (
          <div className="modal-sent">
            <span className="modal-sent-icon">Sent</span>
            <h3>Inquiry Sent</h3>
            <p>Your inquiry about <strong>{listingTitle}</strong> has been sent to <strong>{recipientUsername}</strong>.</p>
            <button className="btn-modal-gold" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3>Send Inquiry</h3>
              <p>Sending inquiry to <strong>{recipientUsername}</strong> about <strong>{listingTitle}</strong></p>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <form onSubmit={handleSend} className="modal-form">
              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Hi ${recipientUsername}, I'm interested in your ${listingType} "${listingTitle}". Could you tell me more?`}
                rows={5}
                required
                maxLength={500}
                disabled={sending}
              />
              <span className="modal-hint">{message.length}/500</span>
              <button type="submit" className="btn-modal-gold" disabled={sending || !message.trim()}>
                {sending ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}