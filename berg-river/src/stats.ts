import { makeT, type T } from './i18n'
import type { DailyWeather, NdviPoint } from './api'

export type Period = { label: string; start: string; end: string }

export type PeriodStats = {
  meanNdvi: number
  peakNdvi: number
  meanCover: number
  totalRain: number
  rainDays: number
  meanTmax: number
  hotDays: number
  frostDays: number
  longestDrySpell: number
  et0: number
  waterBalance: number
  days: number
}

/**
 * Estimated green vegetation cover (%) from NDVI, using the scaled-NDVI
 * method (Carlson & Ripley 1997): ((NDVI − bare soil) / (full cover − bare soil))².
 * 0.15 and 0.85 are generic end-members; they are rough for any one farm.
 */
export const NDVI_SOIL = 0.15
export const NDVI_FULL = 0.85
export function coverFromNdvi(ndvi: number): number {
  const x = Math.min(
    1,
    Math.max(0, (ndvi - NDVI_SOIL) / (NDVI_FULL - NDVI_SOIL))
  )
  return x * x * 100
}

const mean = (xs: number[]) => {
  const v = xs.filter(Number.isFinite)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN
}
const sum = (xs: number[]) =>
  xs.filter(Number.isFinite).reduce((a, b) => a + b, 0)

export function computeStats(w: DailyWeather, ndvi: NdviPoint[]): PeriodStats {
  let longest = 0
  let run = 0
  for (const r of w.rain) {
    if (Number.isFinite(r) && r < 1) {
      run++
      longest = Math.max(longest, run)
    } else run = 0
  }
  const totalRain = sum(w.rain)
  const et0 = sum(w.et0)
  const n = ndvi.map((p) => p.ndvi)
  return {
    meanNdvi: mean(n),
    peakNdvi: n.length ? Math.max(...n) : NaN,
    meanCover: mean(n.map(coverFromNdvi)),
    totalRain,
    rainDays: w.rain.filter((r) => r >= 1).length,
    meanTmax: mean(w.tmax),
    hotDays: w.tmax.filter((t) => t >= 35).length,
    frostDays: w.tmin.filter((t) => t <= 0).length,
    longestDrySpell: longest,
    et0,
    waterBalance: totalRain - et0,
    days: w.dates.length,
  }
}

/** Stats when one source failed: the missing source's values are NaN (shown as —). */
export function partialStats(
  w: DailyWeather | null,
  ndvi: NdviPoint[] | null
): PeriodStats {
  const s = computeStats(
    w ?? { dates: [], rain: [], tmax: [], tmin: [], et0: [] },
    ndvi ?? []
  )
  if (!w)
    for (const k of [
      'totalRain',
      'rainDays',
      'meanTmax',
      'hotDays',
      'frostDays',
      'longestDrySpell',
      'et0',
      'waterBalance',
      'days',
    ] as const)
      s[k] = NaN
  return s
}

