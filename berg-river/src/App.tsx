import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Account from './Account'
import AllFarms from './AllFarms'
import FarmView from './FarmView'
import PeriodControls from './PeriodControls'
import Sidebar, { fmtHa } from './Sidebar'
import {
  boundariesAt,
  normaliseLayerUrl,
  readBoundaryFile,
  type BoundaryFeature,
} from './boundaries'
import { loadLayerUrl, saveLayerUrl, type Farm } from './farms'
import { areaHa, interiorPoint } from './geo'
import {
  defaultPeriods,
  fromHash,
  periodError,
  periodName,
  toHash,
} from './periods'
import type { Period } from './stats'
import * as store from './store'
import { useFarmData } from './useFarmData'
import { useFarms, type Notice } from './useFarms'

function farmFromFeature(f: BoundaryFeature, source: Farm['source']): Farm {
  const [lon, lat] = interiorPoint(f.boundary)
  return {
    id: store.newId(),
    name: f.name,
    lat,
    lon,
    boundary: f.boundary,
    areaHa: areaHa(f.boundary),
    source,
  }
}
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export default function App() {
  const initial = useMemo(() => fromHash(window.location.hash), [])
  const [session, setSession] = useState<Session | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const notify = useCallback((n: Notice) => setNotice(n), [])
  const {
    farms,
    diary,
    loading: farmsLoading,
    addFarms,
    removeFarm,
    renameFarm,
    addDiary,
    removeDiary,
  } = useFarms(session, notify)

  const [selectedId, setSelectedId] = useState(initial.farmId ?? '')
  const selected: Farm | null =
    farms.find((f) => f.id === selectedId) ?? farms[0] ?? null
  const [periods, setPeriods] = useState<[Period, Period]>(
    initial.periods ?? defaultPeriods
  )
  const [size, setSize] = useState<0 | 1>(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [layerInput, setLayerInput] = useState(loadLayerUrl)
  const layerUrl = normaliseLayerUrl(layerInput)
  const [picking, setPicking] = useState(false)

  const invalid = periodError(periods[0]) ?? periodError(periods[1])
  const data = useFarmData(selected, periods, size, !invalid, reloadKey)
  const names: [string, string] = [
    periodName(periods[0], periods[1]),
    periodName(periods[1], periods[0]),
  ]
  const farmDiary = useMemo(
    () => diary.filter((e) => e.farmId === selected?.id),
    [diary, selected?.id]
  )

  useEffect(() => store.onSession(setSession), [])
  useEffect(() => saveLayerUrl(layerInput), [layerInput])
  // Keep the address bar in sync so the page can be shared or bookmarked.
  const hash = toHash(periods, selected?.id)
  useEffect(() => {
    if (window.location.hash !== hash) history.replaceState(null, '', hash)
  }, [hash])
  // Clear success messages after a while; keep errors until the next action.
  useEffect(() => {
    if (!notice || notice.error) return
    const t = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(t)
  }, [notice])

  const add = useCallback(
    (list: Farm[]) => {
      addFarms(list)
      if (list[0]) setSelectedId(list[0].id)
    },
    [addFarms]
  )

  const onMapClick = useCallback(
    async (lat: number, lon: number) => {
      if (!layerUrl) {
        const name = window.prompt(
          'Name this farm',
          `Farm ${lat.toFixed(3)}, ${lon.toFixed(3)}`
        )
        if (name?.trim())
          add([
            {
              id: store.newId(),
              name: name.trim(),
              lat,
              lon,
              source: 'map point',
            },
          ])
        return
      }
      setPicking(true)
      setNotice(null)
      try {
        const found = await boundariesAt(layerUrl, lat, lon)
        if (!found.length) {
          setNotice({
            text: 'No farm boundary there. Tap inside a farm.',
            error: true,
          })
          return
        }
        // Where a farm and its portions overlap, take the smallest: the portion tapped on.
        const f = found
          .map((x) => farmFromFeature(x, 'Cape Farm Mapper'))
          .sort((a, b) => (a.areaHa ?? 0) - (b.areaHa ?? 0))[0]
        add([f])
        setNotice({ text: `Added ${f.name} (${fmtHa(f.areaHa)}).` })
      } catch (e) {
        setNotice({
          text: `Couldn't load the boundary: ${msg(e)}`,
          error: true,
        })
      } finally {
        setPicking(false)
      }
    },
    [layerUrl, add]
  )

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const found = await readBoundaryFile(file)
      if (!found.length)
        return setNotice({
          text: `No farm boundaries (polygons) found in ${file.name}.`,
          error: true,
        })
      add(found.map((f) => farmFromFeature(f, 'file')))
      setNotice({
        text: `Imported ${found.length} farm${found.length === 1 ? '' : 's'} from ${file.name}.`,
      })
    } catch (e) {
      setNotice({ text: `Couldn't read ${file.name}: ${msg(e)}`, error: true })
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="top-row">
          <div>
            <h1>Berg River Farms</h1>
            <p className="tagline">
              Green cover on your farms, side by side with the weather.
            </p>
          </div>
          <Account session={session} />
        </div>
      </header>

      <PeriodControls periods={periods} onChange={setPeriods} error={invalid} />

      <div className={`layout ${selected ? 'has-farm' : ''}`}>
        <Sidebar
          farms={farms}
          selected={selected}
          loading={farmsLoading}
          notice={notice}
          picking={picking}
          layerInput={layerInput}
          layerUrl={layerUrl}
          onLayerInput={setLayerInput}
          onSelect={setSelectedId}
          onMapClick={onMapClick}
          onRemove={removeFarm}
          onImport={onImport}
        />

        <main className="main">
          {!selected ? (
            <div className="empty">
              <h2>Add your first farm</h2>
              <ol>
                <li>Zoom the map to your farm (the satellite view helps).</li>
                <li>
                  Tap inside it. Its boundary, name and size load from Cape Farm
                  Mapper.
                </li>
                <li>
                  Pick what to compare at the top, e.g. this winter season
                  against last year's.
                </li>
              </ol>
              <p className="hint">
                You can also import boundaries from a KML or GeoJSON file under{' '}
                <b>Add farms another way</b>.
                {store.supabase &&
                  !session &&
                  ' Sign in (top right) to keep your farms on every device.'}
              </p>
            </div>
          ) : (
            <>
              <div className="phone-switch no-print">
                <select
                  value={selected.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  aria-label="Choose a farm"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <a
                  href="#farms"
                  onClick={(e) => {
                    e.preventDefault()
                    document
                      .getElementById('farms')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Map &amp; add farms ↓
                </a>
              </div>
              <FarmView
                key={selected.id}
                farm={selected}
                periods={periods}
                size={size}
                onSize={setSize}
                data={data}
                onRetry={() => setReloadKey((k) => k + 1)}
                diary={farmDiary}
                onAddDiary={(day, note) => addDiary(selected.id, day, note)}
                onRemoveDiary={removeDiary}
                onRename={(name) => renameFarm(selected, name)}
                shareUrl={
                  window.location.origin + window.location.pathname + hash
                }
                explain={
                  session && store.supabase ? store.explainSeason : undefined
                }
              />
            </>
          )}

          {farms.length > 1 && (
            <AllFarms
              farms={farms}
              periods={periods}
              names={names}
              size={size}
              disabled={!!invalid}
              onSelect={setSelectedId}
            />
          )}

          <footer className="sources">
            <p>
              <b>How it works.</b> Green cover is estimated from NASA MODIS
              satellite readings (NDVI, 250 m, one every 16 days) with the
              common rule ((NDVI − 0.15) / 0.70)², so read it as a trend rather
              than an exact figure. Weather is daily ERA5 data from Open-Meteo
              (about 9 km grid). Crops come from the Western Cape Department of
              Agriculture crop census. Data you've viewed is kept on this device
              so it opens faster next time. Your farms and diary are kept in
              this browser, or in your account when you sign in.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
