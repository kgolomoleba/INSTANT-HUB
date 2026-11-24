import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Account from './Account'
import AllFarms from './AllFarms'
import { DialogProvider, useDialog } from './Dialog'
import FarmView from './FarmView'
import PeriodControls, { periodsError } from './PeriodControls'
import Sidebar, { fmtHa } from './Sidebar'
import { fetchBergCatchment, fetchBergRiver, inBergArea } from './area'
import {
  boundariesAt,
  normaliseLayerUrl,
  readBoundaryFile,
  type BoundaryFeature,
} from './boundaries'
import { cropCensus, guessSeason } from './crops'
import { loadLayerUrl, saveLayerUrl, type Farm, type Season } from './farms'
import { areaHa, interiorPoint, type MultiPolygon } from './geo'
import {
  I18n,
  LANG_KEY,
  initialLang,
  locale,
  makeT,
  useI18n,
  type Lang,
} from './i18n'
import {
  fromHash,
  periodName,
  presetSeason,
  presets,
  seasonPeriods,
  toHash,
  type PresetId,
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

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const i18n = useMemo(() => ({ lang, t: makeT(lang) }), [lang])
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = i18n.t('app.title')
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang, i18n])
  return (
    <I18n.Provider value={i18n}>
      <DialogProvider>
        <Main onLang={setLang} />
      </DialogProvider>
    </I18n.Provider>
  )
}