export function dayIndex(start: string, date: string): number {
  return Math.round(
    (Date.parse(date + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) /
      86400000
  )
}

export function periodDays(p: Period): number {
  return dayIndex(p.start, p.end) + 1
}

/** Plain-language summary of how period B compares with period A. */
export function describe(
  a: PeriodStats,
  b: PeriodStats,
  la: string,
  lb: string,
  t: T = makeT('en')
): string[] {
  const out: string[] = []
  const r0 = (n: number) => n.toFixed(0)
  if (Number.isFinite(a.meanCover) && Number.isFinite(b.meanCover)) {
    const d = b.meanCover - a.meanCover
    out.push(
      Math.abs(d) < 3
        ? t('sum.coverSame', {
            a: la,
            b: lb,
            va: r0(a.meanCover),
            vb: r0(b.meanCover),
          })
        : t('sum.coverDiff', {
            n: r0(Math.abs(d)),
            dir: t(d > 0 ? 'sum.higher' : 'sum.lower'),
            a: la,
            b: lb,
            va: r0(a.meanCover),
            vb: r0(b.meanCover),
          })
    )
  }
  if (a.totalRain > 0) {
    const d = ((b.totalRain - a.totalRain) / Math.abs(a.totalRain)) * 100
    out.push(
      Math.abs(d) < 10
        ? t('sum.rainSame', { va: r0(a.totalRain), vb: r0(b.totalRain) })
        : t('sum.rainDiff', {
            b: lb,
            n: r0(Math.abs(d)),
            dir: t(d > 0 ? 'sum.more' : 'sum.less'),
            va: r0(a.totalRain),
            vb: r0(b.totalRain),
          })
    )
  }
  if (b.longestDrySpell - a.longestDrySpell >= 7)
    out.push(
      t('sum.dryLonger', { va: a.longestDrySpell, vb: b.longestDrySpell })
    )
  else if (a.longestDrySpell - b.longestDrySpell >= 7)
    out.push(
      t('sum.dryShorter', { va: a.longestDrySpell, vb: b.longestDrySpell })
    )
  if (
    Number.isFinite(a.hotDays) &&
    Number.isFinite(b.hotDays) &&
    b.hotDays !== a.hotDays &&
    (a.hotDays > 0 || b.hotDays > 0)
  )
    out.push(t('sum.hot', { a: la, b: lb, va: a.hotDays, vb: b.hotDays }))
  const tempD = b.meanTmax - a.meanTmax
  if (Math.abs(tempD) >= 1)
    out.push(
      t('sum.temp', {
        n: Math.abs(tempD).toFixed(1),
        dir: t(tempD > 0 ? 'sum.warmer' : 'sum.cooler'),
        b: lb,
      })
    )
  return out
}

export type Verdict = {
  tone: 'good' | 'bad' | 'same' | 'unknown'
  title: string
  reasons: string[]
}

/**
 * One headline answer: is the later period better or worse? Green cover
 * decides when it's known (±5 points); otherwise rain does (±15%).
 */
export function verdict(
  a: PeriodStats,
  b: PeriodStats,
  la: string,
  t: T = makeT('en')
): Verdict {
  const reasons: string[] = []
  const cover = b.meanCover - a.meanCover
  const rainPct =
    a.totalRain > 0 ? ((b.totalRain - a.totalRain) / a.totalRain) * 100 : NaN
  if (Number.isFinite(cover))
    reasons.push(
      t('verdict.why.cover', {
        dir: t(cover >= 0 ? 'verdict.up' : 'verdict.down'),
        n: Math.abs(cover).toFixed(0),
        a: a.meanCover.toFixed(0),
        b: b.meanCover.toFixed(0),
      })
    )
  if (Number.isFinite(rainPct))
    reasons.push(
      t('verdict.why.rain', {
        dir: t(rainPct >= 0 ? 'verdict.up' : 'verdict.down'),
        pct: Math.abs(rainPct).toFixed(0),
        a: a.totalRain.toFixed(0),
        b: b.totalRain.toFixed(0),
      })
    )
  if (Number.isFinite(cover)) {
    const tone = cover >= 5 ? 'good' : cover <= -5 ? 'bad' : 'same'
    return {
      tone,
      title: t(
        tone === 'good'
          ? 'verdict.better'
          : tone === 'bad'
            ? 'verdict.worse'
            : 'verdict.same',
        { a: la }
      ),
      reasons,
    }
  }
  if (Number.isFinite(rainPct)) {
    const tone = rainPct >= 15 ? 'good' : rainPct <= -15 ? 'bad' : 'same'
    return {
      tone,
      title: t(
        tone === 'good'
          ? 'verdict.wetter'
          : tone === 'bad'
            ? 'verdict.drier'
            : 'verdict.sameRain',
        { a: la }
      ),
      reasons,
    }
  }
  return { tone: 'unknown', title: '', reasons }
}
