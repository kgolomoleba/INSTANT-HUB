import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdlynoddikajnvkokqof.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbHlub2RkaWtham52a29rcW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODYwNzksImV4cCI6MjA2OTM2MjA3OX0.TENynSPolfL9aQc4mlvFg_mamDH1sMr-wJvlde5iiNY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
