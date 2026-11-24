import { useEffect, useRef, useState } from 'react'
import CropsPanel from './CropsPanel'
import LineChart, { type ChartEvent, type ChartSeries } from './LineChart'
import { LATEST, periodName } from './periods'
import { SATELLITE_LABEL } from './api'
import { download, farmCsv, fileSafe } from './exports'
import type { Farm } from './farms'
import { fmtHa } from './Sidebar'
import {
  coverFromNdvi,
  dayIndex,
  describe,
  periodDays,
  type Period,
  type PeriodStats,
} from './stats'
import type { DiaryEntry } from './store'
import type { FarmData } from './useFarmData'

type Tab = 'overview' | 'charts' | 'crops' | 'diary'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'charts', label: 'Charts' },
  { id: 'crops', label: 'Crops' },
  { id: 'diary', label: 'Diary' },
]

const fmt = (n: number, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '—')
const signed = (n: number, d = 0) =>
  Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(d)}` : '—'

type Props = {
  farm: Farm
  periods: [Period, Period]
  size: 0 | 1
  onSize: (s: 0 | 1) => void
  data: FarmData
  onRetry: () => void
  diary: DiaryEntry[]
  onAddDiary: (day: string, note: string) => void
  onRemoveDiary: (e: DiaryEntry) => void
  onRename: (name: string) => void
  shareUrl: string
  /** Present when signed in with Supabase: enables 'Explain this season'. */
  explain?: (payload: Record<string, unknown>) => Promise<string>
}

export default function FarmView(p: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [printing, setPrinting] = useState(false)
  const [copied, setCopied] = useState(false)
  const names: [string, string] = [
    periodName(p.periods[0], p.periods[1]),
    periodName(p.periods[1], p.periods[0]),
  ]

  useEffect(() => {
    if (!printing) return
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 300) // let all sections render first
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', done)
    }
  }, [printing])

  const exportCsv = () =>
    download(
      `${fileSafe(p.farm.name)}_${names[0]}_vs_${names[1]}.csv`,
      farmCsv(
        p.farm,
        p.periods,
        names,
        p.data.weather.data,
        p.data.ndvi.data,
        p.diary
      )
    )

  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: `${p.farm.name}: Berg River Farms`,
          url: p.shareUrl,
        })
      else {
        await navigator.clipboard.writeText(p.shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* cancelled */
    }
  }

  const show = (t: Tab) => printing || tab === t

  return (
    <article className="farm-view">
      <FarmHeader
        farm={p.farm}
        size={p.size}
        onSize={p.onSize}
        onRename={p.onRename}
      />
      {p.data.ndvi.satellite && (
        <p className="satellite-note">
          Satellite: {SATELLITE_LABEL[p.data.ndvi.satellite]}
        </p>
      )}

      <div className="actions no-print">
        <button
          type="button"
          onClick={exportCsv}
          disabled={!p.data.weather.data && !p.data.ndvi.data}
        >
          Download data (CSV)
        </button>
        <button type="button" onClick={() => setPrinting(true)}>
          Print report
        </button>
        <button type="button" onClick={share}>
          {copied ? 'Link copied' : 'Share link'}
        </button>
      </div>

      <div className="tabs no-print" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'on' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'diary' && p.diary.length > 0 && (
              <span className="count">{p.diary.length}</span>
            )}
          </button>
        ))}
      </div>

      <SourceStatus data={p.data} onRetry={p.onRetry} />

      {show('overview') && (
        <>
          <Overview
            stats={p.data.stats}
            names={names}
            loading={p.data.weather.loading || p.data.ndvi.loading}
          />
          {p.explain &&
            p.data.stats &&
            !p.data.ndvi.loading &&
            !p.data.weather.loading && (
              <Explain
                key={`${p.periods[0].start}${p.periods[1].start}${p.periods[0].end}${p.periods[1].end}`}
                run={() =>
                  p.explain!({
                    farm: {
                      name: p.farm.name,
                      areaHa: p.farm.areaHa,
                      satellite: p.data.ndvi.satellite,
                    },
                    periods: { a: names[0], b: names[1] },
                    stats: {
                      a: roundStats(p.data.stats![0]),
                      b: roundStats(p.data.stats![1]),
                    },
                    diary: p.diary.filter((e) =>
                      p.periods.some((q) => e.day >= q.start && e.day <= q.end)
                    ),
                  })
                }
              />
            )}
        </>
      )}
      {show('charts') && (
        <Charts
          periods={p.periods}
          names={names}
          data={p.data}
          diary={p.diary}
        />
      )}
      {show('crops') && <CropsPanel farm={p.farm} />}
      {show('diary') && (
        <DiaryPanel
          diary={p.diary}
          periods={p.periods}
          onAdd={p.onAddDiary}
          onRemove={p.onRemoveDiary}
        />
      )}
    </article>
  )
}

function FarmHeader({
  farm,
  size,
  onSize,
  onRename,
}: {
  farm: Farm
  size: 0 | 1
  onSize: (s: 0 | 1) => void
  onRename: (n: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(farm.name)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => setName(farm.name), [farm.name])
  useEffect(() => {
    if (editing) input.current?.select()
  }, [editing])
  const save = () => {
    onRename(name)
    setEditing(false)
  }

  return (
    <header className="farm-head">
      {editing ? (
        <form
          className="rename"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <input
            ref={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            aria-label="Farm name"
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
          />
          <button type="submit">Save</button>
          <button
            type="button"
            className="link"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <h2>
          {farm.name}
          <button
            type="button"
            className="link rename-btn no-print"
            onClick={() => setEditing(true)}
          >
            Rename
          </button>
        </h2>
      )}
      <p className="meta">
        {farm.boundary ? (
          <>
            {fmtHa(farm.areaHa)} · boundary from{' '}
            {farm.source === 'file' ? 'an imported file' : 'Cape Farm Mapper'} ·
            satellite readings inside the boundary
          </>
        ) : (
          <>
            Point at {farm.lat.toFixed(3)}, {farm.lon.toFixed(3)} · satellite
            readings from{' '}
            <select
              value={size}
              onChange={(e) => onSize(Number(e.target.value) as 0 | 1)}
              aria-label="Area around the point"
            >
              <option value={1}>a 2 × 2 km square around it</option>
              <option value={0}>the single 250 m pixel</option>
            </select>
          </>
        )}
      </p>
    </header>
  )
}

function SourceStatus({
  data,
  onRetry,
}: {
  data: FarmData
  onRetry: () => void
}) {
  const errs = [
    data.ndvi.error && `Satellite data: ${data.ndvi.error}.`,
    data.weather.error && `Weather data: ${data.weather.error}.`,
  ].filter(Boolean)
  if (!errs.length) return null
  return (
    <div className="notice error source-error" role="alert">
      <div>
        {errs.map((e) => (
          <div key={e as string}>{e}</div>
        ))}
        <small>Everything that did load is shown below.</small>
      </div>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

function Overview({
  stats,
  names,
  loading,
}: {
  stats: [PeriodStats, PeriodStats] | null
  names: [string, string]
  loading: boolean
}) {
  if (!stats && loading)
    return (
      <div className="tiles" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="tile skeleton" />
        ))}
      </div>
    )
  if (!stats) return null
  const [a, b] = stats
  const tiles = [
    {
      label: 'Green cover (avg)',
      a: fmt(a.meanCover),
      b: fmt(b.meanCover),
      d: signed(b.meanCover - a.meanCover),
      unit: '%',
      key: true,
    },
    {
      label: 'Rainfall',
      a: fmt(a.totalRain),
      b: fmt(b.totalRain),
      d: signed(b.totalRain - a.totalRain),
      unit: 'mm',
      key: true,
    },
    {
      label: 'Longest dry spell',
      a: fmt(a.longestDrySpell),
      b: fmt(b.longestDrySpell),
      d: signed(b.longestDrySpell - a.longestDrySpell),
      unit: 'days',
      key: true,
    },
    {
      label: 'Avg daily high',
      a: fmt(a.meanTmax, 1),
      b: fmt(b.meanTmax, 1),
      d: signed(b.meanTmax - a.meanTmax, 1),
      unit: '°C',
      key: true,
    },
    {
      label: 'Peak green cover',
      a: fmt(coverFromNdvi(a.peakNdvi)),
      b: fmt(coverFromNdvi(b.peakNdvi)),
      d: signed(coverFromNdvi(b.peakNdvi) - coverFromNdvi(a.peakNdvi)),
      unit: '%',
    },
    {
      label: 'Rain days (≥ 1 mm)',
      a: fmt(a.rainDays),
      b: fmt(b.rainDays),
      d: signed(b.rainDays - a.rainDays),
      unit: '',
    },
    {
      label: 'Days ≥ 35 °C',
      a: fmt(a.hotDays),
      b: fmt(b.hotDays),
      d: signed(b.hotDays - a.hotDays),
      unit: '',
    },
    {
      label: 'Frost days (≤ 0 °C)',
      a: fmt(a.frostDays),
      b: fmt(b.frostDays),
      d: signed(b.frostDays - a.frostDays),
      unit: '',
    },
    {
      label: 'Rain minus evaporation',
      a: fmt(a.waterBalance),
      b: fmt(b.waterBalance),
      d: signed(b.waterBalance - a.waterBalance),
      unit: 'mm',
    },
    {
      label: 'NDVI (avg)',
      a: fmt(a.meanNdvi, 2),
      b: fmt(b.meanNdvi, 2),
      d: signed(b.meanNdvi - a.meanNdvi, 2),
      unit: '',
    },
  ]
  const lines = describe(a, b, names[0], names[1])
  return (
    <section className="overview">
      {lines.length > 0 && (
        <ul className="summary">
          {lines.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      <div className="tiles">
        {tiles.map((t) => (
          <div key={t.label} className={`tile ${t.key ? 'key' : ''}`}>
            <div className="tile-label">{t.label}</div>
            <div className="tile-values">
              <span title={names[0]}>
                <i className="dot d1" />
                {t.a}
              </span>
              <span title={names[1]}>
                <i className="dot d2" />
                {t.b}
              </span>
              <span className="unit">{t.unit}</span>
            </div>
            <div className="tile-delta">change {t.d}</div>
          </div>
        ))}
      </div>
      {loading && <p className="hint">Still loading some data…</p>}
    </section>
  )
}

function Charts({
  periods,
  names,
  data,
  diary,
}: {
  periods: [Period, Period]
  names: [string, string]
  data: FarmData
  diary: DiaryEntry[]
}) {
  const [table, setTable] = useState(false)
  const xMax = Math.max(periodDays(periods[0]), periodDays(periods[1])) - 1
  const color = (i: number) => `var(--series-${i + 1})`
  // Label days by period B's calendar (e.g. "1 Jun"); periods usually share a season.
  const xLabel = (x: number) =>
    new Date(
      Date.parse(periods[1].start + 'T00:00:00Z') + x * 86_400_000
    ).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })

  const cover: ChartSeries[] = data.ndvi.data
    ? [0, 1].map((i) => ({
        key: `p${i}`,
        label: names[i],
        color: color(i),
        points: data.ndvi.data![i].map((pt) => ({
          x: dayIndex(periods[i].start, pt.date),
          y: coverFromNdvi(pt.ndvi),
          date: pt.date,
        })),
      }))
    : []
  const rain: ChartSeries[] = data.weather.data
    ? [0, 1].map((i) => {
        let acc = 0
        const w = data.weather.data![i]
        return {
          key: `p${i}`,
          label: names[i],
          color: color(i),
          points: w.dates.map((d, j) => {
            acc += Number.isFinite(w.rain[j]) ? w.rain[j] : 0
            return { x: j, y: acc, date: d }
          }),
        }
      })
    : []
  const events: ChartEvent[] = diary.flatMap((e) =>
    [0, 1]
      .filter((i) => e.day >= periods[i].start && e.day <= periods[i].end)
      .map((i) => ({
        x: dayIndex(periods[i].start, e.day),
        label: `${e.day}: ${e.note}`,
        color: color(i),
      }))
  )

  return (
    <section className="charts">
      {data.ndvi.loading && (
        <div
          className="chart skeleton tall"
          aria-label="Loading satellite data"
        />
      )}
      {cover.length > 0 && (
        <LineChart
          title="Estimated green cover (%)"
          series={cover}
          xMax={xMax}
          xLabel={xLabel}
          format={(v) => `${v.toFixed(0)}%`}
          yMaxFloor={50}
          markers
          events={events}
        />
      )}
      {data.weather.loading && (
        <div
          className="chart skeleton tall"
          aria-label="Loading weather data"
        />
      )}
      {rain.length > 0 && (
        <LineChart
          title="Rainfall so far (mm)"
          series={rain}
          xMax={xMax}
          xLabel={xLabel}
          format={(v) => v.toFixed(0)}
          yMaxFloor={50}
          events={events}
        />
      )}
      {data.ndvi.data && (
        <>
          <button
            type="button"
            className="link no-print"
            onClick={() => setTable((s) => !s)}
          >
            {table ? 'Hide' : 'Show'} satellite readings as a table
          </button>
          {table && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Reading from</th>
                    <th>NDVI</th>
                    <th>Green cover</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1].flatMap((i) =>
                    data.ndvi.data![i].map((pt) => (
                      <tr key={`${i}${pt.date}`}>
                        <td>{names[i]}</td>
                        <td>{pt.date}</td>
                        <td>{pt.ndvi.toFixed(3)}</td>
                        <td>{coverFromNdvi(pt.ndvi).toFixed(0)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function DiaryPanel({
  diary,
  periods,
  onAdd,
  onRemove,
}: {
  diary: DiaryEntry[]
  periods: [Period, Period]
  onAdd: (day: string, note: string) => void
  onRemove: (e: DiaryEntry) => void
}) {
  const [day, setDay] = useState(LATEST)
  const [note, setNote] = useState('')
  const inPeriod = (d: string) =>
    periods.some((p) => d >= p.start && d <= p.end)
  return (
    <section className="diary">
      <p className="hint">
        Note what happened on the farm: planting, spraying, harvest, hail, fire,
        flooding. Notes inside the compared periods show as ◆ on the charts.
      </p>
      <form
        className="diary-form no-print"
        onSubmit={(e) => {
          e.preventDefault()
          if (!note.trim()) return
          onAdd(day, note)
          setNote('')
        }}
      >
        <input
          type="date"
          value={day}
          max={new Date().toISOString().slice(0, 10)}
          min="2000-01-01"
          onChange={(e) => setDay(e.target.value)}
          aria-label="Date"
          required
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Planted wheat, 120 kg/ha"
          maxLength={500}
          aria-label="Note"
          required
        />
        <button type="submit">Add note</button>
      </form>
      {!diary.length ? (
        <p className="muted">No notes yet.</p>
      ) : (
        <ul className="diary-list">
          {[...diary].reverse().map((e) => (
            <li key={e.id} className={inPeriod(e.day) ? 'in-period' : ''}>
              <time dateTime={e.day}>{e.day}</time>
              <span>{e.note}</span>
              <button
                type="button"
                className="remove no-print"
                onClick={() => onRemove(e)}
                aria-label={`Delete note from ${e.day}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const roundStats = (s: PeriodStats) =>
  Object.fromEntries(
    Object.entries(s).map(([k, v]) => [
      k,
      Number.isFinite(v) ? Math.round(v * 100) / 100 : null,
    ])
  )

function Explain({ run }: { run: () => Promise<string> }) {
  const [state, setState] = useState<{
    kind: 'idle' | 'busy' | 'done' | 'error'
    text?: string
  }>({ kind: 'idle' })
  const go = async () => {
    setState({ kind: 'busy' })
    try {
      setState({ kind: 'done', text: await run() })
    } catch (e) {
      setState({
        kind: 'error',
        text: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return (
    <section className="explain" aria-live="polite">
      {state.kind === 'done' ? (
        <>
          <p className="explain-text">{state.text}</p>
          <p className="explain-foot">
            Written by Claude (AI) from the figures above. Check anything
            important.
          </p>
        </>
      ) : (
        <button
          type="button"
          className="explain-btn no-print"
          onClick={go}
          disabled={state.kind === 'busy'}
        >
          {state.kind === 'busy' ? 'Writing…' : '✦ Explain this season'}
        </button>
      )}
      {state.kind === 'error' && (
        <p className="notice small error">{state.text}</p>
      )}
    </section>
  )
}
