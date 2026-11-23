/**
 * Data sources (both free, no API key):
 * - Weather: Open-Meteo historical archive (ERA5 reanalysis), daily values.
 *   https://open-meteo.com/en/docs/historical-weather-api
 * - Vegetation: NASA MODIS MOD13Q1 NDVI, 250 m, 16-day composites, via the
 *   ORNL DAAC MODIS web service. https://modis.ornl.gov/data/modis_webservice.html
 */

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
  const p = fetch(url, { headers: { Accept: 'application/json' } }).then(async (res) => {
    if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`)
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
  end: string,
): Promise<DailyWeather> {
  const q = new URLSearchParams({
    latitude: String(round(lat)),
    longitude: String(round(lon)),
    start_date: start,
    end_date: end,
    daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration',
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
  const r = await getJson<Resp>(`https://archive-api.open-meteo.com/v1/archive?${q}`)
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

/**
 * Mean NDVI for each 16-day composite in [start, end].
 * size 0 = the single 250 m pixel; size 1 = a ~2 × 2 km square around the point.
 */
export async function fetchNdvi(
  lat: number,
  lon: number,
  start: string,
  end: string,
  size: 0 | 1,
): Promise<NdviPoint[]> {
  const dates = modisDatesBetween(start, end)
  // The service returns at most 10 composites per request.
  const chunks: string[][] = []
  for (let i = 0; i < dates.length; i += 10) chunks.push(dates.slice(i, i + 10))

  type Resp = {
    scale?: string
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
        kmAboveBelow: String(size),
        kmLeftRight: String(size),
      })
      return getJson<Resp>(`https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?${q}`)
    }),
  )

  const points: NdviPoint[] = []
  for (const r of results) {
    const scale = Number(r.scale) || 0.0001
    for (const s of r.subset) {
      // -3000 is the fill value; valid NDVI is -2000..10000 before scaling.
      const valid = s.data.filter((v) => v > -2000 && v <= 10000)
      if (!valid.length) continue
      const mean = valid.reduce((a, b) => a + b, 0) / valid.length
      points.push({ date: s.calendar_date, ndvi: mean * scale })
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}
