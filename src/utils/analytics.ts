/* Lightweight analytics wrapper: GA4 (if present) + Supabase events fallback
   - Uses global `gtag` if loaded via index.html (GA4) to send events
   - Attempts to write events to a Supabase `events` table (best-effort)
   - Exported helpers: initAnalytics, trackEvent, trackPageView, setUserProperties
*/
import { supabase } from '../supabaseClient'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function initAnalytics() {
  // noop for now — prefer injecting GA via index.html with a real MEASUREMENT_ID
  // This keeps init idempotent and lightweight.
  if (typeof window === 'undefined') return
  // Optionally you could read process.env for a GA id and inject script here.
}

export async function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  try {
    // Send to GA4 via gtag if available
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, params)
      } catch (e) {
        // ignore GA errors
        console.debug('gtag error', e)
      }
    }

    // Best-effort write to Supabase `events` table for custom querying
    // Table schema assumption: { id, event_name, properties, user_id, created_at }
    await supabase.from('events').insert([
      {
        event_name: eventName,
        properties: params,
        user_id: params.user_id ?? null,
        created_at: new Date().toISOString(),
      },
    ])
  } catch (e) {
    // ignore to avoid breaking UI flows
    console.debug('analytics trackEvent failed', e)
  }
}

export function trackPageView(path: string, params: Record<string, unknown> = {}) {
  trackEvent('page_view', { path, ...params })
}

export function setUserProperties(userId: string, props: Record<string, unknown> = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('set', { user_id: userId, ...props })
    }
  } catch (e) {
    console.debug('setUserProperties failed', e)
  }
}

export default {
  initAnalytics,
  trackEvent,
  trackPageView,
  setUserProperties,
}
