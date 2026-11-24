import { createClient } from '@supabase/supabase-js'
import { DEMO_URL, demoAuthStorage, installDemo } from './demo/mock'

// Demo build only (VITE_DEMO=1): sample data instead of a database. Dead code in the real site.
const demo = import.meta.env.VITE_DEMO === '1'
if (demo) installDemo()

const supabaseUrl = demo ? DEMO_URL : import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = demo ? 'demo' : import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/** false when the site was built without its Supabase settings. */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// createClient throws on an empty URL, which would leave a blank page; use a
// placeholder so the app can show a clear "not set up" message instead.
export const supabase = createClient(
  supabaseConfigured ? supabaseUrl : 'https://not-configured.invalid',
  supabaseConfigured ? supabaseAnonKey : 'missing',
  demo ? { auth: { storage: demoAuthStorage(), autoRefreshToken: false, detectSessionInUrl: false } } : undefined,
)