function Main({ onLang }: { onLang: (l: Lang) => void }) {
  const { t, lang } = useI18n()
  const dialog = useDialog()
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
    setSeason,
  } = useFarms(session, notify, t)

  const [selectedId, setSelectedId] = useState(initial.farmId ?? '')
  const selected: Farm | null =
    farms.find((f) => f.id === selectedId) ?? farms[0] ?? null
  const [periods, setPeriods] = useState<[Period, Period]>(
    initial.periods ?? seasonPeriods(undefined)
  )
  const [size, setSize] = useState<0 | 1>(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [layerInput, setLayerInput] = useState(loadLayerUrl)
  const layerUrl = normaliseLayerUrl(layerInput)
  const [picking, setPicking] = useState(false)
  const [area, setArea] = useState<MultiPolygon | null>(null)
  const [river, setRiver] = useState<[number, number][][] | null>(null)

  const invalid = periodsError(periods, t)
  const data = useFarmData(selected, periods, size, !invalid, reloadKey)
  const loc = locale(lang)
  const names: [string, string] = [
    periodName(periods[0], periods[1], loc),
    periodName(periods[1], periods[0], loc),
  ]
  const farmDiary = useMemo(
    () => diary.filter((e) => e.farmId === selected?.id),
    [diary, selected?.id]
  )

  useEffect(() => store.onSession(setSession), [])
  useEffect(() => saveLayerUrl(layerInput), [layerInput])
  // Official Berg River area and river line (kept on the device once loaded).
  useEffect(() => {
    fetchBergCatchment().then(setArea, () => {})
    fetchBergRiver().then(
      (r) => r.length && setRiver(r),
      () => {}
    )
  }, [])

  // Each farm opens on its own season's comparison (a shared link's dates win once).
  const [usedLinkDates, setUsedLinkDates] = useState(!initial.periods)
  useEffect(() => {
    if (!selected) return
    if (!usedLinkDates) return setUsedLinkDates(true)
    setPeriods(seasonPeriods(selected.season))
    // Only when switching farm or its season changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.season])

  const hash = toHash(periods, selected?.id)
  useEffect(() => {
    if (window.location.hash !== hash) history.replaceState(null, '', hash)
  }, [hash])
  useEffect(() => {
    if (!notice || notice.error) return
    const timer = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  /** Add farms, pick their season from the crop census in the background. */
  const add = useCallback(
    async (list: Farm[]) => {
      // Warn about farms outside the Berg River area (when the area is known).
      const kept: Farm[] = []
      for (const f of list) {
        if (
          inBergArea(area, f.lat, f.lon) === false &&
          !(await dialog.confirm(
            t('find.outside', { name: f.name }),
            t('find.addAnyway')
          ))
        )
          continue
        kept.push(f)
      }
      if (!kept.length) return false
      addFarms(kept)
      setSelectedId(kept[0].id)
      for (const f of kept)
        cropCensus(f)
          .then((c) => setSeason(f, guessSeason(c)))
          .catch(() => {})
      return true
    },
    [addFarms, area, dialog, setSeason, t]
  )

  const onMapClick = useCallback(
    async (lat: number, lon: number) => {
      if (picking) return
      if (!layerUrl) {
        const name = await dialog.prompt(
          t('find.namePoint'),
          t('find.pointDefault'),
          t('find.add')
        )
        if (name)
          await add([
            { id: store.newId(), name, lat, lon, source: 'map point' },
          ])
        return
      }
      setPicking(true)
      setNotice(null)
      try {
        const found = await boundariesAt(layerUrl, lat, lon)
        if (!found.length)
          return setNotice({ text: t('find.noBoundary'), error: true })
        const f = found
          .map((x) => farmFromFeature(x, 'Cape Farm Mapper'))
          .sort((a, b) => (a.areaHa ?? 0) - (b.areaHa ?? 0))[0]
        if (await add([f]))
          setNotice({
            text: t('find.added', { name: f.name, ha: fmtHa(f.areaHa) }),
          })
      } catch {
        setNotice({ text: t('find.boundaryError'), error: true })
      } finally {
        setPicking(false)
      }
    },
    [layerUrl, add, dialog, picking, t]
  )

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const found = await readBoundaryFile(file)
      if (!found.length)
        return setNotice({
          text: t('farms.importNone', { file: file.name }),
          error: true,
        })
      if (await add(found.map((f) => farmFromFeature(f, 'file'))))
        setNotice({
          text: t('farms.imported', { n: found.length, file: file.name }),
        })
    } catch {
      setNotice({
        text: t('farms.importError', { file: file.name }),
        error: true,
      })
    }
  }

  const onPreset = (id: PresetId) => {
    setPeriods(presets().find((p) => p.id === id)!.periods)
    // Picking a season for a farm remembers it as that farm's season.
    const season = presetSeason(id)
    if (selected && season) setSeason(selected, season)
  }

  return (
    <div className="app">
      <header className="top">
        <div className="top-row">
          <div>
            <h1>{t('app.title')}</h1>
            <p className="tagline">{t('app.tagline')}</p>
          </div>
          <div className="top-actions">
            <div className="lang" role="group" aria-label="Language / Taal">
              {(['en', 'af'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={lang === l ? 'on' : ''}
                  aria-pressed={lang === l}
                  onClick={() => onLang(l)}
                >
                  {l === 'en' ? 'English' : 'Afrikaans'}
                </button>
              ))}
            </div>
            <Account session={session} />
          </div>
        </div>
      </header>

      {selected && (
        <PeriodControls
          periods={periods}
          onPreset={onPreset}
          onCustom={setPeriods}
        />
      )}

      <div className={`layout ${selected ? 'has-farm' : ''}`}>
        <Sidebar
          farms={farms}
          selected={selected}
          loading={farmsLoading}
          notice={notice}
          picking={picking}
          layerInput={layerInput}
          layerUrl={layerUrl}
          river={river}
          area={area}
          onLayerInput={setLayerInput}
          onSelect={setSelectedId}
          onMapClick={onMapClick}
          onRemove={removeFarm}
          onImport={onImport}
        />

        <main className="main">
          {!selected ? (
            <div className="empty welcome">
              <h2>{t('welcome.title')}</h2>
              <ol>
                <li>{t('welcome.1')}</li>
                <li>{t('welcome.2')}</li>
                <li>{t('welcome.3')}</li>
              </ol>
              {store.supabase && !session && (
                <p className="hint">{t('welcome.signIn')}</p>
              )}
            </div>
          ) : (
            <>
              <div className="phone-switch no-print">
                <select
                  value={selected.id}
                  onChange={(e) => setSelectedId(e.target.value)}
                  aria-label={t('farms.switch')}
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
                  {t('farms.toMap')}
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
                onSeason={(s: Season) => setSeason(selected, s)}
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
            <p>{t('app.howItWorks')}</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
