import { describe, expect, it } from 'vitest'
import { modisDatesBetween, pixelMask } from '../api'
import { summarise } from '../crops'

describe('modisDatesBetween', () => {
  it('lists the 16-day composites (day 1, 17, 33, …) inside the range', () => {
    expect(modisDatesBetween('2025-01-01', '2025-02-10')).toEqual([
      'A2025001',
      'A2025017',
      'A2025033',
    ])
  })
  it('crosses years', () => {
    expect(modisDatesBetween('2024-12-15', '2025-01-20')).toEqual([
      'A2024353',
      'A2025001',
      'A2025017',
    ])
  })
})

describe('pixelMask', () => {
  // Build a 3×3 grid of 231.66 m MODIS sinusoidal pixels centred on a point.
  const R = 6371007.181
  const CS = 231.656358
  const lat = -33.44
  const lon = 18.95
  const y0 = ((lat * Math.PI) / 180) * R
  const x0 = ((lon * Math.PI) / 180) * R * Math.cos((lat * Math.PI) / 180)
  const grid = {
    xllcorner: x0 - 1.5 * CS,
    yllcorner: y0 - 1.5 * CS,
    cellsize: CS,
    nrows: 3,
    ncols: 3,
  }

  it('keeps only the pixels whose centres fall inside the farm', () => {
    // A small farm around the centre pixel only (~100 m each way).
    const d = 0.001
    const farm = [
      [
        [
          [lon - d, lat + d],
          [lon + d, lat + d],
          [lon + d, lat - d],
          [lon - d, lat - d],
          [lon - d, lat + d],
        ],
      ],
    ] as never
    const mask = pixelMask(grid, farm, lat, lon)!
    expect(mask.filter(Boolean)).toHaveLength(1)
    expect(mask[4]).toBe(true) // centre of a 3×3 grid
  })
  it('uses the nearest pixel when the farm is smaller than a pixel and misses every centre', () => {
    const d = 0.0002
    const farm = [
      [
        [
          [lon + 0.0005 - d, lat + d],
          [lon + 0.0005 + d, lat + d],
          [lon + 0.0005 + d, lat - d],
          [lon + 0.0005 - d, lat - d],
          [lon + 0.0005 - d, lat + d],
        ],
      ],
    ] as never
    const mask = pixelMask(grid, farm, lat, lon + 0.0005)!
    expect(mask.filter(Boolean)).toHaveLength(1)
  })
  it('returns null when the grid description is missing', () => {
    expect(pixelMask({}, [] as never, lat, lon)).toBeNull()
  })
})

describe('crop summary', () => {
  it('groups fields by crop and irrigation, largest first', () => {
    const rows = summarise([
      { crop: 'Wheat', category: 'Grains', areaHa: 40, irrigation: 'Dry land' },
      {
        crop: 'Canola',
        category: 'Oilseeds',
        areaHa: 60,
        irrigation: 'Dry land',
      },
      { crop: 'Wheat', category: 'Grains', areaHa: 30, irrigation: 'Dry land' },
      { crop: 'Wheat', category: 'Grains', areaHa: 5, irrigation: 'Irrigated' },
    ])
    expect(rows.map((r) => [r.crop, r.irrigation, r.areaHa, r.fields])).toEqual(
      [
        ['Wheat', 'Dry land', 70, 2],
        ['Canola', 'Dry land', 60, 1],
        ['Wheat', 'Irrigated', 5, 1],
      ]
    )
  })
})
