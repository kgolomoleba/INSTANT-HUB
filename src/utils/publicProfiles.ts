import { supabase } from '../supabaseClient'

export interface PublicProfile {
  id: string
  username: string | null
  avatar_url: string | null
  verification_status: string | null
}

/** Public name / avatar / verified status for a set of user ids. */
export async function fetchPublicProfiles(ids: string[]): Promise<Map<string, PublicProfile>> {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map<string, PublicProfile>()
  if (!unique.length) return map
  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, username, avatar_url, verification_status')
    .in('id', unique)
  if (error) throw error
  for (const p of (data ?? []) as PublicProfile[]) map.set(p.id, p)
  return map
}

/** Attach each row's author profile as `profiles`, like an embedded select would. */
export async function withProfiles<T extends { user_id: string }>(rows: T[]): Promise<(T & { profiles: PublicProfile | null })[]> {
  const map = await fetchPublicProfiles(rows.map((r) => r.user_id))
  return rows.map((r) => ({ ...r, profiles: map.get(r.user_id) ?? null }))
}
