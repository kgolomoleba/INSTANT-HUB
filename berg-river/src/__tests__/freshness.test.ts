import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJson, trackAge } from '../net'
import { timeAgo } from '../time'

afterEach(() => vi.unstubAllGlobals())
let n = 0

describe('data age tracking', () => {
  it('reports the oldest piece of data behind a screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 }))
    )
    const before = Date.now()
    let first!: Promise<unknown>
    const age = trackAge(() => {
      first = fetchJson(`https://example.test/a?${n++}`)
    })
    await first
    expect(age.oldest).toBeGreaterThanOrEqual(before)
    expect(age.oldest).toBeLessThanOrEqual(Date.now())
  })
  it('does not track requests made outside trackAge', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 }))
    )
    const age = trackAge(() => {})
    await fetchJson(`https://example.test/b?${n++}`)
    expect(age.oldest).toBe(Infinity)
  })
})

describe('timeAgo', () => {
  const now = Date.parse('2026-11-24T12:00:00Z')
  it('says "just now" for under a minute, then minutes, hours, days', () => {
    expect(timeAgo(now - 10_000, 'en', now)).toBe('just now')
    expect(timeAgo(now - 10_000, 'af', now)).toBe('sopas')
    expect(timeAgo(now - 5 * 60_000, 'en', now)).toMatch(/5 minutes ago/)
    expect(timeAgo(now - 3 * 3600_000, 'en', now)).toMatch(/3 hours ago/)
    expect(timeAgo(now - 3 * 86400_000, 'en', now)).toMatch(/3 days ago/)
  })
  it('works in Afrikaans', () => {
    expect(timeAgo(now - 5 * 60_000, 'af', now)).toMatch(/5 minute gelede/)
  })
})
