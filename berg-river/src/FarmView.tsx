import { useEffect, useRef, useState } from 'react'
import CropsPanel from './CropsPanel'
import LineChart, { type ChartEvent, type ChartSeries } from './LineChart'
import { LATEST, periodName } from './periods'
import { download, farmCsv, fileSafe } from './exports'
import type { Farm, Season } from './farms'
import { useI18n, locale, type Key, type T } from './i18n'
import { fmtHa } from './Sidebar'
import {
  coverFromNdvi,
  dayIndex,
  describe,
  periodDays,
  verdict,
  type Period,
  type PeriodStats,
} from './stats'
import type { DiaryEntry } from './store'
import type { FarmData } from './useFarmData'

type Tab = 'overview' | 'charts' | 'crops' | 'diary'
const TABS: { id: Tab; key: Key }[] = [
  { id: 'overview', key: 'tab.overview' },
  { id: 'charts', key: 'tab.charts' },
  { id: 'crops', key: 'tab.crops' },
  { id: 'diary', key: 'tab.diary' },
]

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
  onSeason: (s: Season) => void
  shareUrl: string
  /** Present when signed in with Supabase: enables the plain-words explanation. */
  explain?: (payload: Record<string, unknown>) => Promise<string>
}

export default function FarmView(p: Props) {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<Tab>('overview')
  const [printing, setPrinting] = useState(false)
  const [copied, setCopied] = useState(false)
  const loc = locale(lang)
  const names: [string, string] = [
    periodName(p.periods[0], p.periods[1], loc),
    periodName(p.periods[1], p.periods[0], loc),
  ]
  const loading = p.data.weather.loading || p.data.ndvi.loading

  useEffect(() => {
    if (!printing) return
    const done = () => setPrinting(false)
    window.addEventListener('afterprint', done)
    const timer = setTimeout(() => window.print(), 300)
    return () => {
      clearTimeout(timer)
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
          title: `${p.farm.name}: ${t('app.title')}`,
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

  const show = (x: Tab) => printing || tab === x

  return (
    <article className="farm-view">
      <FarmHeader
        farm={p.farm}
        size={p.size}
        onSize={p.onSize}
        onRename={p.onRename}
        onSeason={p.onSeason}
      />

      <Verdict stats={p.data.stats} names={names} loading={loading} t={t} />

      <div className="tabs no-print" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            className={tab === x.id ? 'on' : ''}
            onClick={() => setTab(x.id)}
          >
            {t(x.key)}
            {x.id === 'diary' && p.diary.length > 0 && (
              <span className="count">{p.diary.length}</span>
            )}
          </button>
        ))}
      </div>

      <Problems data={p.data} onRetry={p.onRetry} t={t} />

      {show('overview') && (
        <>
          <Figures stats={p.data.stats} names={names} loading={loading} t={t} />
          {p.explain && p.data.stats && !loading && (
            <Explain
              key={`${p.periods[0].start}${p.periods[1].start}${p.periods[0].end}${p.periods[1].end}${lang}`}
              t={t}
              run={() =>
                p.explain!({
                  language: lang === 'af' ? 'Afrikaans' : 'English',
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

      <div className="actions no-print">
        <button
          type="button"
          onClick={exportCsv}
          disabled={!p.data.weather.data && !p.data.ndvi.data}
        >
          ⬇ {t('farm.download')}
        </button>
        <button type="button" onClick={() => setPrinting(true)}>
          🖨 {t('farm.print')}
        </button>
        <button type="button" onClick={share}>
          ↗ {copied ? t('farm.copied') : t('farm.share')}
        </button>
      </div>
      {p.data.ndvi.satellite && (
        <p className="satellite-note">
          {t(`farm.satellite.${p.data.ndvi.satellite}` as Key)}
        </p>
      )}
    </article>
  )
}

function FarmHeader({
  farm,
  size,
  onSize,
  onRename,
  onSeason,
}: {
  farm: Farm
  size: 0 | 1
  onSize: (s: 0 | 1) => void
  onRename: (n: string) => void
  onSeason: (s: Season) => void
}) {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(farm.name)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => setName(farm.name), [farm.name])
  useEffect(() => {
    if (editing) input.current?.select()
  }, [editing])

  return (
    <header className="farm-head">
      {editing ? (
        <form
          className="rename"
          onSubmit={(e) => {
            e.preventDefault()
            onRename(name)
            setEditing(false)
          }}
        >
          <input
            ref={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            aria-label={t('farm.name')}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
          />
          <button type="submit" className="primary">
            {t('farm.save')}
          </button>
          <button
            type="button"
            className="link"
            onClick={() => setEditing(false)}
          >
            {t('farm.cancel')}
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
            {t('farm.rename')}
          </button>
        </h2>
      )}
      <p className="meta">
        {farm.boundary
          ? t('farm.meta.boundary', {
              ha: fmtHa(farm.areaHa),
              source: t(
                farm.source === 'file' ? 'farm.meta.file' : 'farm.meta.cfm'
              ),
            })
          : t('farm.meta.point', { area: '' })}
        {!farm.boundary && (
          <select
            value={size}
            onChange={(e) => onSize(Number(e.target.value) as 0 | 1)}
            aria-label={t('farm.meta.point', { area: '' })}
          >
            <option value={1}>{t('farm.area.square')}</option>
            <option value={0}>{t('farm.area.pixel')}</option>
          </select>
        )}
        <span className="no-print">
          {' · '}
          <label>
            {t('farm.season')}{' '}
            <select
              value={farm.season ?? 'winter'}
              onChange={(e) => onSeason(e.target.value as Season)}
            >
              <option value="winter">{t('season.winter')}</option>
              <option value="summer">{t('season.summer')}</option>
              <option value="year">{t('season.year')}</option>
            </select>
          </label>
        </span>
      </p>
    </header>
  )
}

function Problems({
  data,
  onRetry,
  t,
}: {
  data: FarmData
  onRetry: () => void
  t: T
}) {
  const items = [
    data.ndvi.error && {
      text: t('problem.satellite'),
      detail: data.ndvi.error,
    },
    data.weather.error && {
      text: t('problem.weather'),
      detail: data.weather.error,
    },
  ].filter(Boolean) as { text: string; detail: string }[]
  if (!items.length) return null
  return (
    <div className="notice error source-error" role="alert">
      <div>
        {items.map((x) => (
          <div key={x.text}>{x.text}</div>
        ))}
        <small>{t('problem.hint')}</small>
        <details>
          <summary>{t('problem.details')}</summary>
          {items.map((x) => (
            <div key={x.detail}>{x.detail}</div>
          ))}
        </details>
      </div>
      <button type="button" className="primary" onClick={onRetry}>
        {t('problem.retry')}
      </button>
    </div>
  )
}

function Verdict({
  stats,
  names,
  loading,
  t,
}: {
  stats: [PeriodStats, PeriodStats] | null
  names: [string, string]
  loading: boolean
  t: T
}) {
  if (!stats)
    return loading ? (
      <div className="verdict loading">{t('verdict.loading')}</div>
    ) : null
  const v = verdict(stats[0], stats[1], names[0], t)
  if (v.tone === 'unknown') return null
  const icon = v.tone === 'good' ? '🟢' : v.tone === 'bad' ? '🔴' : '🟡'
  return (
    <section className={`verdict ${v.tone}`} aria-live="polite">
      <div className="verdict-title">
        <span aria-hidden="true">{icon}</span> {names[1]}: {v.title}
      </div>
      {v.reasons.length > 0 && (
        <div className="verdict-why">{v.reasons.join(' ')}</div>
      )}
    </section>
  )
}

type Fig = {
  key: Key
  a: number
  b: number
  unit: string
  d?: number
  better?: 'up' | 'down'
}

function Figures({
  stats,
  names,
  loading,
  t,
}: {
  stats: [PeriodStats, PeriodStats] | null
  names: [string, string]
  loading: boolean
  t: T
}) {
  const [more, setMore] = useState(false)
  if (!stats && loading)
    return (
      <div className="figures" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="figure skeleton" />
        ))}
      </div>
    )
  if (!stats) return null
  const [a, b] = stats
  const main: Fig[] = [
    {
      key: 'fig.cover',
      a: a.meanCover,
      b: b.meanCover,
      unit: '%',
      better: 'up',
    },
    {
      key: 'fig.rain',
      a: a.totalRain,
      b: b.totalRain,
      unit: 'mm',
      better: 'up',
    },
    {
      key: 'fig.dry',
      a: a.longestDrySpell,
      b: b.longestDrySpell,
      unit: t('unit.days'),
      better: 'down',
    },
    { key: 'fig.hot', a: a.hotDays, b: b.hotDays, unit: '', better: 'down' },
  ]
  const extra: Fig[] = [
    { key: 'fig.high', a: a.meanTmax, b: b.meanTmax, unit: '°C', d: 1 },
    {
      key: 'fig.peak',
      a: coverFromNdvi(a.peakNdvi),
      b: coverFromNdvi(b.peakNdvi),
      unit: '%',
      better: 'up',
    },
    {
      key: 'fig.rainDays',
      a: a.rainDays,
      b: b.rainDays,
      unit: '',
      better: 'up',
    },
    {
      key: 'fig.frost',
      a: a.frostDays,
      b: b.frostDays,
      unit: '',
      better: 'down',
    },
    {
      key: 'fig.balance',
      a: a.waterBalance,
      b: b.waterBalance,
      unit: 'mm',
      better: 'up',
    },
    {
      key: 'fig.ndvi',
      a: a.meanNdvi,
      b: b.meanNdvi,
      unit: '',
      d: 2,
      better: 'up',
    },
  ]
  const lines = describe(a, b, names[0], names[1], t)
  return (
    <section className="overview">
      <div className="figures">
        {main.map((f) => (
          <Figure key={f.key} f={f} names={names} t={t} />
        ))}
      </div>
      <button
        type="button"
        className="link more no-print"
        aria-expanded={more}
        onClick={() => setMore((m) => !m)}
      >
        {more ? `▲ ${t('fig.less')}` : `▼ ${t('fig.more')}`}
      </button>
      {more && (
        <>
          <div className="figures small">
            {extra.map((f) => (
              <Figure key={f.key} f={f} names={names} t={t} />
            ))}
          </div>
          {lines.length > 0 && (
            <ul className="summary">
              {lines.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </>
      )}
      {loading && <p className="hint">{t('fig.stillLoading')}</p>}
    </section>
  )
}

function Figure({ f, names, t }: { f: Fig; names: [string, string]; t: T }) {
  const digits = f.d ?? 0
  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(digits) : '—')
  const diff = f.b - f.a
  const known = Number.isFinite(diff)
  const small =
    known && Math.abs(diff) < (digits ? 0.5 * 10 ** -digits * 10 : 0.5)
  const good =
    !known || small || !f.better ? null : diff > 0 === (f.better === 'up')
  const arrow = !known || small ? '' : diff > 0 ? '↑' : '↓'
  const words = !known
    ? ''
    : small
      ? t('fig.same_as', { a: names[0] })
      : `${Math.abs(diff).toFixed(digits)} ${t(diff > 0 ? 'fig.more_than' : 'fig.less_than', { a: names[0] })}`
  return (
    <div
      className={`figure ${good === true ? 'good' : good === false ? 'bad' : ''}`}
    >
      <div className="figure-label">{t(f.key)}</div>
      <div className="figure-main">
        <span className="figure-value">
          {fmt(f.b)}
          <small> {f.unit}</small>
        </span>
        <span className="figure-period">{names[1]}</span>
      </div>
      <div className="figure-change">
        {arrow && <b aria-hidden="true">{arrow} </b>}
        {words}
      </div>
      <div className="figure-prev">
        {names[0]}: {fmt(f.a)} {f.unit}
      </div>
    </div>
  )
}

const roundStats = (s: PeriodStats) =>
  Object.fromEntries(
    Object.entries(s).map(([k, v]) => [
      k,
      Number.isFinite(v) ? Math.round(v * 100) / 100 : null,
    ])
  )

function Explain({ run, t }: { run: () => Promise<string>; t: T }) {
  const [state, setState] = useState<{
    kind: 'idle' | 'busy' | 'done' | 'error'
    text?: string
  }>({ kind: 'idle' })
  const go = async () => {
    setState({ kind: 'busy' })
    try {
      setState({ kind: 'done', text: await run() })
    } catch {
      setState({ kind: 'error', text: t('explain.error') })
    }
  }
  return (
    <section className="explain" aria-live="polite">
      {state.kind === 'done' ? (
        <>
          <p className="explain-text">{state.text}</p>
          <p className="explain-foot">{t('explain.foot')}</p>
        </>
      ) : (
        <button
          type="button"
          className="explain-btn no-print"
          onClick={go}
          disabled={state.kind === 'busy'}
        >
          {state.kind === 'busy' ? t('explain.busy') : t('explain.button')}
        </button>
      )}
      {state.kind === 'error' && (
        <p className="notice small error">{state.text}</p>
      )}
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
  const { t, lang } = useI18n()
  const [table, setTable] = useState(false)
  const xMax = Math.max(periodDays(periods[0]), periodDays(periods[1])) - 1
  const color = (i: number) => `var(--series-${i + 1})`
  const xLabel = (x: number) =>
    new Date(
      Date.parse(periods[1].start + 'T00:00:00Z') + x * 86_400_000
    ).toLocaleDateString(locale(lang), {
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
      {data.ndvi.loading && <div className="chart skeleton tall" />}
      {cover.length > 0 && (
        <LineChart
          title={t('chart.cover')}
          series={cover}
          xMax={xMax}
          xLabel={xLabel}
          format={(v) => `${v.toFixed(0)}%`}
          yMaxFloor={50}
          markers
          events={events}
          eventLabel={t('chart.note')}
        />
      )}
      {data.weather.loading && <div className="chart skeleton tall" />}
      {rain.length > 0 && (
        <LineChart
          title={t('chart.rain')}
          series={rain}
          xMax={xMax}
          xLabel={xLabel}
          format={(v) => v.toFixed(0)}
          yMaxFloor={50}
          events={events}
          eventLabel={t('chart.note')}
        />
      )}
      {data.ndvi.data && (
        <>
          <button
            type="button"
            className="link no-print"
            onClick={() => setTable((s) => !s)}
          >
            {table ? t('chart.hideTable') : t('chart.table')}
          </button>
          {table && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('chart.period')}</th>
                    <th>{t('chart.date')}</th>
                    <th>NDVI</th>
                    <th>{t('fig.cover')}</th>
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
  const { t } = useI18n()
  const [day, setDay] = useState(LATEST)
  const [note, setNote] = useState('')
  const inPeriod = (d: string) =>
    periods.some((p) => d >= p.start && d <= p.end)
  return (
    <section className="diary">
      <p className="hint">{t('diary.hint')}</p>
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
          aria-label={t('diary.date')}
          required
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('diary.placeholder')}
          maxLength={500}
          aria-label={t('diary.note')}
          required
        />
        <button type="submit" className="primary">
          {t('diary.add')}
        </button>
      </form>
      {!diary.length ? (
        <p className="muted">{t('diary.none')}</p>
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
                aria-label={`${t('diary.delete')} ${e.day}`}
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
