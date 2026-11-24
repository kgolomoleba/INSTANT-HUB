import { useState } from 'react'
import FarmMap, { type MapFocus } from './FarmMap'
import { TOWNS } from './area'
import { CFM_SG_SERVICE } from './boundaries'
import { useDialog } from './Dialog'
import type { Farm } from './farms'
import type { MultiPolygon } from './geo'
import { useI18n } from './i18n'
import type { Notice } from './useFarms'

export const fmtHa = (ha?: number) =>
  ha == null ? '' : ha >= 100 ? `${ha.toFixed(0)} ha` : `${ha.toFixed(1)} ha`

type Props = {
  farms: Farm[]
  selected: Farm | null
  loading: boolean
  notice: Notice
  picking: boolean
  layerInput: string
  layerUrl: string | null
  river: [number, number][][] | null
  area: MultiPolygon | null
  onLayerInput: (v: string) => void
  onSelect: (id: string) => void
  onMapClick: (lat: number, lon: number) => void
  onRemove: (f: Farm) => void
  onImport: (file: File | undefined) => void
}

export default function Sidebar(p: Props) {
  const { t } = useI18n()
  const dialog = useDialog()
  const [filter, setFilter] = useState('')
  const [focus, setFocus] = useState<MapFocus | null>(null)
  const [locating, setLocating] = useState(false)
  const [findMsg, setFindMsg] = useState<{
    text: string
    error?: boolean
  } | null>(null)
  const shown = filter
    ? p.farms.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()))
    : p.farms

  const goTo = (lat: number, lon: number, zoom: number) => {
    setFocus({ lat, lon, zoom, key: Date.now() })
    setFindMsg({ text: t('find.tapFarm') })
  }

  const myLocation = () => {
    if (!navigator.geolocation)
      return setFindMsg({ text: t('find.noLocation'), error: true })
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        goTo(pos.coords.latitude, pos.coords.longitude, 15)
      },
      () => {
        setLocating(false)
        setFindMsg({ text: t('find.noLocation'), error: true })
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
    )
  }

  const message = p.picking
    ? { text: t('find.lookingUp') }
    : (p.notice ?? findMsg)

  return (
    <aside className="side" id="farms">
      <div className="find">
        <h2>{t('find.title')}</h2>
        <div className="find-row">
          <button
            type="button"
            className="primary big"
            onClick={myLocation}
            disabled={locating}
          >
            {locating ? t('find.locating') : t('find.myLocation')}
          </button>
          <select
            className="big"
            aria-label={t('find.town')}
            value=""
            onChange={(e) => {
              const town = TOWNS.find((x) => x.name === e.target.value)
              if (town) goTo(town.lat, town.lon, 13)
            }}
          >
            <option value="">{t('find.townPick')}</option>
            {TOWNS.map((x) => (
              <option key={x.name} value={x.name}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FarmMap
        farms={p.farms}
        selectedId={p.selected?.id ?? ''}
        onSelect={p.onSelect}
        onAdd={p.onMapClick}
        river={p.river}
        area={p.area}
        focus={focus}
        labels={{
          map: t('map.label'),
          river: t('map.river'),
          area: t('map.area'),
        }}
      />
      {message && (
        <p
          className={`notice small ${message.error ? 'error' : 'ok'}`}
          role={message.error ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}

      <div className="farm-list-head">
        <h2>
          {t('farms.title')}{' '}
          {p.farms.length > 0 && <small>{p.farms.length}</small>}
        </h2>
        {p.farms.length > 6 && (
          <input
            type="search"
            placeholder={t('farms.find')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label={t('farms.find')}
          />
        )}
      </div>
      {p.loading && <p className="hint">{t('farms.loading')}</p>}
      {!p.farms.length && !p.loading && (
        <p className="hint empty-list">{t('farms.none')}</p>
      )}
      {shown.length > 0 && (
        <ul className="farm-list">
          {shown.map((f) => (
            <li key={f.id} className={f.id === p.selected?.id ? 'active' : ''}>
              <button
                type="button"
                onClick={() => p.onSelect(f.id)}
                aria-current={f.id === p.selected?.id}
              >
                <span>{f.name}</span>
                <small>{f.boundary ? fmtHa(f.areaHa) : t('farms.point')}</small>
              </button>
              <button
                type="button"
                className="remove"
                onClick={async () =>
                  (await dialog.confirm(
                    t('farms.removeConfirm', { name: f.name }),
                    t('farms.remove')
                  )) && p.onRemove(f)
                }
                aria-label={`${t('farms.remove')} ${f.name}`}
                title={t('farms.remove')}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <details className="boundaries">
        <summary>{t('farms.other')}</summary>
        <label className="file">
          {t('farms.import')}
          <input
            type="file"
            accept=".kml,.geojson,.json"
            onChange={(e) => {
              p.onImport(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        <details className="how">
          <summary>{t('farms.advanced')}</summary>
          <input
            type="url"
            placeholder={CFM_SG_SERVICE}
            value={p.layerInput}
            onChange={(e) => p.onLayerInput(e.target.value)}
            disabled={p.picking}
            aria-label={t('farms.advanced')}
          />
          {p.layerInput && !p.layerUrl && (
            <p className="notice small error">{t('farms.badService')}</p>
          )}
          <p className="hint">
            {p.layerUrl === CFM_SG_SERVICE ? (
              t('farms.cfm')
            ) : (
              <button
                type="button"
                className="link"
                onClick={() => p.onLayerInput(CFM_SG_SERVICE)}
              >
                {t('farms.useCfm')}
              </button>
            )}
          </p>
        </details>
      </details>
    </aside>
  )
}
