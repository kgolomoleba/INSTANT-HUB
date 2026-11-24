import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/** false when the site was built without its Supabase settings. */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// createClient throws on an empty URL, which would leave a blank page; use a
// placeholder so the app can show a clear "not set up" message instead.
export const supabase = createClient(supabaseConfigured ? supabaseUrl : 'https://not-configured.invalid', supabaseConfigured ? supabaseAnonKey : 'missing')
