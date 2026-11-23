import type { MultiPolygon } from './geo'
import { CFM_SG_SERVICE } from './boundaries'

export type Farm = {
  id: string
  name: string
  lat: number
  lon: number
  /** Farm boundary, [lon, lat] coordinates, from Cape Farm Mapper or an imported file. */
  boundary?: MultiPolygon
  areaHa?: number
  source?: 'map point' | 'Cape Farm Mapper' | 'file'
}

/** The Berg River's course, roughly, for drawing on the map. */
export const RIVER_LINE: [number, number][] = [
  [-33.93, 19.07],
  [-33.84, 19.02],
  [-33.73, 18.97],
  [-33.64, 18.98],
  [-33.5, 18.96],
  [-33.4, 18.97],
  [-33.3, 18.98],
  [-33.15, 18.93],
  [-33.0, 18.82],
  [-32.92, 18.6],
  [-32.92, 18.4],
  [-32.86, 18.28],
  [-32.78, 18.16],
]

const STORE_KEY = 'berg-river:farms'

export function loadUserFarms(): Farm[] {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as (Farm & { sample?: boolean })[]
    return Array.isArray(parsed)
      ? parsed
          .filter((f) => typeof f.lat === 'number' && !f.sample)
          .map(({ sample: _s, ...f }) => f)
      : []
  } catch {
    return []
  }
}

export function saveUserFarms(farms: Farm[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(farms))
  } catch {
    /* storage unavailable: farms stay for this visit only */
  }
}

const LAYER_KEY = 'berg-river:cfm-layer'
export function loadLayerUrl(): string {
  try {
    return localStorage.getItem(LAYER_KEY) ?? CFM_SG_SERVICE
  } catch {
    return CFM_SG_SERVICE
  }
}
export function saveLayerUrl(url: string) {
  try {
    localStorage.setItem(LAYER_KEY, url)
  } catch {
    /* ignore */
  }
}
