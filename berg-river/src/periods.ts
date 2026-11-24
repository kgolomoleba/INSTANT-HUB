import { periodDays, type Period } from './stats'

const DAY = 86_400_000
const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Latest day with weather data (the archive runs about 5 days behind). */
export const LATEST = iso(new Date(Date.now() - 6 * DAY))
export const EARLIEST = '2000-02-18' // first MODIS composite

export function periodError(p: Period): string | null {
  if (!p.start || !p.end) return 'Pick both dates.'
  if (p.end < p.start) return 'The end date is before the start date.'
  if (p.end > LATEST) return `Weather data is available up to ${LATEST}.`
  if (p.start < EARLIEST) return 'Satellite data starts in February 2000.'
  if (periodDays(p) > 366) return 'Keep each period to one year or less.'
  return null
}

const shiftYears = (d: string, by: number) =>
  `${Number(d.slice(0, 4)) + by}${d.slice(4)}`
export const shiftPeriod = (p: Period, by: number): Period => ({
  ...p,
  start: shiftYears(p.start, by),
  end: shiftYears(p.end, by),
})

export type PresetId = 'winter' | 'summer' | '90d' | '12m'
export type Preset = {
  id: PresetId
  label: string
  hint: string
  periods: [Period, Period]
}

/** One-tap comparisons, always ending on data that exists. */
export function presets(latest = LATEST): Preset[] {
  const y = Number(latest.slice(0, 4))
  // Winter grain season (May–Oct): latest complete one, else the one before.
  const wy = latest >= `${y}-10-31` ? y : y - 1
  // Summer season (Nov–Apr).
  const sy = latest >= `${y}-04-30` ? y : y - 1
  const end = new Date(latest + 'T00:00:00Z')
  const back = (days: number) => iso(new Date(end.getTime() - days * DAY))
  const lastYear = (d: string) => shiftYears(d, -1)
  const p = (start: string, stop: string): Period => ({
    label: '',
    start,
    end: stop,
  })
  return [
    {
      id: 'winter',
      label: 'Winter season vs last year',
      hint: 'May–October, the grain season',
      periods: [
        p(`${wy - 1}-05-01`, `${wy - 1}-10-31`),
        p(`${wy}-05-01`, `${wy}-10-31`),
      ],
    },
    {
      id: 'summer',
      label: 'Summer season vs last year',
      hint: 'November–April',
      periods: [
        p(`${sy - 2}-11-01`, `${sy - 1}-04-30`),
        p(`${sy - 1}-11-01`, `${sy}-04-30`),
      ],
    },
    {
      id: '90d',
      label: 'Last 90 days vs a year ago',
      hint: 'Recent conditions',
      periods: [p(lastYear(back(89)), lastYear(latest)), p(back(89), latest)],
    },
    {
      id: '12m',
      label: 'Last 12 months vs the 12 before',
      hint: 'Whole-year view',
      periods: [p(back(729), back(365)), p(back(364), latest)],
    },
  ]
}

export function defaultPeriods(): [Period, Period] {
  return presets()[0].periods
}

/** The comparison that fits a farm's main season. */
export function seasonPeriods(
  season: 'winter' | 'summer' | 'year' | undefined
): [Period, Period] {
  const id =
    season === 'summer' ? 'summer' : season === 'year' ? '12m' : 'winter'
  return presets().find((p) => p.id === id)!.periods
}

export function presetSeason(
  id: PresetId
): 'winter' | 'summer' | 'year' | null {
  return id === 'winter'
    ? 'winter'
    : id === 'summer'
      ? 'summer'
      : id === '12m'
        ? 'year'
        : null
}

/** Period problems as translation keys. */
export function periodErrorKey(p: Period): {
  key:
    | 'err.dates'
    | 'err.backwards'
    | 'err.tooLate'
    | 'err.tooEarly'
    | 'err.tooLong'
  date?: string
} | null {
  if (!p.start || !p.end) return { key: 'err.dates' }
  if (p.end < p.start) return { key: 'err.backwards' }
  if (p.end > LATEST) return { key: 'err.tooLate', date: LATEST }
  if (p.start < EARLIEST) return { key: 'err.tooEarly' }
  if (periodDays(p) > 366) return { key: 'err.tooLong' }
  return null
}

/** Short name for a period: "2025", "2025–26", or "1 Mar–29 May 2026". */
export function periodName(p: Period, other?: Period, loc = 'en-ZA'): string {
  const ys = p.start.slice(0, 4)
  const ye = p.end.slice(0, 4)
  const wholeSeason =
    p.start.slice(5) === other?.start.slice(5) &&
    p.end.slice(5) === other?.end.slice(5)
  if (other && wholeSeason && ys !== other.start.slice(0, 4))
    return ys === ye ? ys : `${ys}–${ye.slice(2)}`
  const fmt = (d: string, withYear: boolean) =>
    new Date(d + 'T00:00:00Z').toLocaleDateString(loc, {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
      timeZone: 'UTC',
    })
  return `${fmt(p.start, ys !== ye)}–${fmt(p.end, true)}`
}

// ------------------------------------------------------------ share links
const DATE = /^\d{4}-\d{2}-\d{2}$/

/** "#a=2025-05-01_2025-10-31&b=…&farm=…" */
export function toHash(periods: [Period, Period], farmId?: string): string {
  const q = new URLSearchParams({
    a: `${periods[0].start}_${periods[0].end}`,
    b: `${periods[1].start}_${periods[1].end}`,
  })
  if (farmId) q.set('farm', farmId)
  return '#' + q.toString()
}

export function fromHash(hash: string): {
  periods?: [Period, Period]
  farmId?: string
} {
  const q = new URLSearchParams(hash.replace(/^#/, ''))
  const read = (k: string): Period | null => {
    const [start, end] = (q.get(k) ?? '').split('_')
    return DATE.test(start ?? '') && DATE.test(end ?? '')
      ? { label: '', start, end }
      : null
  }
  const a = read('a')
  const b = read('b')
  const farm = q.get('farm') ?? undefined
  return {
    periods: a && b ? [a, b] : undefined,
    farmId: farm && /^[\w-]{1,64}$/.test(farm) ? farm : undefined,
  }
}
