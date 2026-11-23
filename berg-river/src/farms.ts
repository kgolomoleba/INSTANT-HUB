import type { MultiPolygon } from './geo'

export type Farm = {
  id: string
  name: string
  lat: number
  lon: number
  /** true for the built-in sample points, false for farms the user added */
  sample: boolean
  /** Farm boundary, [lon, lat] coordinates, from Cape Farm Mapper or an imported file. */
  boundary?: MultiPolygon
  areaHa?: number
  source?: 'map point' | 'Cape Farm Mapper' | 'file'
}

/**
 * Sample points on farmland along the Berg River, from the upper valley near
 * Paarl down to the estuary at Velddrif. They are approximate locations named
 * after the nearest town, not specific farms. Replace them with real farm
 * locations by clicking the map.
 */
export const SAMPLE_FARMS: Farm[] = [
  { id: 'paarl', name: 'Near Paarl', lat: -33.705, lon: 18.985, sample: true },
  { id: 'wellington', name: 'Near Wellington', lat: -33.615, lon: 18.975, sample: true },
  { id: 'hermon', name: 'Near Hermon', lat: -33.44, lon: 18.95, sample: true },
  { id: 'gouda', name: 'Near Gouda', lat: -33.305, lon: 19.01, sample: true },
  { id: 'riebeek', name: 'Near Riebeek West', lat: -33.33, lon: 18.9, sample: true },
  { id: 'porterville', name: 'Near Porterville', lat: -33.035, lon: 18.96, sample: true },
  { id: 'piketberg', name: 'Near Piketberg', lat: -32.93, lon: 18.68, sample: true },
  { id: 'kersefontein', name: 'Near Kersefontein', lat: -32.93, lon: 18.36, sample: true },
  { id: 'velddrif', name: 'Near Velddrif', lat: -32.79, lon: 18.2, sample: true },
]

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
    const parsed = JSON.parse(raw) as Farm[]
    return Array.isArray(parsed) ? parsed.filter((f) => typeof f.lat === 'number') : []
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
    return localStorage.getItem(LAYER_KEY) ?? ''
  } catch {
    return ''
  }
}
export function saveLayerUrl(url: string) {
  try {
    localStorage.setItem(LAYER_KEY, url)
  } catch {
    /* ignore */
  }
}
