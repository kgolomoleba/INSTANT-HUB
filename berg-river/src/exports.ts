import type { DailyWeather, NdviPoint } from './api'
import type { Farm } from './farms'
import { coverFromNdvi, dayIndex, type Period, type PeriodStats } from './stats'
import type { DiaryEntry } from './store'

const cell = (v: unknown) => {
  const s =
    v == null || (typeof v === 'number' && !Number.isFinite(v)) ? '' : String(v)
  // Quote when needed; prefix formula-like text so spreadsheets don't run it.
  const safe = /^[=+\-@]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
export const toCsv = (rows: unknown[][]) =>
  rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'

const r2 = (n: number) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : '')

/** One row per day of each period: weather, plus satellite readings on their dates, plus diary notes. */
export function farmCsv(
  farm: Farm,
  periods: [Period, Period],
  names: [string, string],
  weather: [DailyWeather, DailyWeather] | null,
  ndvi: [NdviPoint[], NdviPoint[]] | null,
  diary: DiaryEntry[]
): string {
  const rows: unknown[][] = [
    [
      'farm',
      'period',
      'date',
      'day_of_period',
      'rain_mm',
      'tmax_c',
      'tmin_c',
      'et0_mm',
      'ndvi',
      'green_cover_pct',
      'diary_note',
    ],
  ]
  for (const i of [0, 1] as const) {
    const p = periods[i]
    const sat = new Map((ndvi?.[i] ?? []).map((x) => [x.date, x.ndvi]))
    const notes = new Map<string, string>()
    for (const e of diary)
      if (e.farmId === farm.id)
        notes.set(
          e.day,
          notes.has(e.day) ? `${notes.get(e.day)}; ${e.note}` : e.note
        )
    const days: string[] = []
    for (
      let t = Date.parse(p.start + 'T00:00:00Z');
      t <= Date.parse(p.end + 'T00:00:00Z');
      t += 86_400_000
    )
      days.push(new Date(t).toISOString().slice(0, 10))
    const w = weather?.[i]
    const wi = new Map((w?.dates ?? []).map((d, j) => [d, j]))
    for (const d of days) {
      const j = wi.get(d)
      const nd = sat.get(d)
      rows.push([
        farm.name,
        names[i],
        d,
        dayIndex(p.start, d),
        j == null ? '' : r2(w!.rain[j]),
        j == null ? '' : r2(w!.tmax[j]),
        j == null ? '' : r2(w!.tmin[j]),
        j == null ? '' : r2(w!.et0[j]),
        nd == null ? '' : r2(nd),
        nd == null ? '' : r2(coverFromNdvi(nd)),
        notes.get(d) ?? '',
      ])
    }
  }
  return toCsv(rows)
}

export function allFarmsCsv(
  names: [string, string],
  rows: { farm: Farm; stats?: [PeriodStats, PeriodStats] }[]
): string {
  const [a, b] = names
  const out: unknown[][] = [
    [
      'farm',
      'area_ha',
      `green_cover_pct_${a}`,
      `green_cover_pct_${b}`,
      `rain_mm_${a}`,
      `rain_mm_${b}`,
      `longest_dry_spell_days_${a}`,
      `longest_dry_spell_days_${b}`,
      `avg_high_c_${a}`,
      `avg_high_c_${b}`,
    ],
  ]
  for (const { farm, stats } of rows) {
    if (!stats) continue
    const [x, y] = stats
    out.push([
      farm.name,
      farm.areaHa == null ? '' : r2(farm.areaHa),
      r2(x.meanCover),
      r2(y.meanCover),
      r2(x.totalRain),
      r2(y.totalRain),
      x.longestDrySpell,
      y.longestDrySpell,
      r2(x.meanTmax),
      r2(y.meanTmax),
    ])
  }
  return toCsv(out)
}

export function download(
  filename: string,
  text: string,
  type = 'text/csv;charset=utf-8'
) {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const fileSafe = (s: string) =>
  s
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'farm'
