import {
  createClient,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js'
import type { Farm } from './farms'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null when the app runs without Supabase: farms then live in this browser only. */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

type Row = {
  id: string
  name: string
  lat: number
  lon: number
  boundary: Farm['boundary'] | null
  area_ha: number | null
  source: Farm['source'] | null
  season?: Farm['season'] | null
}

const toFarm = (r: Row): Farm => ({
  id: r.id,
  name: r.name,
  lat: r.lat,
  lon: r.lon,
  boundary: r.boundary ?? undefined,
  areaHa: r.area_ha ?? undefined,
  source: r.source ?? undefined,
  season: r.season ?? undefined,
})

const toRow = (f: Farm): Row => ({
  id: f.id,
  name: f.name,
  lat: f.lat,
  lon: f.lon,
  boundary: f.boundary ?? null,
  area_ha: f.areaHa ?? null,
  source: f.source ?? null,
  season: f.season ?? null,
})

function need(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function fetchFarms(): Promise<Farm[]> {
  const sb = need()
  const cols = 'id,name,lat,lon,boundary,area_ha,source'
  const load = (select: string) =>
    sb
      .from('berg_farms')
      .select(select)
      .order('created_at', { ascending: false })
  let res = await load(`${cols},season`)
  // Database without the season column yet (migration not applied): load without it.
  if (res.error && /season/i.test(res.error.message)) res = await load(cols)
  if (res.error) throw new Error(res.error.message)
  return (res.data as unknown as Row[]).map(toFarm)
}

export async function insertFarms(farms: Farm[]): Promise<void> {
  if (!farms.length) return
  const sb = need()
  const rows = farms.map(toRow)
  let { error } = await sb
    .from('berg_farms')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  // Database without the season column yet: save without it.
  if (error && /season/i.test(error.message))
    ({ error } = await sb.from('berg_farms').upsert(
      rows.map(({ season: _s, ...r }) => r),
      { onConflict: 'id', ignoreDuplicates: true }
    ))
  if (error) throw new Error(error.message)
}

export async function deleteFarm(id: string): Promise<void> {
  const { error } = await need().from('berg_farms').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function setFarmSeason(
  id: string,
  season: Farm['season']
): Promise<void> {
  const { error } = await need()
    .from('berg_farms')
    .update({ season })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function renameFarm(id: string, name: string): Promise<void> {
  const { error } = await need()
    .from('berg_farms')
    .update({ name })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function sendSignInLink(email: string): Promise<void> {
  const { error } = await need().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
    },
  })
  if (error) throw new Error(error.message)
}

export function onSession(cb: (s: Session | null) => void): () => void {
  if (!supabase) return () => {}
  supabase.auth.getSession().then(({ data }) => cb(data.session))
  const { data } = supabase.auth.onAuthStateChange((_e, s) => cb(s))
  return () => data.subscription.unsubscribe()
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

/** A new farm id that is valid both locally and as the database's uuid. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Farms saved by an older version used ids like "u1700000000000"; give them uuids. */
export function withUuid(f: Farm): Farm {
  return UUID.test(f.id) ? f : { ...f, id: newId() }
}

// ------------------------------------------------------------------- diary
export type DiaryEntry = {
  id: string
  farmId: string
  day: string
  note: string
}

type DiaryRow = { id: string; farm_id: string; day: string; note: string }

export async function fetchDiary(): Promise<DiaryEntry[]> {
  const { data, error } = await need()
    .from('berg_farm_diary')
    .select('id,farm_id,day,note')
    .order('day')
  if (error) throw new Error(error.message)
  return (data as DiaryRow[]).map((r) => ({
    id: r.id,
    farmId: r.farm_id,
    day: r.day,
    note: r.note,
  }))
}

export async function insertDiary(entries: DiaryEntry[]): Promise<void> {
  if (!entries.length) return
  const { error } = await need()
    .from('berg_farm_diary')
    .upsert(
      entries.map((e) => ({
        id: e.id,
        farm_id: e.farmId,
        day: e.day,
        note: e.note,
      })),
      { onConflict: 'id', ignoreDuplicates: true }
    )
  if (error) throw new Error(error.message)
}

export async function deleteDiary(id: string): Promise<void> {
  const { error } = await need().from('berg_farm_diary').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------- explanations
/** Ask the farm-explain function (Claude) for a plain-language summary. Signed-in users only. */
export async function explainSeason(
  payload: Record<string, unknown>
): Promise<string> {
  const { data, error } = await need().functions.invoke<{
    text?: string
    error?: string
  }>('farm-explain', { body: payload })
  if (error) {
    // The function's own message is friendlier than the transport error.
    const ctx = (error as { context?: Response }).context
    const body = ctx ? await ctx.json().catch(() => null) : null
    throw new Error(
      body?.error ?? 'The explanation service had a problem. Try again.'
    )
  }
  if (!data?.text)
    throw new Error(data?.error ?? 'No explanation came back. Try again.')
  return data.text
}
