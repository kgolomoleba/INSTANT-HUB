/**
 * Demo mode: made-up weather, satellite readings, farm outlines and crop
 * records, so the app can be shown on a page that cannot reach the real
 * services (for example inside claude.ai). Only built with VITE_DEMO=1; never
 * part of the real site.
 */
import type { Farm } from './farms'

const rect = (
  lon: number,
  lat: number,
  w: number,
  h: number
): [number, number][] => [
  [lon - w, lat + h],
  [lon + w, lat + h],
  [lon + w, lat - h],
  [lon - w, lat - h],
  [lon - w, lat + h],
]

export const DEMO_FARMS: Farm[] = [
  {
    id: '00000000-0000-4000-8000-0000000000d1',
    name: 'Demo vineyard, Paarl',
    lat: -33.705,
    lon: 18.985,
    boundary: [[rect(18.985, -33.705, 0.007, 0.005)]],
    areaHa: 52,
    source: 'Cape Farm Mapper',
    season: 'summer',
  },
  {
    id: '00000000-0000-4000-8000-0000000000d2',
    name: 'Demo wheat farm, Moorreesburg',
    lat: -33.152,
    lon: 18.66,
    boundary: [[rect(18.66, -33.152, 0.012, 0.008)]],
    areaHa: 176,
    source: 'Cape Farm Mapper',
    season: 'winter',
  },
]

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}
const doyOf = (d: Date) =>
  Math.floor(
    (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
      Date.UTC(d.getUTCFullYear(), 0, 0)) /
      86_400_000
  )
const wave = (doy: number, peak: number) =>
  Math.cos(((doy - peak) / 365) * 2 * Math.PI)
const json = (b: unknown) =>
  new Response(JSON.stringify(b), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
// Later years are a little drier and less green, so comparisons have something to say.
const yearFactor = (y: number) => (y % 2 === 0 ? 0.74 : 1)
// A summer season (Nov to Apr) belongs to the year it ends in, so each season is all-wet or all-dry.
const seasonYear = (y: number, doy: number) => (doy >= 305 ? y + 1 : y)

function weather(p: URLSearchParams) {
  const start = new Date(p.get('start_date') + 'T00:00:00Z')
  const end = new Date(p.get('end_date') + 'T00:00:00Z')
  const lat = p.get('latitude') ?? ''
  const time: string[] = [],
    rain: number[] = [],
    tmax: number[] = [],
    tmin: number[] = [],
    et0: number[] = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10)
    const doy = doyOf(d)
    const wet = Math.max(0, wave(doy, 190)) // winter-rainfall climate
    const r = hash(iso + lat)
    time.push(iso)
    rain.push(
      r < (0.06 + 0.42 * wet) * yearFactor(seasonYear(d.getUTCFullYear(), doy))
        ? Math.round((1.5 + hash(iso + 'x') * 16) * 10) / 10
        : 0
    )
    tmax.push(
      Math.round(
        (22.5 +
          8 * wave(doy, 20) +
          (hash(iso + 't') - 0.5) * 5 +
          (yearFactor(seasonYear(d.getUTCFullYear(), doy)) < 1 ? 1.2 : 0)) *
          10
      ) / 10
    )
    tmin.push(
      Math.round((11 + 5 * wave(doy, 20) + (hash(iso + 'n') - 0.5) * 3) * 10) /
        10
    )
    et0.push(Math.round((3 + 2.6 * wave(doy, 15)) * 10) / 10)
  }
  return {
    daily: {
      time,
      precipitation_sum: rain,
      temperature_2m_max: tmax,
      temperature_2m_min: tmin,
      et0_fao_evapotranspiration: et0,
    },
  }
}

