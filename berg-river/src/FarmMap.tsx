import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { RIVER_LINE, type Farm } from './farms'

type Props = {
  farms: Farm[]
  selectedId: string
  onSelect: (id: string) => void
  onAdd: (lat: number, lon: number) => void
}

export default function FarmMap({ farms, selectedId, onSelect, onAdd }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const addRef = useRef(onAdd)
  addRef.current = onAdd

  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(
      [-33.25, 18.75],
      9
    )
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m)
    L.polyline(RIVER_LINE, {
      color: '#2a78d6',
      weight: 3,
      opacity: 0.6,
      dashArray: '6 6',
    })
      .bindTooltip('Berg River (approximate course)')
      .addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) =>
      addRef.current(e.latlng.lat, e.latlng.lng)
    )
    m.fitBounds(L.latLngBounds(RIVER_LINE).pad(0.05))
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const g = layer.current
    if (!g) return
    g.clearLayers()
    for (const f of farms) {
      const sel = f.id === selectedId
      if (f.boundary) {
        L.polygon(
          f.boundary.map((poly) =>
            poly.map((ring) => ring.map(([x, y]) => [y, x] as [number, number]))
          ),
          {
            color: sel ? '#eb6834' : '#008300',
            weight: sel ? 3 : 2,
            fillOpacity: sel ? 0.25 : 0.12,
          }
        )
          .bindTooltip(f.name)
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e)
            onSelect(f.id)
          })
          .addTo(g)
        continue
      }
      L.circleMarker([f.lat, f.lon], {
        radius: sel ? 10 : 7,
        color: '#ffffff',
        weight: 2,
        fillColor: sel ? '#eb6834' : '#008300',
        fillOpacity: 1,
      })
        .bindTooltip(f.name)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          onSelect(f.id)
        })
        .addTo(g)
    }
  }, [farms, selectedId, onSelect])

  // Zoom to the selected farm's boundary.
  const selected = farms.find((f) => f.id === selectedId)
  useEffect(() => {
    const m = map.current
    if (!m || !selected?.boundary) return
    const pts = selected.boundary.flatMap((poly) =>
      poly[0].map(([x, y]) => [y, x] as [number, number])
    )
    m.fitBounds(L.latLngBounds(pts).pad(0.4), { maxZoom: 15 })
  }, [selected?.id, selected?.boundary])

  return (
    <div
      className="map"
      ref={el}
      aria-label="Map of farms along the Berg River"
    />
  )
}
