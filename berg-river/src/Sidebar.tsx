import { useState } from 'react'
import FarmMap from './FarmMap'
import { CFM_SG_SERVICE } from './boundaries'
import type { Farm } from './farms'
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
  onLayerInput: (v: string) => void
  onSelect: (id: string) => void
  onMapClick: (lat: number, lon: number) => void
  onRemove: (f: Farm) => void
  onImport: (file: File | undefined) => void
}

export default function Sidebar(p: Props) {
  const [filter, setFilter] = useState('')
  const shown = filter
    ? p.farms.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()))
    : p.farms

  return (
    <aside className="side" id="farms">
      <FarmMap
        farms={p.farms}
        selectedId={p.selected?.id ?? ''}
        onSelect={p.onSelect}
        onAdd={p.onMapClick}
      />
      <p className="hint">
        {p.picking
          ? 'Looking up the farm boundary…'
          : p.layerUrl
            ? 'Tap inside a farm on the map to add it with its boundary.'
            : 'Tap the map to add a farm as a point.'}
      </p>
      {p.notice && (
        <p
          className={`notice small ${p.notice.error ? 'error' : 'ok'}`}
          role={p.notice.error ? 'alert' : 'status'}
        >
          {p.notice.text}
        </p>
      )}

      <div className="farm-list-head">
        <h2>
          Your farms {p.farms.length > 0 && <small>{p.farms.length}</small>}
        </h2>
        {p.farms.length > 6 && (
          <input
            type="search"
            placeholder="Find a farm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Find a farm"
          />
        )}
      </div>
      {p.loading && <p className="hint">Loading your farms…</p>}
      {!p.farms.length && !p.loading && (
        <p className="hint empty-list">No farms yet.</p>
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
                <small>{f.boundary ? fmtHa(f.areaHa) : 'point'}</small>
              </button>
              <button
                type="button"
                className="remove"
                onClick={() =>
                  window.confirm(
                    `Remove ${f.name}? Its diary notes are removed too.`
                  ) && p.onRemove(f)
                }
                aria-label={`Remove ${f.name}`}
                title="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <details className="boundaries">
        <summary>Add farms another way</summary>
        <label className="file">
          Import boundaries from a file (KML or GeoJSON)
          <input
            type="file"
            accept=".kml,.geojson,.json"
            onChange={(e) => {
              p.onImport(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        <label className="stack">
          Boundary service (ArcGIS)
          <input
            type="url"
            placeholder={CFM_SG_SERVICE}
            value={p.layerInput}
            onChange={(e) => p.onLayerInput(e.target.value)}
            disabled={p.picking}
          />
        </label>
        {p.layerInput && !p.layerUrl && (
          <p className="notice small error">
            That doesn't look like an ArcGIS address. It should end in
            /MapServer or /FeatureServer, optionally followed by a layer number.
          </p>
        )}
        <p className="hint">
          {p.layerUrl === CFM_SG_SERVICE
            ? "Using Cape Farm Mapper's Surveyor-General farm portions."
            : p.layerUrl
              ? 'Using a custom layer. '
              : ''}
          {p.layerUrl !== CFM_SG_SERVICE && (
            <button
              type="button"
              className="link"
              onClick={() => p.onLayerInput(CFM_SG_SERVICE)}
            >
              Use Cape Farm Mapper
            </button>
          )}
        </p>
      </details>
    </aside>
  )
}
