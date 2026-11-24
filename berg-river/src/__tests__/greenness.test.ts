import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const square = [
  [
    [
      [18.9, -33.4],
      [18.91, -33.4],
      [18.91, -33.41],
      [18.9, -33.41],
      [18.9, -33.4],
    ],
  ],
] as never
const area = { kind: 'boundary', boundary: square } as const
const winter = [
  { start: '2025-05-01', end: '2025-10-31' },
  { start: '2026-05-01', end: '2026-10-31' },
] as [{ start: string; end: string }, { start: string; end: string }]

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status })
const modis = () =>
  json({
    scale: '0.0001',
    subset: [{ calendar_date: '2025-05-09', data: [5000] }],
  })

async function load() {
  vi.resetModules()
  return import('../api')
}

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://proj.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('fetchGreenness', { timeout: 20_000 }, () => {
  it('uses Sentinel-2 for both periods when it is available, sending the farm boundary', async () => {
    const calls: { url: string; body?: string }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, body: init?.body as string | undefined })
        return json({
          source: 'sentinel-2',
          points: [{ date: '2025-06-01', ndvi: 0.6, clear: 1 }],
        })
      })
    )
    const { fetchGreenness } = await load()
    const g = await fetchGreenness(-33.4, 18.9, winter, area)
    expect(g.satellite).toBe('sentinel-2')
    expect(g.points[0]).toEqual([{ date: '2025-06-01', ndvi: 0.6 }])
    expect(calls).toHaveLength(2)
    expect(calls[0].url).toBe(
      'https://proj.supabase.co/functions/v1/sentinel-ndvi'
    )
    expect(JSON.parse(calls[0].body!)).toMatchObject({
      start: '2025-05-01',
      end: '2025-10-31',
      geometry: { type: 'MultiPolygon' },
    })
  })

  it('falls back to NASA when Sentinel-2 is not set up, and stops asking', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        return url.includes('sentinel-ndvi')
          ? json({ error: 'not set up' }, 503)
          : modis()
      })
    )
    const { fetchGreenness } = await load()
    expect((await fetchGreenness(-33.4, 18.9, winter, area)).satellite).toBe(
      'modis'
    )
    const sentinelCalls = urls.filter((u) => u.includes('sentinel-ndvi')).length
    await fetchGreenness(-33.4, 18.95, winter, area)
    expect(urls.filter((u) => u.includes('sentinel-ndvi')).length).toBe(
      sentinelCalls
    ) // not asked again
  })

  it('uses NASA for both periods when one is before Sentinel-2 began (2017)', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        return modis()
      })
    )
    const { fetchGreenness } = await load()
    const g = await fetchGreenness(
      -33.4,
      18.9,
      [{ start: '2015-05-01', end: '2015-10-31' }, winter[1]],
      area
    )
    expect(g.satellite).toBe('modis')
    expect(urls.some((u) => u.includes('sentinel-ndvi'))).toBe(false)
  })
})
