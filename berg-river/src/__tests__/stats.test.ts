import { describe as group, expect, it } from 'vitest'
import {
  computeStats,
  coverFromNdvi,
  dayIndex,
  describe,
  periodDays,
} from '../stats'
import type { DailyWeather } from '../api'

const weather = (rain: number[], tmax = 20, tmin = 8): DailyWeather => ({
  dates: rain.map((_, i) => `2025-06-${String(i + 1).padStart(2, '0')}`),
  rain,
  tmax: rain.map(() => tmax),
  tmin: rain.map(() => tmin),
  et0: rain.map(() => 2),
})

group('coverFromNdvi', () => {
  it('is 0 for bare soil and 100 for full cover', () => {
    expect(coverFromNdvi(0.1)).toBe(0)
    expect(coverFromNdvi(0.15)).toBe(0)
    expect(coverFromNdvi(0.85)).toBe(100)
    expect(coverFromNdvi(0.95)).toBe(100)
  })
  it('follows the scaled-NDVI square', () => {
    expect(coverFromNdvi(0.5)).toBeCloseTo(25, 5) // ((0.5-0.15)/0.7)^2 = 0.25
  })
})

group('computeStats', () => {
  it('totals rain, counts rain days and finds the longest dry spell', () => {
    const s = computeStats(weather([5, 0, 0, 0, 0.5, 2, 0, 0, 10]), [
      { date: '2025-06-01', ndvi: 0.5 },
      { date: '2025-06-17', ndvi: 0.7 },
    ])
    expect(s.totalRain).toBeCloseTo(17.5)
    expect(s.rainDays).toBe(3) // 5, 2, 10 (0.5 is under 1 mm)
    expect(s.longestDrySpell).toBe(4) // 0, 0, 0, 0.5
    expect(s.meanNdvi).toBeCloseTo(0.6)
    expect(s.peakNdvi).toBeCloseTo(0.7)
    expect(s.et0).toBe(18)
    expect(s.waterBalance).toBeCloseTo(-0.5)
    expect(s.days).toBe(9)
  })
  it('counts hot and frost days', () => {
    expect(computeStats(weather([0, 0], 36, -1), []).hotDays).toBe(2)
    expect(computeStats(weather([0, 0], 36, -1), []).frostDays).toBe(2)
  })
  it('ignores missing values instead of failing', () => {
    const s = computeStats(weather([NaN, 3, NaN]), [])
    expect(s.totalRain).toBe(3)
    expect(Number.isNaN(s.meanNdvi)).toBe(true)
  })
})

group('dates', () => {
  it('counts days from the period start, across leap days', () => {
    expect(dayIndex('2024-02-28', '2024-03-01')).toBe(2)
    expect(
      periodDays({ label: '', start: '2025-05-01', end: '2025-10-31' })
    ).toBe(184)
  })
})

group('describe', () => {
  it('reports lower cover and less rain in plain words', () => {
    const a = computeStats(weather([10, 10, 10]), [
      { date: '2025-06-01', ndvi: 0.7 },
    ])
    const b = computeStats(weather([5, 5, 5]), [
      { date: '2026-06-01', ndvi: 0.4 },
    ])
    const text = describe(a, b, '2025', '2026').join(' ')
    expect(text).toMatch(/points lower in 2026/)
    expect(text).toMatch(/2026 had 50% less rain: 15 mm vs 30 mm/)
  })
  it('says "about the same" for small differences', () => {
    const a = computeStats(weather([10]), [{ date: '2025-06-01', ndvi: 0.6 }])
    const b = computeStats(weather([10.5]), [
      { date: '2026-06-01', ndvi: 0.601 },
    ])
    const text = describe(a, b, 'A', 'B').join(' ')
    expect(text).toMatch(/about the same/)
    expect(text).toMatch(/Rainfall was similar/)
  })
})
