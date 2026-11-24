import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { installDemo } from './demo'

// Demo build only (VITE_DEMO=1): sample data instead of the real services. Dead code in the real site.
const demo = import.meta.env.VITE_DEMO === '1'
if (demo) installDemo()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Installable app + works offline. Only in the built site, not while developing.
if (import.meta.env.PROD && !demo && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* not supported here; the app still works */
    })
  })
}
