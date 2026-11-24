import { describe, expect, it } from 'vitest'
import { fromHash, periodError, periodName, presets, toHash } from '../periods'
import { allFarmsCsv, farmCsv, toCsv } from '../exports'
import { periodDays } from '../stats'

const P = (start: string, end: string) => ({ label: '', start, end })

describe('presets', () => {
  it('picks the latest complete winter season, and never asks for data that does not exist yet', () => {
    for (const latest of ['2026-11-18', '2026-08-01', '2027-01-10']) {
      for (const p of presets(latest)) {
        for (const per of p.periods) {
          expect(per.end <= latest).toBe(true)
          expect(per.start <= per.end).toBe(true)
          expect(periodDays(per)).toBeLessThanOrEqual(366)
        }
      }
    }
    expect(presets('2026-11-18')[0].periods.map((p) => p.start)).toEqual([
      '2025-05-01',
      '2026-05-01',
    ])
    expect(presets('2026-08-01')[0].periods.map((p) => p.start)).toEqual([
      '2024-05-01',
      '2025-05-01',
    ])
  })
  it('compares equal-length periods', () => {
    for (const p of presets('2026-11-18'))
      expect(periodDays(p.periods[0])).toBe(periodDays(p.periods[1]))
  })
})

describe('periodError', () => {
  it('rejects backwards, too long, or too early periods', () => {
    expect(periodError(P('2025-06-01', '2025-05-01'))).toMatch(/before/)
    expect(periodError(P('2023-01-01', '2024-06-01'))).toMatch(/one year/)
    expect(periodError(P('1999-01-01', '1999-02-01'))).toMatch(/2000/)
    expect(periodError(P('2025-05-01', '2025-10-31'))).toBeNull()
  })
})

describe('periodName', () => {
  it('uses just the year(s) for matching seasons', () => {
    expect(
      periodName(P('2025-05-01', '2025-10-31'), P('2026-05-01', '2026-10-31'))
    ).toBe('2025')
    expect(
      periodName(P('2024-11-01', '2025-04-30'), P('2025-11-01', '2026-04-30'))
    ).toBe('2024–25')
  })
  it('spells out dates otherwise', () => {
    expect(periodName(P('2026-03-01', '2026-05-29'))).toMatch(
      /1 Mar.*29 May 2026/
    )
  })
})

describe('share links', () => {
  it('round-trips periods and farm', () => {
    const periods: [ReturnType<typeof P>, ReturnType<typeof P>] = [
      P('2025-05-01', '2025-10-31'),
      P('2026-05-01', '2026-10-31'),
    ]
    const back = fromHash(toHash(periods, 'abc-123'))
    expect(back.periods?.map((p) => [p.start, p.end])).toEqual([
      ['2025-05-01', '2025-10-31'],
      ['2026-05-01', '2026-10-31'],
    ])
    expect(back.farmId).toBe('abc-123')
  })
  it('ignores junk', () => {
    expect(fromHash('#a=yesterday&b=<script>&farm=../../x')).toEqual({
      periods: undefined,
      farmId: undefined,
    })
    expect(fromHash('')).toEqual({ periods: undefined, farmId: undefined })
  })
})

describe('CSV export', () => {
  it('quotes commas/quotes and defuses spreadsheet formulas', () => {
    expect(toCsv([['a,b', 'say "hi"', '=HYPERLINK("x")', -5, '-3.2']])).toBe(
      '"a,b","say ""hi""","\'=HYPERLINK(""x"")",-5,-3.2\r\n'
    )
  })
  it('writes one row per day with weather, satellite readings and diary notes', () => {
    const farm = { id: 'f1', name: 'Test Farm', lat: -33, lon: 18.9 }
    const periods: [ReturnType<typeof P>, ReturnType<typeof P>] = [
      P('2025-06-01', '2025-06-03'),
      P('2026-06-01', '2026-06-03'),
    ]
    const w = (y: number) => ({
      dates: [1, 2, 3].map((d) => `${y}-06-0${d}`),
      rain: [1, 0, 2.345],
      tmax: [20, 21, 22],
      tmin: [5, 6, 7],
      et0: [1, 1, 1],
    })
    const csv = farmCsv(
      farm,
      periods,
      ['2025', '2026'],
      [w(2025), w(2026)],
      [[{ date: '2025-06-02', ndvi: 0.5 }], []],
      [
        { id: 'd', farmId: 'f1', day: '2026-06-03', note: 'Hail, heavy' },
        { id: 'e', farmId: 'other', day: '2026-06-01', note: 'not this farm' },
      ]
    )
    const lines = csv.trim().split('\r\n')
    expect(lines).toHaveLength(1 + 6)
    expect(lines[2]).toBe('Test Farm,2025,2025-06-02,1,0,21,6,1,0.5,25,')
    expect(lines[6]).toBe(
      'Test Farm,2026,2026-06-03,2,2.35,22,7,1,,,"Hail, heavy"'
    )
    expect(csv).not.toMatch(/not this farm/)
  })
  it('skips farms that failed in the all-farms export', () => {
    const csv = allFarmsCsv(
      ['2025', '2026'],
      [{ farm: { id: 'x', name: 'Failed', lat: 0, lon: 0 } }]
    )
    expect(csv.trim().split('\r\n')).toHaveLength(1)
  })
})
