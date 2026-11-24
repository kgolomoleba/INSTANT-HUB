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
}

const toFarm = (r: Row): Farm => ({
  id: r.id,
  name: r.name,
  lat: r.lat,
  lon: r.lon,
  boundary: r.boundary ?? undefined,
  areaHa: r.area_ha ?? undefined,
  source: r.source ?? undefined,
})

const toRow = (f: Farm): Row => ({
  id: f.id,
  name: f.name,
  lat: f.lat,
  lon: f.lon,
  boundary: f.boundary ?? null,
  area_ha: f.areaHa ?? null,
  source: f.source ?? null,
})

function need(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function fetchFarms(): Promise<Farm[]> {
  const { data, error } = await need()
    .from('berg_farms')
    .select('id,name,lat,lon,boundary,area_ha,source')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as Row[]).map(toFarm)
}

export async function insertFarms(farms: Farm[]): Promise<void> {
  if (!farms.length) return
  const { error } = await need()
    .from('berg_farms')
    .upsert(farms.map(toRow), { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

export async function deleteFarm(id: string): Promise<void> {
  const { error } = await need().from('berg_farms').delete().eq('id', id)
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
