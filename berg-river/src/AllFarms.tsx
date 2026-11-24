import { useState } from 'react'
import { allFarmsCsv, download } from './exports'
import type { Farm } from './farms'
import type { PeriodStats, Period } from './stats'
import { loadFarmStats, mapLimit } from './useFarmData'

type Row = { farm: Farm; stats?: [PeriodStats, PeriodStats]; error?: string }
type SortKey = 'name' | 'cover' | 'rain'

const fmt = (n: number, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '—')
const signed = (n: number, d = 0) =>
  Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(d)}` : '—'
const coverChange = (r: Row) =>
  r.stats ? r.stats[1].meanCover - r.stats[0].meanCover : NaN
const rainChange = (r: Row) =>
  r.stats && r.stats[0].totalRain > 0
    ? ((r.stats[1].totalRain - r.stats[0].totalRain) / r.stats[0].totalRain) *
      100
    : NaN

type Props = {
  farms: Farm[]
  periods: [Period, Period]
  names: [string, string]
  size: 0 | 1
  disabled: boolean
  onSelect: (id: string) => void
}

export default function AllFarms({
  farms,
  periods,
  names,
  size,
  disabled,
  onSelect,
}: Props) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [sort, setSort] = useState<SortKey>('cover')

  const run = async () => {
    setBusy(true)
    const out: Row[] = farms.map((farm) => ({ farm }))
    setRows([...out])
    // A few at a time: quicker than one by one, gentle on the free services.
    await mapLimit(farms, 3, async (farm, i) => {
      try {
        out[i] = { farm, stats: await loadFarmStats(farm, periods, size) }
      } catch (e) {
        out[i] = { farm, error: e instanceof Error ? e.message : String(e) }
      }
      setRows([...out])
    })
    setBusy(false)
  }

  const key = (r: Row) =>
    sort === 'cover' ? coverChange(r) : sort === 'rain' ? rainChange(r) : 0
  const sorted = rows
    ? [...rows].sort((a, b) => {
        if (sort === 'name') return a.farm.name.localeCompare(b.farm.name)
        const x = key(a)
        const y = key(b)
        if (!Number.isFinite(x)) return 1
        if (!Number.isFinite(y)) return -1
        return x - y // biggest drops first
      })
    : null
  const done = rows?.filter((r) => r.stats).length ?? 0

  return (
    <section className="all">
      <div className="all-head">
        <div>
          <h3>All farms</h3>
          <p className="hint">
            Same periods, every farm. Biggest drop in green cover first.
          </p>
        </div>
        <div className="all-actions">
          {rows && done > 0 && (
            <button
              type="button"
              onClick={() =>
                download(
                  `all-farms_${names[0]}_vs_${names[1]}.csv`,
                  allFarmsCsv(names, rows)
                )
              }
            >
              Download (CSV)
            </button>
          )}
          <button
            type="button"
            className="primary"
            onClick={run}
            disabled={busy || disabled}
          >
            {busy
              ? `Comparing… ${done}/${farms.length}`
              : rows
                ? 'Compare again'
                : 'Compare all farms'}
          </button>
        </div>
      </div>
      {sorted && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="sort"
                    onClick={() => setSort('name')}
                    aria-pressed={sort === 'name'}
                  >
                    Farm
                  </button>
                </th>
                <th>Cover {names[0]}</th>
                <th>Cover {names[1]}</th>
                <th>
                  <button
                    type="button"
                    className="sort"
                    onClick={() => setSort('cover')}
                    aria-pressed={sort === 'cover'}
                  >
                    Change
                  </button>
                </th>
                <th>Rain {names[0]}</th>
                <th>Rain {names[1]}</th>
                <th>
                  <button
                    type="button"
                    className="sort"
                    onClick={() => setSort('rain')}
                    aria-pressed={sort === 'rain'}
                  >
                    Rain change
                  </button>
                </th>
                <th>Dry spell (days)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr
                  key={r.farm.id}
                  onClick={() => onSelect(r.farm.id)}
                  className="clickable"
                >
                  <td>{r.farm.name}</td>
                  {r.stats ? (
                    <>
                      <td>{fmt(r.stats[0].meanCover)}%</td>
                      <td>{fmt(r.stats[1].meanCover)}%</td>
                      <td className={coverChange(r) <= -10 ? 'drop' : ''}>
                        {signed(coverChange(r))}
                      </td>
                      <td>{fmt(r.stats[0].totalRain)} mm</td>
                      <td>{fmt(r.stats[1].totalRain)} mm</td>
                      <td>
                        {Number.isFinite(rainChange(r))
                          ? `${signed(rainChange(r))}%`
                          : '—'}
                      </td>
                      <td>
                        {r.stats[0].longestDrySpell} →{' '}
                        {r.stats[1].longestDrySpell}
                      </td>
                    </>
                  ) : (
                    <td colSpan={7} className="muted">
                      {r.error ? `Couldn't load: ${r.error}` : 'Waiting…'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
