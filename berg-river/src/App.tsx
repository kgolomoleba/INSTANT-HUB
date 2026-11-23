import { useCallback, useEffect, useMemo, useState } from 'react'
import FarmMap from './FarmMap'
import LineChart, { type ChartSeries } from './LineChart'
import { fetchNdvi, fetchWeather, type DailyWeather, type NdviPoint } from './api'
import { SAMPLE_FARMS, loadLayerUrl, loadUserFarms, saveLayerUrl, saveUserFarms, type Farm } from './farms'
import { normaliseLayerUrl, queryArcgisAt, readBoundaryFile, type BoundaryFeature } from './boundaries'
import { areaHa, interiorPoint } from './geo'
import { computeStats, coverFromNdvi, dayIndex, describe, periodDays, type Period, type PeriodStats } from './stats'

type FarmResult = {
  weather: [DailyWeather, DailyWeather]
  ndvi: [NdviPoint[], NdviPoint[]]
  stats: [PeriodStats, PeriodStats]
}

const todayMinus = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
const LATEST = todayMinus(6) // the weather archive runs about 5 days behind

function defaultPeriods(): [Period, Period] {
  const y = new Date().getFullYear()
  // Swartland winter grain season (May–October). Use last complete season as B.
  const bYear = LATEST >= `${y}-10-31` ? y : y - 1
  return [
    { label: 'Period A', start: `${bYear - 1}-05-01`, end: `${bYear - 1}-10-31` },
    { label: 'Period B', start: `${bYear}-05-01`, end: `${bYear}-10-31` },
  ]
}

function periodError(p: Period): string | null {
  if (!p.start || !p.end) return 'Pick both dates.'
  if (p.end < p.start) return 'End is before start.'
  if (p.end > LATEST) return `Weather data is available up to ${LATEST}.`
  if (p.start < '2000-02-18') return 'Satellite data starts in February 2000.'
  if (periodDays(p) > 366) return 'Keep each period to one year or less.'
  return null
}

async function loadFarm(f: Farm, a: Period, b: Period, size: 0 | 1): Promise<FarmResult> {
  const area = f.boundary ? ({ kind: 'boundary', boundary: f.boundary } as const) : ({ kind: 'square', km: size } as const)
  const [wa, wb, na, nb] = await Promise.all([
    fetchWeather(f.lat, f.lon, a.start, a.end),
    fetchWeather(f.lat, f.lon, b.start, b.end),
    fetchNdvi(f.lat, f.lon, a.start, a.end, area),
    fetchNdvi(f.lat, f.lon, b.start, b.end, area),
  ])
  return { weather: [wa, wb], ndvi: [na, nb], stats: [computeStats(wa, na), computeStats(wb, nb)] }
}

function farmFromFeature(f: BoundaryFeature, source: Farm['source'], i = 0): Farm {
  const [lon, lat] = interiorPoint(f.boundary)
  return {
    id: `u${Date.now()}${i}`,
    name: f.name,
    lat,
    lon,
    sample: false,
    boundary: f.boundary,
    areaHa: areaHa(f.boundary),
    source,
  }
}

const fmtHa = (ha?: number) => (ha == null ? '' : ha >= 100 ? `${ha.toFixed(0)} ha` : `${ha.toFixed(1)} ha`)

