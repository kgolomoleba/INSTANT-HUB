import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './AdminPage.css'

interface PendingVerification {
  id: string
  username: string
  avatar_url: string | null
  verification_method: string | null
  verification_reference: string | null
  verification_note: string | null
  verification_document_url: string | null
  verification_submitted_at: string | null
}

const AdminPage = () => {
  const [requests, setRequests] = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadRequests = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, verification_method, verification_reference, verification_note, verification_document_url, verification_submitted_at')
      .eq('verification_status', 'pending')
      .order('verification_submitted_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setRequests(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleDecision = async (id: string, decision: 'verified' | 'unverified') => {
    setProcessingId(id)
    setError(null)

    const updates: Record<string, unknown> = {
      verification_status: decision,
    }
    if (decision === 'verified') {
      updates.verification_approved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)

    if (error) {
      setError(error.message)
      setProcessingId(null)
      return
    }

    setRequests((prev) => prev.filter((r) => r.id !== id))
    setProcessingId(null)
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Verification Requests</h1>
        <p>Review and approve pending business verification submissions.</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <div className="loading-text">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="admin-empty-state">
          <p>No pending verification requests.</p>
        </div>
      ) : (
        <div className="admin-grid">
          {requests.map((req) => (
            <div className="admin-card" key={req.id}>
              <div className="admin-card-header">
                <div className="admin-card-avatar">
                  {req.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="admin-card-username">@{req.username}</p>
                  {req.verification_submitted_at && (
                    <p className="admin-card-date">
                      Submitted {new Date(req.verification_submitted_at).toLocaleDateString('en-ZA')}
                    </p>
                  )}
                </div>
              </div>

              <div className="admin-card-body">
                {req.verification_method && (
                  <div className="admin-field">
                    <span className="admin-field-label">Method</span>
                    <span className="admin-field-value">{req.verification_method}</span>
                  </div>
                )}
                {req.verification_reference && (
                  <div className="admin-field">
                    <span className="admin-field-label">Reference</span>
                    <span className="admin-field-value">{req.verification_reference}</span>
                  </div>
                )}
                {req.verification_note && (
                  <div className="admin-field">
                    <span className="admin-field-label">Note</span>
                    <span className="admin-field-value">{req.verification_note}</span>
                  </div>
                )}
                {req.verification_document_url && (
                  
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-doc-link"
                  >
                    View submitted document
                  </a>
                )}
              </div>

              <div className="admin-card-actions">
                <button
                  className="admin-btn admin-btn-approve"
                  onClick={() => handleDecision(req.id, 'verified')}
                  disabled={processingId === req.id}
                  type="button"
                >
                  {processingId === req.id ? 'Working...' : 'Approve'}
                </button>
                <button
                  className="admin-btn admin-btn-reject"
                  onClick={() => handleDecision(req.id, 'unverified')}
                  disabled={processingId === req.id}
                  type="button"
                >
                  {processingId === req.id ? 'Working...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPage
