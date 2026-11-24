import { useEffect, useState } from 'react'
import { useI18n } from './i18n'

export default function OfflineBanner() {
  const { t } = useI18n()
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && !navigator.onLine
  )
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
  return offline ? (
    <div className="offline" role="status">
      {t('app.offline')}
    </div>
  ) : null
}
