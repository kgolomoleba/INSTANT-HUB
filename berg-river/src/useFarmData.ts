import { useEffect, useState } from 'react'
import {
  fetchGreenness,
  fetchWeather,
  type DailyWeather,
  type NdviPoint,
  type Satellite,
} from './api'
import type { Farm } from './farms'
import { trackAge } from './net'
import {
  computeStats,
  partialStats,
  type Period,
  type PeriodStats,
} from './stats'

export type Part<T> = {
  data: [T, T] | null
  loading: boolean
  error: string | null
  /** Which satellite the green-cover readings came from. */
  satellite?: Satellite
}

export type FarmData = {
  /** When the oldest data on screen was fetched (ms), or null while loading. */
  updatedAt: number | null
  weather: Part<DailyWeather>
  ndvi: Part<NdviPoint[]>
  /** Available as soon as either source has loaded; missing values show as —. */
  stats: [PeriodStats, PeriodStats] | null
}

const empty = <T>(): Part<T> => ({ data: null, loading: false, error: null })
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function ndviArea(f: Farm, size: 0 | 1) {
  return f.boundary
    ? ({ kind: 'boundary', boundary: f.boundary } as const)
    : ({ kind: 'square', km: size } as const)
}

/** Weather and satellite data load independently: one failing doesn't hide the other. */
export function useFarmData(
  farm: Farm | null,
  periods: [Period, Period],
  size: 0 | 1,
  enabled: boolean,
  reloadKey = 0
): FarmData {
  const [weather, setWeather] = useState<Part<DailyWeather>>(empty)
  const [ndvi, setNdvi] = useState<Part<NdviPoint[]>>(empty)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [a, b] = periods

  useEffect(() => {
    if (!farm || !enabled) {
      setWeather(empty())
      setNdvi(empty())
      setUpdatedAt(null)
      return
    }
    let live = true
    setUpdatedAt(null)
    setWeather({ data: null, loading: true, error: null })
    setNdvi({ data: null, loading: true, error: null })
    // Both requests start inside trackAge so their data ages are collected.
    const age = trackAge(() => {
      Promise.all([
        fetchWeather(farm.lat, farm.lon, a.start, a.end),
        fetchWeather(farm.lat, farm.lon, b.start, b.end),
      ])
        .then((d) => {
          if (!live) return
          setWeather({ data: d, loading: false, error: null })
          if (Number.isFinite(age.oldest)) setUpdatedAt(age.oldest)
        })
        .catch(
          (e) =>
            live && setWeather({ data: null, loading: false, error: msg(e) })
        )
      fetchGreenness(farm.lat, farm.lon, [a, b], ndviArea(farm, size))
        .then((g) => {
          if (!live) return
          setNdvi({
            data: g.points,
            loading: false,
            error: null,
            satellite: g.satellite,
          })
          if (Number.isFinite(age.oldest)) setUpdatedAt(age.oldest)
        })
        .catch(
          (e) => live && setNdvi({ data: null, loading: false, error: msg(e) })
        )
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm, a.start, a.end, b.start, b.end, size, enabled, reloadKey])

  const stats: FarmData['stats'] =
    weather.data || ndvi.data
      ? ([0, 1].map((i) =>
          partialStats(weather.data?.[i] ?? null, ndvi.data?.[i] ?? null)
        ) as [PeriodStats, PeriodStats])
      : null
  return { updatedAt, weather, ndvi, stats }
}

/** Load several farms a few at a time (for the all-farms table). */
export async function loadFarmStats(
  farm: Farm,
  periods: [Period, Period],
  size: 0 | 1
): Promise<[PeriodStats, PeriodStats]> {
  const [a, b] = periods
  const area = ndviArea(farm, size)
  const [[wa, wb], g] = await Promise.all([
    Promise.all([
      fetchWeather(farm.lat, farm.lon, a.start, a.end),
      fetchWeather(farm.lat, farm.lon, b.start, b.end),
    ]),
    fetchGreenness(farm.lat, farm.lon, periods, area),
  ])
  return [computeStats(wa, g.points[0]), computeStats(wb, g.points[1])]
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (t: T, i: number) => Promise<R>
): Promise<void> {
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      await fn(items[i], i)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
}
