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
  const x = Math.min(1, Math.max(0, (ndvi - NDVI_SOIL) / (NDVI_FULL - NDVI_SOIL)))
  return x * x * 100
}

const mean = (xs: number[]) => {
  const v = xs.filter(Number.isFinite)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN
}
const sum = (xs: number[]) => xs.filter(Number.isFinite).reduce((a, b) => a + b, 0)

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

export function dayIndex(start: string, date: string): number {
  return Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 86400000)
}

export function periodDays(p: Period): number {
  return dayIndex(p.start, p.end) + 1
}

const pct = (a: number, b: number) => ((b - a) / Math.abs(a)) * 100

/** Plain-language summary of how period B compares with period A. */
export function describe(a: PeriodStats, b: PeriodStats, la: string, lb: string): string[] {
  const out: string[] = []
  if (Number.isFinite(a.meanCover) && Number.isFinite(b.meanCover)) {
    const d = b.meanCover - a.meanCover
    out.push(
      Math.abs(d) < 3
        ? `Green cover was about the same in ${lb} as in ${la} (${b.meanCover.toFixed(0)}% vs ${a.meanCover.toFixed(0)}%).`
        : `Green cover was ${Math.abs(d).toFixed(0)} points ${d > 0 ? 'higher' : 'lower'} in ${lb} (${b.meanCover.toFixed(0)}%) than in ${la} (${a.meanCover.toFixed(0)}%).`,
    )
  }
  if (a.totalRain > 0) {
    const d = pct(a.totalRain, b.totalRain)
    out.push(
      Math.abs(d) < 10
        ? `Rainfall was similar: ${b.totalRain.toFixed(0)} mm vs ${a.totalRain.toFixed(0)} mm.`
        : `${lb} had ${Math.abs(d).toFixed(0)}% ${d > 0 ? 'more' : 'less'} rain: ${b.totalRain.toFixed(0)} mm vs ${a.totalRain.toFixed(0)} mm.`,
    )
  }
  if (b.longestDrySpell - a.longestDrySpell >= 7)
    out.push(`The longest dry spell grew from ${a.longestDrySpell} to ${b.longestDrySpell} days.`)
  else if (a.longestDrySpell - b.longestDrySpell >= 7)
    out.push(`The longest dry spell shrank from ${a.longestDrySpell} to ${b.longestDrySpell} days.`)
  if (b.hotDays !== a.hotDays && (a.hotDays > 0 || b.hotDays > 0))
    out.push(`Days at 35 °C or hotter: ${b.hotDays} in ${lb}, ${a.hotDays} in ${la}.`)
  const tempD = b.meanTmax - a.meanTmax
  if (Math.abs(tempD) >= 1)
    out.push(`Average daily high was ${Math.abs(tempD).toFixed(1)} °C ${tempD > 0 ? 'warmer' : 'cooler'} in ${lb}.`)
  return out
}
