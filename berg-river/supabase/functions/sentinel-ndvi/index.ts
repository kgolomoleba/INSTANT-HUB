// Sharper green-cover readings for the Berg River app: Sentinel-2 at 10 m,
// a new image about every 5 days, from the free Copernicus Data Space
// Ecosystem (Sentinel Hub Statistical API). Cloudy pixels are left out.
//
// Secrets (Supabase → Edge Functions → Secrets), from a free account at
// https://dataspace.copernicus.eu → User settings → OAuth clients:
//   CDSE_CLIENT_ID, CDSE_CLIENT_SECRET
//
// Request:  POST { "geometry": GeoJSON Polygon | MultiPolygon (lon/lat), "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }
// Response: { "source": "sentinel-2", "points": [{ "date": "YYYY-MM-DD", "ndvi": 0.61, "clear": 0.93 }] }

const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
const STATS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/statistics'
const CLIENT_ID = Deno.env.get('CDSE_CLIENT_ID')
const CLIENT_SECRET = Deno.env.get('CDSE_CLIENT_SECRET')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', ...extra } })

// NDVI from red (B04) and near-infrared (B08). Only clear land/water pixels
// count: the scene classification (SCL) drops cloud, cloud shadow and no-data.
const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [{ id: "ndvi", bands: 1, sampleType: "FLOAT32" }, { id: "dataMask", bands: 1 }]
  };
}
function evaluatePixel(s) {
  var clear = s.dataMask === 1 && [4, 5, 6, 7, 11].indexOf(s.SCL) !== -1;
  var sum = s.B08 + s.B04;
  return { ndvi: [sum === 0 ? 0 : (s.B08 - s.B04) / sum], dataMask: [clear && sum !== 0 ? 1 : 0] };
}`

let token: { value: string; exp: number } | null = null
async function getToken(): Promise<string> {
  if (token && token.exp > Date.now() + 60_000) return token.value
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID!, client_secret: CLIENT_SECRET! }),
  })
  if (!res.ok) throw new Error(`Copernicus sign-in failed (${res.status})`)
  const body = (await res.json()) as { access_token: string; expires_in: number }
  token = { value: body.access_token, exp: Date.now() + body.expires_in * 1000 }
  return token.value
}

type Ring = [number, number][]
const DATE = /^\d{4}-\d{2}-\d{2}$/

function rings(g: { type?: string; coordinates?: unknown }): Ring[] | null {
  if (g?.type === 'Polygon') return g.coordinates as Ring[]
  if (g?.type === 'MultiPolygon') return (g.coordinates as Ring[][]).flat()
  return null
}

/** Basic checks so this can't be used for huge or malformed requests. */
function validate(b: { geometry?: { type?: string; coordinates?: unknown }; start?: string; end?: string }): string | null {
  if (!b || !DATE.test(b.start ?? '') || !DATE.test(b.end ?? '')) return 'start and end dates are required'
  if (b.start! > b.end! || b.start! < '2017-03-28') return 'dates out of range (Sentinel-2 L2A starts March 2017)'
  if (Date.parse(b.end!) - Date.parse(b.start!) > 370 * 86_400_000) return 'period longer than a year'
  const rs = rings(b.geometry ?? {})
  if (!rs?.length) return 'geometry must be a Polygon or MultiPolygon'
  const pts = rs.flat()
  if (pts.length > 5000 || pts.some((p) => !Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) return 'invalid geometry'
  const lons = pts.map((p) => p[0])
  const lats = pts.map((p) => p[1])
  // About 30 × 30 km at most: plenty for a farm, small enough to stay cheap.
  if (Math.max(...lons) - Math.min(...lons) > 0.35 || Math.max(...lats) - Math.min(...lats) > 0.3) return 'area too large'
  if (lats.some((y) => y < -90 || y > 90) || lons.some((x) => x < -180 || x > 180)) return 'invalid coordinates'
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405)
  if (!CLIENT_ID || !CLIENT_SECRET) return json({ error: 'Sentinel-2 is not set up' }, 503)

  let body: { geometry?: { type?: string; coordinates?: unknown }; start?: string; end?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const bad = validate(body)
  if (bad) return json({ error: bad }, 400)

  const lat = rings(body.geometry!)!.flat()[0][1]
  // ~10 m pixels expressed in degrees (the request is in lon/lat).
  const resy = 10 / 111_320
  const resx = 10 / (111_320 * Math.cos((lat * Math.PI) / 180))

  try {
    const res = await fetch(STATS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        input: {
          bounds: { geometry: body.geometry, properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' } },
          data: [{ type: 'sentinel-2-l2a', dataFilter: { mosaickingOrder: 'leastCC' } }],
        },
        aggregation: {
          timeRange: { from: `${body.start}T00:00:00Z`, to: `${body.end}T23:59:59Z` },
          aggregationInterval: { of: 'P5D' },
          evalscript: EVALSCRIPT,
          resx,
          resy,
        },
      }),
    })
    if (!res.ok) {
      console.error('Statistical API error', res.status, await res.text())
      return json({ error: `Copernicus answered ${res.status}` }, res.status === 429 ? 429 : 502)
    }
    type Stat = { sampleCount: number; noDataCount: number; mean: number }
    type Out = { data: { interval: { from: string }; outputs?: { ndvi?: { bands?: { B0?: { stats?: Stat } } } } }[] }
    const out = (await res.json()) as Out
    const points = out.data
      .map((d) => {
        const s = d.outputs?.ndvi?.bands?.B0?.stats
        const clear = s && s.sampleCount ? (s.sampleCount - s.noDataCount) / s.sampleCount : 0
        return { date: d.interval.from.slice(0, 10), ndvi: s?.mean ?? NaN, clear }
      })
      // Keep readings where at least half the farm was clear of cloud.
      .filter((p) => p.clear >= 0.5 && Number.isFinite(p.ndvi))
      .map((p) => ({ date: p.date, ndvi: Math.round(p.ndvi * 10000) / 10000, clear: Math.round(p.clear * 100) / 100 }))

    const recent = Date.parse(body.end!) > Date.now() - 10 * 86_400_000
    return json({ source: 'sentinel-2', points }, 200, { 'Cache-Control': recent ? 'max-age=3600' : 'public, max-age=86400' })
  } catch (e) {
    console.error('Sentinel request failed', e)
    return json({ error: 'Satellite service unreachable' }, 502)
  }
})
