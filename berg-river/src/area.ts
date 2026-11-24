/**
 * The Berg River area: the official G10 tertiary catchment and the DWS river
 * line, from the Western Cape Department of Agriculture's server (the layers
 * Cape Farm Mapper shows under Water Resources). Loaded in the browser and
 * kept on the device for months; if they can't be loaded the app carries on
 * without the area check.
 */
import { contains, fromEsriRings, type MultiPolygon, type Ring } from './geo'
import { fetchJson } from './net'

const WATER =
  'https://gis.westerncape.gov.za/server3/rest/services/DOA-Natural_Resources/Water/MapServer'
const KEEP = 90 * 86_400_000 // boundaries hardly ever change

type EsriResp = {
  error?: { message?: string }
  features?: { geometry?: { rings?: Ring[]; paths?: [number, number][][] } }[]
}

function query(layer: number, params: Record<string, string>) {
  const q = new URLSearchParams({
    outSR: '4326',
    returnGeometry: 'true',
    geometryPrecision: '5',
    f: 'json',
    ...params,
  })
  return fetchJson<EsriResp>(`${WATER}/${layer}/query?${q}`, {
    ttlMs: KEEP,
    retries: 1,
    label: 'the catchment map',
  })
}

/** The Berg River catchment (G10) as one simplified outline. */
export async function fetchBergCatchment(): Promise<MultiPolygon> {
  const r = await query(4, {
    where: "Tertiary = 'G10'",
    outFields: 'Tertiary',
    maxAllowableOffset: '0.002',
  })
  if (r.error) throw new Error(r.error.message)
  const rings = (r.features ?? []).flatMap((f) => f.geometry?.rings ?? [])
  if (!rings.length) throw new Error('catchment not found')
  return fromEsriRings(rings)
}

/** The Berg River itself (main stem), as lines, within the catchment's extent. */
export async function fetchBergRiver(): Promise<[number, number][][]> {
  const r = await query(7, {
    where: "UPPER(NAME) IN ('BERG', 'BERG RIVER', 'BERGRIVIER')",
    geometry: JSON.stringify({
      xmin: 17.9,
      ymin: -34.1,
      xmax: 19.3,
      ymax: -32.6,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'NAME',
    maxAllowableOffset: '0.0005',
  })
  if (r.error) throw new Error(r.error.message)
  return (r.features ?? []).flatMap((f) => f.geometry?.paths ?? [])
}

/** true / false, or null when the area isn't known (couldn't load). */
export function inBergArea(
  area: MultiPolygon | null,
  lat: number,
  lon: number
): boolean | null {
  return area ? contains(area, lon, lat) : null
}

/** Towns in and next to the Berg River valley, for "find my farm". */
export const TOWNS: { name: string; lat: number; lon: number }[] = [
  { name: 'Franschhoek', lat: -33.913, lon: 19.121 },
  { name: 'Paarl', lat: -33.734, lon: 18.962 },
  { name: 'Wellington', lat: -33.64, lon: 19.011 },
  { name: 'Hermon', lat: -33.437, lon: 18.958 },
  { name: 'Gouda', lat: -33.296, lon: 19.04 },
  { name: 'Riebeek Kasteel', lat: -33.383, lon: 18.896 },
  { name: 'Riebeek West', lat: -33.348, lon: 18.871 },
  { name: 'Saron', lat: -33.18, lon: 19.01 },
  { name: 'Porterville', lat: -33.013, lon: 18.993 },
  { name: 'Moorreesburg', lat: -33.152, lon: 18.66 },
  { name: 'Piketberg', lat: -32.904, lon: 18.757 },
  { name: 'Hopefield', lat: -33.064, lon: 18.351 },
  { name: 'Velddrif', lat: -32.777, lon: 18.163 },
]
