import {
  bbox,
  contains,
  fromEsriRings,
  interiorPoint,
  type MultiPolygon,
  type Ring,
} from './geo'

/**
 * Western Cape Department of Agriculture crop census layers, as Cape Farm
 * Mapper uses them (gis.elsenburg.com/apps/cfm/src/cfm-layers-resource.js).
 */
const BASE =
  'https://gis.westerncape.gov.za/server3/rest/services/DOA-Agric-Census'
export const CENSUS_LAYERS = [
  {
    year: 2023,
    season: 'Winter',
    url: `${BASE}/Census_2023_Crops/MapServer/0`,
  },
  {
    year: 2023,
    season: 'Summer',
    url: `${BASE}/Census_2023_Crops/MapServer/1`,
  },
  {
    year: 2017,
    season: 'Winter',
    url: `${BASE}/Census_2017_Crops/MapServer/0`,
  },
  {
    year: 2017,
    season: 'Summer',
    url: `${BASE}/Census_2017_Crops/MapServer/1`,
  },
  {
    year: 2013,
    season: 'Winter',
    url: `${BASE}/Census_2013_Crops/MapServer/1`,
  },
  {
    year: 2013,
    season: 'Summer',
    url: `${BASE}/Census_2013_Crops/MapServer/0`,
  },
] as const

export type CropField = {
  crop: string
  category: string
  areaHa: number
  irrigation: string
}
export type CropRow = {
  crop: string
  category: string
  areaHa: number
  fields: number
  irrigation: string
}
export type CensusResult = {
  year: number
  season: string
  rows: CropRow[]
  error?: string
}

/** Attribute lookup that ignores case (2023 uses doa_crops, older years CROPS). */
function attr(a: Record<string, unknown>, ...names: string[]): unknown {
  const keys = Object.keys(a)
  for (const n of names) {
    const k = keys.find((x) => x.toLowerCase() === n.toLowerCase())
    if (k && a[k] != null && String(a[k]).trim() !== '') return a[k]
  }
  return null
}

const clean = (v: unknown) => String(v ?? '').trim()

function irrigationLabel(v: unknown): string {
  const s = clean(v).toLowerCase()
  if (!s) return ''
  if (s.startsWith('irr')) return 'Irrigated'
  if (s.startsWith('dry')) return 'Dry land'
  return clean(v)
}

/**
 * Census fields that belong to the farm: a field counts when a point inside it
 * falls inside the farm boundary (or, for a farm without a boundary, when the
 * field contains the farm's point).
 */
export async function fieldsOnFarm(
  layerUrl: string,
  farm: { lat: number; lon: number; boundary?: MultiPolygon }
): Promise<CropField[]> {
  const [w, s, e, n] = farm.boundary
    ? bbox(farm.boundary)
    : [farm.lon - 0.002, farm.lat - 0.002, farm.lon + 0.002, farm.lat + 0.002]
  const q = new URLSearchParams({
    geometry: JSON.stringify({
      xmin: w,
      ymin: s,
      xmax: e,
      ymax: n,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    geometryPrecision: '6',
    maxAllowableOffset: '0.00005',
    f: 'json',
  })
  let res: Response
  try {
    res = await fetch(`${layerUrl}/query?${q}`)
  } catch {
    throw new Error('crop census server not reachable')
  }
  if (!res.ok) throw new Error(`crop census server answered ${res.status}`)
  type Resp = {
    error?: { message?: string }
    features?: {
      attributes?: Record<string, unknown>
      geometry?: { rings?: Ring[] }
    }[]
  }
  const body = (await res.json()) as Resp
  if (body.error)
    throw new Error(body.error.message || 'crop census query failed')

  const out: CropField[] = []
  for (const f of body.features ?? []) {
    const rings = f.geometry?.rings
    if (!rings?.length) continue
    const shape = fromEsriRings(rings)
    const inside = farm.boundary
      ? contains(farm.boundary, ...interiorPoint(shape))
      : contains(shape, farm.lon, farm.lat)
    if (!inside) continue
    const a = f.attributes ?? {}
    out.push({
      crop: clean(attr(a, 'doa_crops', 'crops')) || 'Unknown',
      category: clean(attr(a, 'doa_cr_sum', 'cr_sum')),
      areaHa: Number(attr(a, 'areaha')) || 0,
      irrigation: irrigationLabel(attr(a, 'dry_irr')),
    })
  }
  return out
}

/** Group fields by crop, largest area first. */
export function summarise(fields: CropField[]): CropRow[] {
  const by = new Map<string, CropRow>()
  for (const f of fields) {
    const key = `${f.crop}|${f.irrigation}`
    const r = by.get(key) ?? {
      crop: f.crop,
      category: f.category,
      areaHa: 0,
      fields: 0,
      irrigation: f.irrigation,
    }
    r.areaHa += f.areaHa
    r.fields++
    by.set(key, r)
  }
  return [...by.values()].sort((a, b) => b.areaHa - a.areaHa)
}

export async function cropCensus(farm: {
  lat: number
  lon: number
  boundary?: MultiPolygon
}): Promise<CensusResult[]> {
  return Promise.all(
    CENSUS_LAYERS.map(async (l) => {
      try {
        return {
          year: l.year,
          season: l.season,
          rows: summarise(await fieldsOnFarm(l.url, farm)),
        }
      } catch (e) {
        return {
          year: l.year,
          season: l.season,
          rows: [],
          error: e instanceof Error ? e.message : String(e),
        }
      }
    })
  )
}

/**
 * The farm's main growing season from the crop census (2023, else 2017):
 * vineyards and orchards show up in the summer layers, wheat and canola in
 * the winter ones. No crops recorded (e.g. grazing): the whole year.
 */
export function guessSeason(
  census: CensusResult[]
): 'winter' | 'summer' | 'year' {
  for (const year of [2023, 2017, 2013]) {
    const area = (season: string) =>
      census
        .filter((c) => c.year === year && c.season === season)
        .flatMap((c) => c.rows)
        .reduce((s, r) => s + r.areaHa, 0)
    const w = area('Winter')
    const s = area('Summer')
    if (w + s > 0) return s > w ? 'summer' : 'winter'
  }
  return 'year'
}
