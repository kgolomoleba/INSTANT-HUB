/** Polygon helpers. Coordinates are [lon, lat] like GeoJSON. */
export type Ring = [number, number][]
export type MultiPolygon = Ring[][] // polygons → rings (first is outer, rest are holes)

export function ringContains(ring: Ring, lon: number, lat: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function contains(mp: MultiPolygon, lon: number, lat: number): boolean {
  return mp.some((poly) => ringContains(poly[0], lon, lat) && !poly.slice(1).some((h) => ringContains(h, lon, lat)))
}

export function bbox(mp: MultiPolygon): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity
  for (const poly of mp) for (const [x, y] of poly[0]) {
    w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y)
  }
  return [w, s, e, n]
}

const R = 6371008.8
/** Area in hectares (spherical approximation). */
export function areaHa(mp: MultiPolygon): number {
  const ringArea = (ring: Ring) => {
    let a = 0
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i]
      const [x2, y2] = ring[(i + 1) % ring.length]
      a += ((x2 - x1) * Math.PI) / 180 * (2 + Math.sin((y1 * Math.PI) / 180) + Math.sin((y2 * Math.PI) / 180))
    }
    return Math.abs((a * R * R) / 2)
  }
  let m2 = 0
  for (const poly of mp) m2 += ringArea(poly[0]) - poly.slice(1).reduce((s, h) => s + ringArea(h), 0)
  return m2 / 10000
}

/** A point inside the farm: the area-weighted centroid if it falls inside, else the first vertex-ish interior point. */
export function interiorPoint(mp: MultiPolygon): [number, number] {
  let sx = 0, sy = 0, sa = 0
  for (const poly of mp) {
    const r = poly[0]
    for (let i = 0; i < r.length; i++) {
      const [x1, y1] = r[i]
      const [x2, y2] = r[(i + 1) % r.length]
      const f = x1 * y2 - x2 * y1
      sx += (x1 + x2) * f; sy += (y1 + y2) * f; sa += f
    }
  }
  if (sa !== 0) {
    const c: [number, number] = [sx / (3 * sa), sy / (3 * sa)]
    if (contains(mp, c[0], c[1])) return c
  }
  const [w, s, e, n] = bbox(mp)
  for (let k = 1; k < 20; k++)
    for (let i = 1; i < k; i++) {
      const x = w + ((e - w) * i) / k
      const y = s + ((n - s) * (k - i)) / k
      if (contains(mp, x, y)) return [x, y]
    }
  return [(w + e) / 2, (s + n) / 2]
}

/** Convert GeoJSON Polygon / MultiPolygon geometry to MultiPolygon coords. */
export function fromGeoJsonGeometry(g: { type: string; coordinates: unknown } | null | undefined): MultiPolygon | null {
  if (!g) return null
  if (g.type === 'Polygon') return [g.coordinates as Ring[]]
  if (g.type === 'MultiPolygon') return g.coordinates as Ring[][]
  return null
}

/**
 * Convert Esri JSON rings (outer rings clockwise, holes counter-clockwise) to MultiPolygon.
 */
export function fromEsriRings(rings: Ring[]): MultiPolygon {
  const signed = (r: Ring) => {
    let a = 0
    for (let i = 0; i < r.length; i++) {
      const [x1, y1] = r[i]
      const [x2, y2] = r[(i + 1) % r.length]
      a += (x2 - x1) * (y2 + y1)
    }
    return a // > 0 means clockwise
  }
  const out: MultiPolygon = []
  for (const r of rings) {
    if (signed(r) > 0 || !out.length) out.push([r])
    else {
      const host = out.find((p) => ringContains(p[0], r[0][0], r[0][1]))
      if (host) host.push(r)
      else out.push([r])
    }
  }
  return out
}