function modis(p: URLSearchParams) {
  const sd = p.get('startDate') ?? 'A2025001'
  const ed = p.get('endDate') ?? 'A2025353'
  const y0 = +sd.slice(1, 5),
    d0 = +sd.slice(5),
    y1 = +ed.slice(1, 5),
    d1 = +ed.slice(5)
  const vineyard = Number(p.get('longitude')) > 18.9
  const subset: {
    calendar_date: string
    modis_date: string
    data: number[]
  }[] = []
  for (let y = y0; y <= y1; y++)
    for (let doy = 1; doy <= 353; doy += 16) {
      if ((y === y0 && doy < d0) || (y === y1 && doy > d1)) continue
      const f = yearFactor(seasonYear(y, doy))
      const dist = vineyard
        ? Math.min(Math.abs(doy - 25), 365 - Math.abs(doy - 25))
        : Math.abs(doy - 245)
      const peak = vineyard ? 0.62 : 0.78
      const ndvi =
        0.24 +
        (peak - 0.24) * f * Math.exp(-((dist / (vineyard ? 75 : 55)) ** 2)) +
        (hash(`${y}-${doy}`) - 0.5) * 0.03
      subset.push({
        calendar_date: new Date(Date.UTC(y, 0, doy)).toISOString().slice(0, 10),
        modis_date: `A${y}${String(doy).padStart(3, '0')}`,
        data: [Math.round(ndvi * 10000)],
      })
    }
  return { scale: '0.0001', subset }
}

export function installDemo() {
  const realFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL
        ? input.toString()
        : input.url
    )
    const p = url.searchParams
    if (url.host === 'archive-api.open-meteo.com') return json(weather(p))
    if (url.host === 'modis.ornl.gov') return json(modis(p))
    if (url.host === 'gis.westerncape.gov.za') {
      if (url.pathname.includes('/DOA-SG/')) {
        const [lon, lat] = (p.get('geometry') ?? '18.9,-33.4')
          .split(',')
          .map(Number)
        return json({
          results: [
            {
              layerName: 'Farm Portions',
              attributes: { FARM_NAME: 'DEMO FARM', FARM_NO: 100, PORTION: 1 },
              geometry: { rings: [rect(lon, lat, 0.007, 0.005)] },
            },
          ],
        })
      }
      if (url.pathname.includes('/Water/MapServer/4/'))
        return json({
          features: [
            {
              geometry: {
                rings: [
                  [
                    [18.1, -32.7],
                    [19.3, -32.7],
                    [19.3, -34.1],
                    [18.1, -34.1],
                    [18.1, -32.7],
                  ],
                ],
              },
            },
          ],
        })
      if (url.pathname.includes('/Water/MapServer/7/'))
        return json({
          features: [
            {
              geometry: {
                paths: [
                  [
                    [19.07, -33.93],
                    [18.97, -33.73],
                    [18.98, -33.3],
                    [18.93, -33.15],
                    [18.6, -32.92],
                    [18.28, -32.86],
                    [18.16, -32.78],
                  ],
                ],
              },
            },
          ],
        })
      if (url.pathname.includes('/DOA-Agric-Census/')) {
        const g = JSON.parse(p.get('geometry') ?? '{}') as {
          xmin: number
          xmax: number
          ymin: number
          ymax: number
        }
        const cx = (g.xmin + g.xmax) / 2,
          cy = (g.ymin + g.ymax) / 2
        const vineyard = cx > 18.9
        const summer =
          /\/(Census_2013_Crops\/MapServer\/0|Census_(2017|2023)_Crops\/MapServer\/1)\/query/.test(
            url.pathname
          )
        const rows =
          vineyard === summer
            ? [
                {
                  attributes: {
                    doa_crops: vineyard ? 'Wine grapes' : 'Wheat',
                    CROPS: vineyard ? 'Wine grapes' : 'Wheat',
                    areaha: 40,
                    AREAHA: 40,
                    dry_irr: vineyard ? 'Irr' : 'Dry',
                    DRY_IRR: vineyard ? 'Irr' : 'Dry',
                  },
                  geometry: { rings: [rect(cx, cy, 0.003, 0.002)] },
                },
              ]
            : []
        return json({ features: rows })
      }
    }
    return realFetch(input, init)
  }

  const addRibbon = () => {
    if (document.getElementById('demo-ribbon')) return
    const el = document.createElement('div')
    el.id = 'demo-ribbon'
    el.textContent = 'DEMO · sample data, not real farms'
    el.setAttribute(
      'style',
      'position:fixed;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:5000;background:#2f6b3a;color:#fff;font:700 11px/1 system-ui,sans-serif;letter-spacing:.05em;padding:7px 10px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.3);pointer-events:none'
    )
    document.body.appendChild(el)
  }
  if (document.body) addRibbon()
  else document.addEventListener('DOMContentLoaded', addRibbon)
}
