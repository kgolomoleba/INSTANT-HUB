/**
 * Data sources (both free, no API key):
 * - Weather: Open-Meteo historical archive (ERA5 reanalysis), daily values.
 *   https://open-meteo.com/en/docs/historical-weather-api
 * - Vegetation: NASA MODIS MOD13Q1 NDVI, 250 m, 16-day composites, via the
 *   ORNL DAAC MODIS web service. https://modis.ornl.gov/data/modis_webservice.html
 */

import { bbox, contains, type MultiPolygon } from './geo'

export type DailyWeather = {
  dates: string[]
  rain: number[]
  tmax: number[]
  tmin: number[]
  et0: number[]
}

export type NdviPoint = { date: string; ndvi: number }

const cache = new Map<string, Promise<unknown>>()

function getJson<T>(url: string): Promise<T> {
  const hit = cache.get(url)
  if (hit) return hit as Promise<T>
  const p = fetch(url, { headers: { Accept: 'application/json' } }).then(
    async (res) => {
      if (!res.ok)
        throw new Error(`${new URL(url).host} answered ${res.status}`)
      return (await res.json()) as T
    }
  )
  p.catch(() => cache.delete(url))
  cache.set(url, p)
  return p
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined
let modisDirectBlocked = false

/**
 * NASA MODIS via ORNL. Tries the browser → ORNL request first; if the browser
 * can't make it (network/CORS error, not an HTTP error), falls back to the
 * app's Supabase function `modis-ndvi`, when Supabase is configured.
 */
async function getModis<T>(q: URLSearchParams): Promise<T> {
  if (!modisDirectBlocked) {
    try {
      return await getJson<T>(
        `https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?${q}`
      )
    } catch (e) {
      const blocked = e instanceof TypeError // fetch() rejects with TypeError when blocked or offline
      if (!blocked || !SUPABASE_URL || !SUPABASE_KEY) throw e
      modisDirectBlocked = true
    }
  }
  const url = `${SUPABASE_URL!.replace(/\/$/, '')}/functions/v1/modis-ndvi?${q}`
  const hit = cache.get(url)
  if (hit) return hit as Promise<T>
  const p = fetch(url, {
    headers: {
      Accept: 'application/json',
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  }).then(async (res) => {
    if (!res.ok)
      throw new Error(`satellite data service answered ${res.status}`)
    return (await res.json()) as T
  })
  p.catch(() => cache.delete(url))
  cache.set(url, p)
  return p
}

const round = (n: number) => Math.round(n * 1000) / 1000

export async function fetchWeather(
  lat: number,
  lon: number,
  start: string,
  end: string
): Promise<DailyWeather> {
  const q = new URLSearchParams({
    latitude: String(round(lat)),
    longitude: String(round(lon)),
    start_date: start,
    end_date: end,
    daily:
      'precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration',
    timezone: 'Africa/Johannesburg',
  })
  type Resp = {
    daily: {
      time: string[]
      precipitation_sum: (number | null)[]
      temperature_2m_max: (number | null)[]
      temperature_2m_min: (number | null)[]
      et0_fao_evapotranspiration: (number | null)[]
    }
  }
  const r = await getJson<Resp>(
    `https://archive-api.open-meteo.com/v1/archive?${q}`
  )
  const d = r.daily
  return {
    dates: d.time,
    rain: d.precipitation_sum.map((v) => v ?? NaN),
    tmax: d.temperature_2m_max.map((v) => v ?? NaN),
    tmin: d.temperature_2m_min.map((v) => v ?? NaN),
    et0: d.et0_fao_evapotranspiration.map((v) => v ?? NaN),
  }
}

/** MOD13Q1 composites start on day-of-year 1, 17, 33, … 353 each year. */
function modisDatesBetween(start: string, end: string): string[] {
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end + 'T00:00:00Z')
  const out: string[] = []
  for (let y = s.getUTCFullYear(); y <= e.getUTCFullYear(); y++) {
    for (let doy = 1; doy <= 353; doy += 16) {
      const d = new Date(Date.UTC(y, 0, doy))
      if (d >= s && d <= e) out.push(`A${y}${String(doy).padStart(3, '0')}`)
    }
  }
  return out
}

export type NdviArea =
  | { kind: 'square'; km: 0 | 1 }
  | { kind: 'boundary'; boundary: MultiPolygon }

/** Earth radius used by the MODIS sinusoidal projection. */
const MODIS_R = 6371007.181

/**
 * Mean NDVI for each 16-day composite in [start, end].
 * With a square, every pixel in it counts. With a farm boundary, only the
 * 250 m pixels whose centres fall inside the boundary count (or the single
 * nearest pixel, for farms smaller than a pixel).
 */
export async function fetchNdvi(
  lat: number,
  lon: number,
  start: string,
  end: string,
  area: NdviArea
): Promise<NdviPoint[]> {
  let km = 0
  if (area.kind === 'square') km = area.km
  else {
    const [w, s, e, n] = bbox(area.boundary)
    const kmLat = Math.max(Math.abs(n - lat), Math.abs(s - lat)) * 111.32
    const kmLon =
      Math.max(Math.abs(e - lon), Math.abs(w - lon)) *
      111.32 *
      Math.cos((lat * Math.PI) / 180)
    km = Math.min(25, Math.ceil(Math.max(kmLat, kmLon) + 0.25))
  }

  const dates = modisDatesBetween(start, end)
  // The service returns at most 10 composites per request.
  const chunks: string[][] = []
  for (let i = 0; i < dates.length; i += 10) chunks.push(dates.slice(i, i + 10))

  type Resp = {
    scale?: string | number
    xllcorner?: string | number
    yllcorner?: string | number
    cellsize?: string | number
    nrows?: string | number
    ncols?: string | number
    subset: { calendar_date: string; data: number[] }[]
  }
  const results = await Promise.all(
    chunks.map((c) => {
      const q = new URLSearchParams({
        latitude: String(round(lat)),
        longitude: String(round(lon)),
        band: '250m_16_days_NDVI',
        startDate: c[0],
        endDate: c[c.length - 1],
        kmAboveBelow: String(km),
        kmLeftRight: String(km),
      })
      return getModis<Resp>(q)
    })
  )

  const points: NdviPoint[] = []
  for (const r of results) {
    const scale = Number(r.scale) || 0.0001
    const mask =
      area.kind === 'boundary' ? pixelMask(r, area.boundary, lat, lon) : null
    for (const s of r.subset) {
      // -3000 is the fill value; valid NDVI is -2000..10000 before scaling.
      const valid = s.data.filter(
        (v, i) => (!mask || mask[i]) && v > -2000 && v <= 10000
      )
      if (!valid.length) continue
      const mean = valid.reduce((a, b) => a + b, 0) / valid.length
      points.push({ date: s.calendar_date, ndvi: mean * scale })
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Which pixels of the returned grid lie inside the farm. The grid is in the
 * MODIS sinusoidal projection, row-major from the top (north) row.
 */
function pixelMask(
  r: {
    xllcorner?: string | number
    yllcorner?: string | number
    cellsize?: string | number
    nrows?: string | number
    ncols?: string | number
  },
  boundary: MultiPolygon,
  lat: number,
  lon: number
): boolean[] | null {
  const xll = Number(r.xllcorner),
    yll = Number(r.yllcorner),
    cs = Number(r.cellsize)
  const nrows = Number(r.nrows),
    ncols = Number(r.ncols)
  if (![xll, yll, cs, nrows, ncols].every(Number.isFinite) || !nrows || !ncols)
    return null
  const mask: boolean[] = []
  let nearest = 0
  let best = Infinity
  for (let row = 0; row < nrows; row++)
    for (let col = 0; col < ncols; col++) {
      const x = xll + (col + 0.5) * cs
      const y = yll + (nrows - row - 0.5) * cs
      const pLat = (y / MODIS_R) * (180 / Math.PI)
      const pLon =
        (x / (MODIS_R * Math.cos((pLat * Math.PI) / 180))) * (180 / Math.PI)
      const i = row * ncols + col
      mask[i] = contains(boundary, pLon, pLat)
      const d =
        (pLat - lat) ** 2 +
        ((pLon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2
      if (d < best) {
        best = d
        nearest = i
      }
    }
  if (!mask.some(Boolean)) mask[nearest] = true
  return mask
}
