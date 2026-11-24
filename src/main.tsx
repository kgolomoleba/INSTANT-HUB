import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { supabaseConfigured } from './supabaseClient'
import { ToastProvider } from './components/ui/Toast'
import { initAnalytics } from './utils/analytics'

initAnalytics()

function NotConfigured() {
  return (
    <main style={{ maxWidth: 560, margin: '15vh auto', padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
      <h1 style={{ marginTop: 0 }}>Instant Hub isn't set up yet</h1>
      <p>
        This site was built without its database settings. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the
        hosting settings (or a <code>.env</code> file) and build it again.
      </p>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {supabaseConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <NotConfigured />
    )}
  </React.StrictMode>,
)

// Installable app that opens offline. Only in the built site, not while developing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* not supported here; the site still works */
    })
  })
}
