import { describe, expect, it } from 'vitest'
import { makeT } from '../i18n'
import { computeStats, describe as summarise, verdict } from '../stats'
import { guessSeason } from '../crops'

const w = (rain: number[]) => ({
  dates: rain.map((_, i) => `2025-06-${String(i + 1).padStart(2, '0')}`),
  rain,
  tmax: rain.map(() => 20),
  tmin: rain.map(() => 8),
  et0: rain.map(() => 1),
})

describe('translations', () => {
  it('fills in values', () => {
    expect(
      makeT('en')('find.added', { name: 'Kleinfontein', ha: '12 ha' })
    ).toBe('Added Kleinfontein (12 ha).')
    expect(
      makeT('af')('find.added', { name: 'Kleinfontein', ha: '12 ha' })
    ).toBe('Kleinfontein (12 ha) bygevoeg.')
  })
  it('every line has Afrikaans, with the same {values} as the English', async () => {
    const { KEYS } = await import('../i18n')
    const en = makeT('en')
    const af = makeT('af')
    expect(KEYS.length).toBeGreaterThan(150)
    for (const k of KEYS) {
      const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',')
      expect(vars(af(k))).toBe(vars(en(k)))
    }
  })
})

describe('verdict', () => {
  const a = computeStats(w([10, 10, 10]), [{ date: '2025-06-01', ndvi: 0.7 }])
  it('is "worse" when green cover drops by 5 points or more', () => {
    const b = computeStats(w([5, 5, 5]), [{ date: '2026-06-01', ndvi: 0.5 }])
    const v = verdict(a, b, '2025')
    expect(v.tone).toBe('bad')
    expect(v.title).toBe('Less green than 2025')
    expect(v.reasons.join(' ')).toMatch(/Rain down 50% \(15 mm vs 30 mm\)/)
  })
  it('is "the same" for small changes, "better" for gains', () => {
    expect(
      verdict(
        a,
        computeStats(w([10, 10, 10]), [{ date: '2026-06-01', ndvi: 0.71 }]),
        '2025'
      ).tone
    ).toBe('same')
    expect(
      verdict(
        a,
        computeStats(w([10, 10, 10]), [{ date: '2026-06-01', ndvi: 0.85 }]),
        '2025'
      ).tone
    ).toBe('good')
  })
  it('falls back to rain when there are no satellite readings', () => {
    const v = verdict(
      computeStats(w([10, 10]), []),
      computeStats(w([2, 2]), []),
      '2025',
      makeT('af')
    )
    expect(v.tone).toBe('bad')
    expect(v.title).toBe('Droër as 2025')
  })
  it('summary sentences come out in Afrikaans', () => {
    const b = computeStats(w([5, 5, 5]), [{ date: '2026-06-01', ndvi: 0.5 }])
    expect(summarise(a, b, '2025', '2026', makeT('af')).join(' ')).toMatch(
      /Groenbedekking was \d+ punte laer in 2026/
    )
  })
})

describe('guessSeason', () => {
  const row = (areaHa: number) => ({
    crop: 'x',
    category: '',
    areaHa,
    fields: 1,
    irrigation: '',
  })
  it('summer for vineyards/orchards, winter for grain, whole year when nothing is recorded', () => {
    expect(
      guessSeason([
        { year: 2023, season: 'Summer', rows: [row(40)] },
        { year: 2023, season: 'Winter', rows: [row(5)] },
      ])
    ).toBe('summer')
    expect(
      guessSeason([
        { year: 2023, season: 'Winter', rows: [row(80)] },
        { year: 2023, season: 'Summer', rows: [] },
      ])
    ).toBe('winter')
    expect(
      guessSeason([
        { year: 2023, season: 'Winter', rows: [] },
        { year: 2017, season: 'Summer', rows: [row(3)] },
      ])
    ).toBe('summer')
    expect(guessSeason([])).toBe('year')
  })
})
