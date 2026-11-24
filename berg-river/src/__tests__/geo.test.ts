import { describe, expect, it } from 'vitest'
import {
  areaHa,
  bbox,
  contains,
  fromEsriRings,
  interiorPoint,
  type MultiPolygon,
  type Ring,
} from '../geo'

// 0.01° square near Paarl, with a hole in the middle.
const outer: Ring = [
  [18.95, -33.7],
  [18.96, -33.7],
  [18.96, -33.71],
  [18.95, -33.71],
  [18.95, -33.7],
]
const hole: Ring = [
  [18.954, -33.704],
  [18.956, -33.704],
  [18.956, -33.706],
  [18.954, -33.706],
  [18.954, -33.704],
]

describe('contains', () => {
  const farm: MultiPolygon = [[outer, hole]]
  it('finds points inside, outside and in holes', () => {
    expect(contains(farm, 18.951, -33.701)).toBe(true)
    expect(contains(farm, 18.97, -33.701)).toBe(false)
    expect(contains(farm, 18.955, -33.705)).toBe(false) // in the hole
  })
})

describe('areaHa', () => {
  it('matches the size of a 0.01° square at this latitude (~103 ha)', () => {
    // 0.01° lat ≈ 1.112 km; 0.01° lon ≈ 1.112 km × cos(33.7°) ≈ 0.925 km
    expect(areaHa([[outer]])).toBeGreaterThan(100)
    expect(areaHa([[outer]])).toBeLessThan(106)
  })
  it('subtracts holes', () => {
    expect(areaHa([[outer, hole]])).toBeLessThan(areaHa([[outer]]))
  })
})

describe('interiorPoint', () => {
  it('returns a point inside an L-shaped farm (where the centroid is outside)', () => {
    const L: Ring = [
      [0, 0],
      [3, 0],
      [3, 1],
      [1, 1],
      [1, 3],
      [0, 3],
      [0, 0],
    ]
    const [x, y] = interiorPoint([[L]])
    expect(contains([[L]], x, y)).toBe(true)
  })
})

describe('fromEsriRings', () => {
  it('treats clockwise rings as farms and counter-clockwise rings inside them as holes', () => {
    // Esri: outer rings clockwise (in x/y with y up), holes counter-clockwise.
    const cwOuter: Ring = [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
      [0, 0],
    ]
    const ccwHole: Ring = [
      [2, 2],
      [4, 2],
      [4, 4],
      [2, 4],
      [2, 2],
    ]
    const cwSecond: Ring = [
      [20, 0],
      [20, 5],
      [25, 5],
      [25, 0],
      [20, 0],
    ]
    const mp = fromEsriRings([cwOuter, ccwHole, cwSecond])
    expect(mp).toHaveLength(2)
    expect(mp[0]).toHaveLength(2) // outer + hole
    expect(contains(mp, 3, 3)).toBe(false)
    expect(contains(mp, 1, 1)).toBe(true)
    expect(contains(mp, 22, 2)).toBe(true)
  })
})

describe('bbox', () => {
  it('spans all polygons', () => {
    expect(bbox([[outer]])).toEqual([18.95, -33.71, 18.96, -33.7])
  })
})
