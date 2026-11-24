// Fetches NASA MODIS NDVI from the ORNL DAAC web service for the Berg River app.
// The app calls ORNL directly first; this is the fallback for browsers where
// that request is blocked. Only the one product/band the app needs is allowed,
// with validated parameters, so this can't be used as a general proxy.

const ORNL = 'https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', ...extra } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'GET') return json({ error: 'Use GET' }, 405)

  const p = new URL(req.url).searchParams
  const lat = Number(p.get('latitude'))
  const lon = Number(p.get('longitude'))
  const km = Number(p.get('kmAboveBelow'))
  const start = p.get('startDate') ?? ''
  const end = p.get('endDate') ?? ''
  const dateOk = (d: string) => /^A\d{7}$/.test(d)
  if (
    !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    !Number.isFinite(lon) || lon < -180 || lon > 180 ||
    !Number.isInteger(km) || km < 0 || km > 25 ||
    !dateOk(start) || !dateOk(end)
  ) {
    return json({ error: 'Invalid parameters' }, 400)
  }

  const q = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    band: '250m_16_days_NDVI',
    startDate: start,
    endDate: end,
    kmAboveBelow: String(km),
    kmLeftRight: String(km),
  })
  try {
    const res = await fetch(`${ORNL}?${q}`, { headers: { Accept: 'application/json' } })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        // Past satellite readings don't change; let browsers and the CDN reuse them.
        'Cache-Control': res.ok ? 'public, max-age=86400' : 'no-store',
      },
    })
  } catch (e) {
    console.error('ORNL request failed', e)
    return json({ error: 'Satellite service unreachable' }, 502)
  }
})
