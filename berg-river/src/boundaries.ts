import { fromEsriRings, fromGeoJsonGeometry, type MultiPolygon, type Ring } from './geo'

export type BoundaryFeature = { name: string; boundary: MultiPolygon; attributes: Record<string, unknown> }

const NAME_HINTS = [/farm.?name/i, /^name$/i, /farm/i, /portion/i, /parcel/i, /sg.?(key|code|21)/i, /label/i, /name/i, /^id$/i]

/** Pick a readable farm name from layer attributes (e.g. "STELLENBOSCH 123/4"). */
export function nameFrom(attrs: Record<string, unknown>, fallback: string): string {
  const keys = Object.keys(attrs)
  const farmName = keys.find((k) => /farm.?name|^farm$/i.test(k))
  const farmNo = keys.find((k) => /farm.?(no|num)/i.test(k))
  const portion = keys.find((k) => /portion|parcel.?no/i.test(k))
  if (farmName && attrs[farmName]) {
    let s = String(attrs[farmName]).trim()
    if (farmNo && attrs[farmNo] != null) s += ` ${attrs[farmNo]}`
    if (portion && attrs[portion] != null && String(attrs[portion]) !== '0') s += `/${attrs[portion]}`
    return s
  }
  for (const re of NAME_HINTS) {
    const k = keys.find((x) => re.test(x) && attrs[x] != null && String(attrs[x]).trim())
    if (k) return String(attrs[k]).trim()
  }
  return fallback
}

/** Clean a pasted ArcGIS layer URL down to ".../MapServer/<id>" or ".../FeatureServer/<id>". */
export function normaliseLayerUrl(raw: string): string | null {
  const s = raw.trim()
  const m = s.match(/^(https?:\/\/[^?#]+?\/(?:MapServer|FeatureServer)\/\d+)/i)
  return m ? m[1] : null
}

/** Find the boundary polygon(s) in an ArcGIS layer that contain a point. */
export async function queryArcgisAt(layerUrl: string, lat: number, lon: number): Promise<BoundaryFeature[]> {
  const base = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
  })
  const fallback = `Farm ${lat.toFixed(3)}, ${lon.toFixed(3)}`
  let res: Response
  try {
    // Esri JSON is supported by every ArcGIS Server version; GeoJSON only by newer ones.
    res = await fetch(`${layerUrl}/query?${base}&f=json`)
  } catch {
    throw new Error(
      'the browser could not reach the Cape Farm Mapper layer (the server may not allow requests from other websites). Try importing a KML or GeoJSON file instead.',
    )
  }
  if (!res.ok) throw new Error(`the layer answered ${res.status}`)
  type EsriResp = {
    error?: { message?: string }
    features?: { attributes?: Record<string, unknown>; geometry?: { rings?: Ring[] } }[]
  }
  const body = (await res.json()) as EsriResp
  if (body.error) throw new Error(body.error.message || 'the layer returned an error')
  return (body.features ?? [])
    .filter((f) => f.geometry?.rings?.length)
    .map((f) => {
      const attributes = f.attributes ?? {}
      return { name: nameFrom(attributes, fallback), boundary: fromEsriRings(f.geometry!.rings!), attributes }
    })
}

/** Read farm boundaries from a GeoJSON or KML file (e.g. exported from Cape Farm Mapper or Google Earth). */
export async function readBoundaryFile(file: File): Promise<BoundaryFeature[]> {
  const text = await file.text()
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.kml')) return parseKml(text)
  if (lower.endsWith('.kmz')) throw new Error('KMZ is zipped: unzip it and import the .kml inside.')
  return parseGeoJson(text, file.name)
}

function parseGeoJson(text: string, fileName: string): BoundaryFeature[] {
  type F = { type: string; properties?: Record<string, unknown>; geometry?: { type: string; coordinates: unknown } }
  const json = JSON.parse(text) as { type: string; features?: F[] } & F
  const feats: F[] = json.type === 'FeatureCollection' ? (json.features ?? []) : json.type === 'Feature' ? [json] : [{ type: 'Feature', geometry: json as never }]
  const out: BoundaryFeature[] = []
  feats.forEach((f, i) => {
    const b = fromGeoJsonGeometry(f.geometry)
    if (b) out.push({ name: nameFrom(f.properties ?? {}, `${fileName.replace(/\.\w+$/, '')} ${i + 1}`), boundary: b, attributes: f.properties ?? {} })
  })
  return out
}

function parseKml(text: string): BoundaryFeature[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) throw new Error('this KML file could not be read')
  const ring = (el: Element | null): Ring | null => {
    const raw = el?.querySelector('coordinates')?.textContent?.trim()
    if (!raw) return null
    const pts = raw.split(/\s+/).map((t) => t.split(',').map(Number)).filter((p) => p.length >= 2 && p.every(Number.isFinite))
    return pts.length >= 3 ? pts.map((p) => [p[0], p[1]] as [number, number]) : null
  }
  const out: BoundaryFeature[] = []
  doc.querySelectorAll('Placemark').forEach((pm, i) => {
    const polys: Ring[][] = []
    pm.querySelectorAll('Polygon').forEach((pg) => {
      const outer = ring(pg.querySelector('outerBoundaryIs'))
      if (!outer) return
      const holes = [...pg.querySelectorAll('innerBoundaryIs')].map(ring).filter((r): r is Ring => !!r)
      polys.push([outer, ...holes])
    })
    if (!polys.length) return
    const attrs: Record<string, unknown> = {}
    pm.querySelectorAll('ExtendedData Data, ExtendedData SimpleData').forEach((d) => {
      const k = d.getAttribute('name')
      if (k) attrs[k] = (d.querySelector('value')?.textContent ?? d.textContent ?? '').trim()
    })
    const name = pm.querySelector(':scope > name')?.textContent?.trim()
    out.push({ name: name || nameFrom(attrs, `Imported farm ${i + 1}`), boundary: polys, attributes: attrs })
  })
  return out
}