const fmt = (n: number, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '—')
const signed = (n: number, d = 0) => (Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(d)}` : '—')

export default function App() {
  const [userFarms, setUserFarms] = useState<Farm[]>(loadUserFarms)
  const farms = useMemo(() => [...userFarms, ...SAMPLE_FARMS], [userFarms])
  const [selectedId, setSelectedId] = useState(farms[0].id)
  const selected = farms.find((f) => f.id === selectedId) ?? farms[0]
  const [periods, setPeriods] = useState<[Period, Period]>(defaultPeriods)
  const [size, setSize] = useState<0 | 1>(1)
  const [result, setResult] = useState<FarmResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [all, setAll] = useState<{ farm: Farm; stats?: [PeriodStats, PeriodStats]; error?: string }[] | null>(null)
  const [allBusy, setAllBusy] = useState(false)
  const [layerInput, setLayerInput] = useState(loadLayerUrl)
  const layerUrl = normaliseLayerUrl(layerInput)
  const [info, setInfo] = useState<{ text: string; error?: boolean } | null>(null)
  const [picking, setPicking] = useState(false)

  const [pa, pb] = periods
  const invalid = periodError(pa) ?? periodError(pb)

  useEffect(() => saveUserFarms(userFarms), [userFarms])
  useEffect(() => saveLayerUrl(layerInput), [layerInput])

  useEffect(() => {
    if (invalid) return
    let live = true
    setLoading(true)
    setError(null)
    loadFarm(selected, pa, pb, size)
      .then((r) => live && setResult(r))
      .catch((e: unknown) => {
        if (!live) return
        setResult(null)
        setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [selected, pa, pb, size, invalid])

  const addFarms = useCallback((added: Farm[]) => {
    if (!added.length) return
    setUserFarms((fs) => [...added, ...fs])
    setSelectedId(added[0].id)
  }, [])

  const addFarm = useCallback(
    async (lat: number, lon: number) => {
      if (layerUrl) {
        setPicking(true)
        setInfo({ text: 'Looking up the farm boundary in Cape Farm Mapper…' })
        try {
          const found = await queryArcgisAt(layerUrl, lat, lon)
          if (!found.length) {
            setInfo({ text: 'No farm boundary at that spot in the Cape Farm Mapper layer. Click inside a farm.', error: true })
            return
          }
          // Where boundaries overlap (farm and its portions), take the smallest: the portion clicked on.
          const f = found.map((x) => farmFromFeature(x, 'Cape Farm Mapper')).sort((a, b) => (a.areaHa ?? 0) - (b.areaHa ?? 0))[0]
          addFarms([f])
          setInfo({ text: `Added ${f.name} (${fmtHa(f.areaHa)}) from Cape Farm Mapper.` })
        } catch (e) {
          setInfo({ text: `Couldn't load the boundary: ${e instanceof Error ? e.message : String(e)}`, error: true })
        } finally {
          setPicking(false)
        }
        return
      }
      const name = window.prompt('Name this farm', `Farm ${lat.toFixed(3)}, ${lon.toFixed(3)}`)
      if (!name) return
      addFarms([{ id: `u${Date.now()}`, name: name.trim(), lat, lon, sample: false, source: 'map point' }])
    },
    [layerUrl, addFarms],
  )

  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const found = await readBoundaryFile(file)
      if (!found.length) {
        setInfo({ text: `No farm boundaries (polygons) found in ${file.name}.`, error: true })
        return
      }
      addFarms(found.map((f, i) => farmFromFeature(f, 'file', i)))
      setInfo({ text: `Imported ${found.length} farm boundar${found.length === 1 ? 'y' : 'ies'} from ${file.name}.` })
    } catch (e) {
      setInfo({ text: `Couldn't read ${file.name}: ${e instanceof Error ? e.message : String(e)}`, error: true })
    }
  }

  const removeFarm = (id: string) => {
    setUserFarms((fs) => fs.filter((f) => f.id !== id))
    if (id === selectedId) setSelectedId(SAMPLE_FARMS[0].id)
  }

  const setPeriod = (i: 0 | 1, patch: Partial<Period>) =>
    setPeriods((ps) => {
      const next: [Period, Period] = [ps[0], ps[1]]
      next[i] = { ...next[i], ...patch }
      return next
    })

  const shiftYear = (i: 0 | 1, by: number) => {
    const shift = (d: string) => `${Number(d.slice(0, 4)) + by}${d.slice(4)}`
    setPeriod(i, { start: shift(periods[i].start), end: shift(periods[i].end) })
  }

  const compareAll = async () => {
    setAllBusy(true)
    const rows: NonNullable<typeof all> = farms.map((farm) => ({ farm }))
    setAll([...rows])
    for (let i = 0; i < farms.length; i++) {
      try {
        rows[i] = { farm: farms[i], stats: (await loadFarm(farms[i], pa, pb, size)).stats }
      } catch (e) {
        rows[i] = { farm: farms[i], error: e instanceof Error ? e.message : String(e) }
      }
      setAll([...rows])
    }
    setAllBusy(false)
  }

  const xMax = Math.max(periodDays(pa), periodDays(pb)) - 1
  const coverSeries: ChartSeries[] = result
    ? [0, 1].map((i) => ({
        key: `p${i}`,
        label: `${periods[i].start.slice(0, 4) === periods[1 - i].start.slice(0, 4) ? periods[i].label : periods[i].start.slice(0, 4) + (periods[i].end.slice(0, 4) !== periods[i].start.slice(0, 4) ? '–' + periods[i].end.slice(2, 4) : '')}`,
        color: `var(--series-${i + 1})`,
        points: result.ndvi[i].map((p) => ({ x: dayIndex(periods[i].start, p.date), y: coverFromNdvi(p.ndvi), date: p.date })),
      }))
    : []
  const rainSeries: ChartSeries[] = result
    ? [0, 1].map((i) => {
        let acc = 0
        return {
          key: `p${i}`,
          label: coverSeries[i].label,
          color: `var(--series-${i + 1})`,
          points: result.weather[i].dates.map((d, j) => {
            acc += Number.isFinite(result.weather[i].rain[j]) ? result.weather[i].rain[j] : 0
            return { x: j, y: acc, date: d }
          }),
        }
      })
    : []

  const [sa, sb] = result?.stats ?? []
  const la = coverSeries[0]?.label ?? 'Period A'
  const lb = coverSeries[1]?.label ?? 'Period B'

  const tiles: { label: string; a: string; b: string; delta: string; unit: string }[] =
    sa && sb
      ? [
          { label: 'Green cover (avg)', a: fmt(sa.meanCover), b: fmt(sb.meanCover), delta: signed(sb.meanCover - sa.meanCover), unit: '%' },
          { label: 'NDVI (avg)', a: fmt(sa.meanNdvi, 2), b: fmt(sb.meanNdvi, 2), delta: signed(sb.meanNdvi - sa.meanNdvi, 2), unit: '' },
          { label: 'Rainfall', a: fmt(sa.totalRain), b: fmt(sb.totalRain), delta: signed(sb.totalRain - sa.totalRain), unit: 'mm' },
          { label: 'Rain days (≥1 mm)', a: fmt(sa.rainDays), b: fmt(sb.rainDays), delta: signed(sb.rainDays - sa.rainDays), unit: '' },
          { label: 'Longest dry spell', a: fmt(sa.longestDrySpell), b: fmt(sb.longestDrySpell), delta: signed(sb.longestDrySpell - sa.longestDrySpell), unit: 'days' },
          { label: 'Avg daily high', a: fmt(sa.meanTmax, 1), b: fmt(sb.meanTmax, 1), delta: signed(sb.meanTmax - sa.meanTmax, 1), unit: '°C' },
          { label: 'Days ≥ 35 °C', a: fmt(sa.hotDays), b: fmt(sb.hotDays), delta: signed(sb.hotDays - sa.hotDays), unit: '' },
          { label: 'Frost days (≤ 0 °C)', a: fmt(sa.frostDays), b: fmt(sb.frostDays), delta: signed(sb.frostDays - sa.frostDays), unit: '' },
          { label: 'Rain minus evaporation', a: fmt(sa.waterBalance), b: fmt(sb.waterBalance), delta: signed(sb.waterBalance - sa.waterBalance), unit: 'mm' },
        ]
      : []

  return (
    <div className="app">
      <header className="top">
        <h1>Berg River Farms</h1>
        <p>Vegetation cover on farms along the Berg River, compared with the weather, between two periods.</p>
      </header>

      <section className="controls" aria-label="Periods">
        {[0, 1].map((i) => (
          <fieldset key={i} className={`period p${i + 1}`}>
            <legend>
              <i /> {i === 0 ? 'Period A' : 'Period B'}
            </legend>
            <label>
              From <input type="date" value={periods[i].start} max={LATEST} onChange={(e) => setPeriod(i as 0 | 1, { start: e.target.value })} />
            </label>
            <label>
              To <input type="date" value={periods[i].end} max={LATEST} onChange={(e) => setPeriod(i as 0 | 1, { end: e.target.value })} />
            </label>
            <span className="year-shift">
              <button type="button" onClick={() => shiftYear(i as 0 | 1, -1)} aria-label="One year earlier">−1 yr</button>
              <button type="button" onClick={() => shiftYear(i as 0 | 1, 1)} aria-label="One year later">+1 yr</button>
            </span>
          </fieldset>
        ))}
        <label className="size">
          Area for farms without a boundary
          <select value={size} onChange={(e) => setSize(Number(e.target.value) as 0 | 1)}>
            <option value={1}>~2 × 2 km around point</option>
            <option value={0}>Single 250 m pixel</option>
          </select>
        </label>
      </section>
      {invalid && <p className="notice error">{invalid}</p>}

      <div className="layout">
        <aside className="side">
          <FarmMap farms={farms} selectedId={selected.id} onSelect={setSelectedId} onAdd={addFarm} />
          <p className="hint">
            {layerUrl
              ? 'Click inside a farm on the map to load its boundary from Cape Farm Mapper.'
              : 'Click the map to add a farm as a point, or connect Cape Farm Mapper below to load real boundaries.'}{' '}
            Grey points are sample spots named after the nearest town.
          </p>
          {info && <p className={`notice small ${info.error ? 'error' : ''}`}>{info.text}</p>}
          <ul className="farm-list">
            {farms.map((f) => (
              <li key={f.id} className={f.id === selected.id ? 'active' : ''}>
                <button type="button" onClick={() => setSelectedId(f.id)}>
                  <span>{f.name}</span>
                  <small>{f.sample ? 'sample' : f.boundary ? fmtHa(f.areaHa) : 'point'}</small>
                </button>
                {!f.sample && (
                  <button type="button" className="remove" onClick={() => removeFarm(f.id)} aria-label={`Remove ${f.name}`}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          <details className="boundaries" open={!layerUrl}>
            <summary>Farm boundaries</summary>
            <label className="stack">
              Cape Farm Mapper layer address
              <input
                type="url"
                placeholder="https://…/MapServer/0"
                value={layerInput}
                onChange={(e) => setLayerInput(e.target.value)}
                disabled={picking}
              />
            </label>
            {layerInput && !layerUrl && (
              <p className="notice small error">That doesn't look like an ArcGIS layer address. It should end in /MapServer/ or /FeatureServer/ followed by a number.</p>
            )}
            {layerUrl && <p className="hint">Connected. Click inside a farm on the map.</p>}
            <details className="how">
              <summary>How to find this address</summary>
              <ol>
                <li>Open Cape Farm Mapper and switch on the farm portions layer (under Surveyor-General).</li>
                <li>Open your browser's developer tools (F12) and go to the Network tab.</li>
                <li>Click a farm on the Cape Farm Mapper map.</li>
                <li>
                  Find a request containing <code>MapServer</code> or <code>FeatureServer</code> followed by a number, and copy
                  it. Paste it here; anything after the layer number is removed automatically.
                </li>
              </ol>
            </details>
            <label className="file">
              Or import boundaries from a file (KML or GeoJSON)
              <input type="file" accept=".kml,.geojson,.json" onChange={(e) => { void importFile(e.target.files?.[0]); e.target.value = '' }} />
            </label>
          </details>
        </aside>

        <main className="main">
          <h2>
            {selected.name}{' '}
            <small>
              {selected.boundary
                ? `${fmtHa(selected.areaHa)} · boundary from ${selected.source === 'file' ? 'imported file' : 'Cape Farm Mapper'} · satellite pixels inside the boundary only`
                : `${selected.lat.toFixed(3)}, ${selected.lon.toFixed(3)} · ${size ? '~2 × 2 km square' : 'single 250 m pixel'} around the point`}
            </small>
          </h2>
          {loading && <p className="notice">Loading satellite and weather data…</p>}
          {error && (
            <p className="notice error">
              Couldn't load data: {error}. The satellite service (modis.ornl.gov) can be slow or briefly down; try again in a minute.
            </p>
          )}

          {result && sa && sb && (
            <>
              <ul className="summary">
                {describe(sa, sb, la, lb).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>

              <div className="tiles">
                {tiles.map((t) => (
                  <div key={t.label} className="tile">
                    <div className="tile-label">{t.label}</div>
                    <div className="tile-values">
                      <span><i className="dot d1" />{t.a}</span>
                      <span><i className="dot d2" />{t.b}</span>
                      <span className="unit">{t.unit}</span>
                    </div>
                    <div className="tile-delta">change {t.delta}</div>
                  </div>
                ))}
              </div>

              <LineChart
                title="Estimated green cover (%) by day of period"
                series={coverSeries}
                xMax={xMax}
                format={(v) => `${v.toFixed(0)}%`}
                yMaxFloor={50}
                markers
              />
              <LineChart
                title="Rainfall so far (mm) by day of period"
                series={rainSeries}
                xMax={xMax}
                format={(v) => `${v.toFixed(0)}`}
                yMaxFloor={50}
              />

              <button type="button" className="link" onClick={() => setShowTable((s) => !s)}>
                {showTable ? 'Hide' : 'Show'} satellite readings as a table
              </button>
              {showTable && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Period</th><th>Composite start</th><th>NDVI</th><th>Green cover</th></tr>
                    </thead>
                    <tbody>
                      {[0, 1].flatMap((i) =>
                        result.ndvi[i].map((p) => (
                          <tr key={`${i}${p.date}`}>
                            <td>{i ? lb : la}</td><td>{p.date}</td><td>{p.ndvi.toFixed(3)}</td><td>{coverFromNdvi(p.ndvi).toFixed(0)}%</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <section className="all">
            <div className="all-head">
              <h3>All farms</h3>
              <button type="button" onClick={compareAll} disabled={allBusy || !!invalid}>
                {allBusy ? 'Comparing…' : 'Compare all farms'}
              </button>
            </div>
            {all && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Farm</th>
                      <th>Cover A</th><th>Cover B</th><th>Change</th>
                      <th>Rain A (mm)</th><th>Rain B (mm)</th><th>Change</th>
                      <th>Dry spell A / B (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {all.map(({ farm, stats, error }) => (
                      <tr key={farm.id} onClick={() => setSelectedId(farm.id)} className="clickable">
                        <td>{farm.name}</td>
                        {stats ? (
                          <>
                            <td>{fmt(stats[0].meanCover)}%</td>
                            <td>{fmt(stats[1].meanCover)}%</td>
                            <td>{signed(stats[1].meanCover - stats[0].meanCover)}</td>
                            <td>{fmt(stats[0].totalRain)}</td>
                            <td>{fmt(stats[1].totalRain)}</td>
                            <td>{stats[0].totalRain > 0 ? `${signed(((stats[1].totalRain - stats[0].totalRain) / stats[0].totalRain) * 100)}%` : '—'}</td>
                            <td>{stats[0].longestDrySpell} / {stats[1].longestDrySpell}</td>
                          </>
                        ) : (
                          <td colSpan={7} className="muted">{error ? `Failed: ${error}` : 'Waiting…'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="sources">
            <p>
              <b>How it works.</b> Green cover is estimated from NASA MODIS NDVI (MOD13Q1, 250 m, one reading per 16 days) using
              ((NDVI − 0.15) / 0.70)², a common rough rule, so read it as a trend rather than an exact figure. Weather is daily
              ERA5 reanalysis from Open-Meteo (about 9 km grid). Both are free public sources; no data is stored on a server.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
