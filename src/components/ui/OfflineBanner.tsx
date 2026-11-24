import { useEffect, useState } from 'react'

/** Shown while the phone has no internet; hides itself when it's back. */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (!offline) return null
  return (
    <div className="ui-offline" role="status">
      You're offline. You can keep browsing what's already loaded; changes need a connection.
    </div>
  )
}
