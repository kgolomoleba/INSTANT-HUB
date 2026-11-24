import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RIVER_LINE, type Farm } from './farms'
import type { MultiPolygon } from './geo'

export type MapFocus = { lat: number; lon: number; zoom: number; key: number }

type Props = {
  farms: Farm[]
  selectedId: string
  onSelect: (id: string) => void
  onAdd: (lat: number, lon: number) => void
  /** Official river line and catchment, once loaded (else a rough sketch of the river is shown). */
  river: [number, number][][] | null
  area: MultiPolygon | null
  focus: MapFocus | null
  labels: { map: string; river: string; area: string }
}

const toLatLng = (ring: [number, number][]) =>
  ring.map(([x, y]) => [y, x] as [number, number])

export default function FarmMap({
  farms,
  selectedId,
  onSelect,
  onAdd,
  river,
  area,
  focus,
  labels,
}: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const farmLayer = useRef<L.LayerGroup | null>(null)
  const waterLayer = useRef<L.LayerGroup | null>(null)
  const addRef = useRef(onAdd)
  addRef.current = onAdd

  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, { scrollWheelZoom: false, tapTolerance: 20 })
    m.fitBounds(L.latLngBounds(RIVER_LINE).pad(0.05))
    const streets = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }
    )
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
      }
    )
    satellite.addTo(m)
    L.control
      .layers({ Satellite: satellite, Map: streets }, undefined, {
        position: 'topright',
      })
      .addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) =>
      addRef.current(e.latlng.lat, e.latlng.lng)
    )
    waterLayer.current = L.layerGroup().addTo(m)
    farmLayer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  // River and catchment outline.
  useEffect(() => {
    const g = waterLayer.current
    if (!g) return
    g.clearLayers()
    if (area)
      L.polygon(
        area.map((poly) => poly.map(toLatLng)),
        {
          color: '#f6d36b',
          weight: 2,
          opacity: 0.8,
          fill: false,
          dashArray: '4 6',
          interactive: false,
        }
      ).addTo(g)
    const lines = river?.length ? river.map(toLatLng) : [RIVER_LINE]
    L.polyline(lines, {
      color: '#5aa9ff',
      weight: river?.length ? 3 : 2,
      opacity: 0.9,
      dashArray: river?.length ? undefined : '6 6',
      interactive: false,
    }).addTo(g)
  }, [river, area, labels.river])

  // Farms.
  useEffect(() => {
    const g = farmLayer.current
    if (!g) return
    g.clearLayers()
    for (const f of farms) {
      const sel = f.id === selectedId
      const click = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e)
        onSelect(f.id)
      }
      if (f.boundary) {
        L.polygon(
          f.boundary.map((poly) => poly.map(toLatLng)),
          {
            color: sel ? '#eb6834' : '#8fe08f',
            weight: sel ? 3 : 2,
            fillOpacity: sel ? 0.25 : 0.12,
          }
        )
          .bindTooltip(f.name)
          .on('click', click)
          .addTo(g)
      } else {
        L.circleMarker([f.lat, f.lon], {
          radius: sel ? 11 : 8,
          color: '#ffffff',
          weight: 2,
          fillColor: sel ? '#eb6834' : '#008300',
          fillOpacity: 1,
        })
          .bindTooltip(f.name)
          .on('click', click)
          .addTo(g)
      }
    }
  }, [farms, selectedId, onSelect])

  // Zoom to the selected farm.
  const selected = farms.find((f) => f.id === selectedId)
  useEffect(() => {
    const m = map.current
    if (!m || !selected) return
    if (selected.boundary) {
      const pts = selected.boundary.flatMap((poly) => toLatLng(poly[0]))
      m.fitBounds(L.latLngBounds(pts).pad(0.4), { maxZoom: 15 })
    } else m.setView([selected.lat, selected.lon], Math.max(m.getZoom(), 13))
  }, [selected?.id, selected?.boundary, selected?.lat, selected?.lon])

  // "Use my location" / "Go to a town".
  useEffect(() => {
    if (focus)
      map.current?.flyTo([focus.lat, focus.lon], focus.zoom, { duration: 0.8 })
  }, [focus])

  return (
    <div className="map" ref={el} role="application" aria-label={labels.map} />
  )
}
