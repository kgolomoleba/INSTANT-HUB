import React from 'react'
import './VerifiedBadge.css'

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | null | undefined

interface VerifiedBadgeProps {
  status: VerificationStatus
  size?: 'sm' | 'md'
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ status, size = 'sm' }) => {
  if (!status || status === 'unverified') return null

  if (status === 'pending') {
    return (
      <span className={`verified-badge verified-badge-pending verified-badge-${size}`} title="Verification pending">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }

  return (
    <span className={`verified-badge verified-badge-verified verified-badge-${size}`} title="Verified">
      <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 1.5l2.09 1.66 2.63-.4.87 2.52 2.52.87-.4 2.63L19.37 10l-1.66 2.09.4 2.63-2.52.87-.87 2.52-2.63-.4L10 18.5l-2.09-1.66-2.63.4-.87-2.52-2.52-.87.4-2.63L.63 10l1.66-2.09-.4-2.63 2.52-.87.87-2.52 2.63.4L10 1.5zm3.7 6.2a.9.9 0 00-1.27-1.28l-3.68 3.68-1.68-1.68a.9.9 0 10-1.27 1.27l2.32 2.32a.9.9 0 001.27 0l4.31-4.31z"
        />
      </svg>
    </span>
  )
}

export default VerifiedBadge
