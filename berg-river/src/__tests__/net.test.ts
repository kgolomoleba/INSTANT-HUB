import { afterEach, describe, expect, it, vi } from 'vitest'
import { FetchError, fetchJson, ttlFor } from '../net'

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 })
let n = 0
const url = () => `https://example.test/data?${n++}` // fresh URL per test: no cache hits

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('fetchJson', () => {
  it('retries when the server is busy, then succeeds', async () => {
    vi.useFakeTimers()
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(ok({ a: 1 }))
    vi.stubGlobal('fetch', f)
    const p = fetchJson(url())
    await vi.runAllTimersAsync()
    await expect(p).resolves.toEqual({ a: 1 })
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('does not retry a 404', async () => {
    const f = vi.fn().mockResolvedValue(new Response('', { status: 404 }))
    vi.stubGlobal('fetch', f)
    await expect(
      fetchJson(url(), { label: 'the service' })
    ).rejects.toMatchObject({
      kind: 'http',
      status: 404,
      message: 'the service answered 404',
    })
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('reports a blocked request as a network error after one retry', async () => {
    vi.useFakeTimers()
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', f)
    const p: Promise<FetchError> = fetchJson(url()).then(
      () => {
        throw new Error('should have failed')
      },
      (e: FetchError) => e
    )
    await vi.runAllTimersAsync()
    const e = await p
    expect(e).toBeInstanceOf(FetchError)
    expect(e.kind).toBe('network')
    expect(f).toHaveBeenCalledTimes(2)
  })
  it('shares one request between callers asking at the same time', async () => {
    const f = vi.fn().mockResolvedValue(ok([1]))
    vi.stubGlobal('fetch', f)
    const u = url()
    await Promise.all([fetchJson(u), fetchJson(u), fetchJson(u)])
    expect(f).toHaveBeenCalledTimes(1)
  })
})

describe('ttlFor', () => {
  it('keeps old data for a month and recent data for a few hours', () => {
    expect(ttlFor('2020-01-01')).toBe(30 * 86_400_000)
    expect(ttlFor(new Date().toISOString().slice(0, 10))).toBe(86_400_000 / 4)
  })
})
