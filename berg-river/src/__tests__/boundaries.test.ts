// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  CFM_SG_SERVICE,
  nameFrom,
  normaliseLayerUrl,
  readBoundaryFile,
} from '../boundaries'

describe('normaliseLayerUrl', () => {
  it('keeps a whole MapServer or a single layer, dropping query strings', () => {
    expect(normaliseLayerUrl(CFM_SG_SERVICE)).toBe(CFM_SG_SERVICE)
    expect(
      normaliseLayerUrl(`${CFM_SG_SERVICE}/identify?f=json&geometry=1,2`)
    ).toBe(CFM_SG_SERVICE)
    expect(normaliseLayerUrl(`${CFM_SG_SERVICE}/7/query?where=1%3D1`)).toBe(
      `${CFM_SG_SERVICE}/7`
    )
    expect(
      normaliseLayerUrl('https://x.org/arcgis/rest/services/A/FeatureServer/0')
    ).toBe('https://x.org/arcgis/rest/services/A/FeatureServer/0')
  })
  it('rejects things that are not ArcGIS services', () => {
    expect(normaliseLayerUrl('')).toBeNull()
    expect(normaliseLayerUrl('https://example.com/map')).toBeNull()
    expect(normaliseLayerUrl('javascript:alert(1)//MapServer/1')).toBeNull()
  })
})

describe('nameFrom', () => {
  it('builds "FARM NAME number/portion" from Surveyor-General fields', () => {
    expect(
      nameFrom({ FARM_NAME: 'KLEINFONTEIN', FARM_NO: 123, PORTION: 4 }, 'x')
    ).toBe('KLEINFONTEIN 123/4')
    expect(
      nameFrom({ FARM_NAME: 'KLEINFONTEIN', FARM_NO: 123, PORTION: 0 }, 'x')
    ).toBe('KLEINFONTEIN 123')
  })
  it('falls back sensibly', () => {
    expect(nameFrom({ Name: 'Block A' }, 'x')).toBe('Block A')
    expect(nameFrom({}, 'Farm 1')).toBe('Farm 1')
  })
})

// jsdom's File has no .text(); this is the part of File the app uses.
const file = (name: string, text: string) =>
  ({ name, text: async () => text }) as unknown as File

describe('readBoundaryFile', () => {
  it('reads polygons (with holes) from KML', async () => {
    const kml = `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>
      <Placemark><name>Block 1</name><Polygon>
        <outerBoundaryIs><LinearRing><coordinates>18.95,-33.70,0 18.96,-33.70,0 18.96,-33.71,0 18.95,-33.71,0 18.95,-33.70,0</coordinates></LinearRing></outerBoundaryIs>
        <innerBoundaryIs><LinearRing><coordinates>18.954,-33.704 18.956,-33.704 18.956,-33.706 18.954,-33.704</coordinates></LinearRing></innerBoundaryIs>
      </Polygon></Placemark>
      <Placemark><name>A point, skipped</name><Point><coordinates>18.9,-33.6</coordinates></Point></Placemark>
    </Document></kml>`
    const got = await readBoundaryFile(file('farms.kml', kml))
    expect(got).toHaveLength(1)
    expect(got[0].name).toBe('Block 1')
    expect(got[0].boundary[0]).toHaveLength(2)
    expect(got[0].boundary[0][0][1]).toEqual([18.96, -33.7])
  })
  it('reads Polygon and MultiPolygon features from GeoJSON', async () => {
    const gj = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'North' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 0],
                ],
              ],
              [
                [
                  [2, 2],
                  [3, 2],
                  [3, 3],
                  [2, 2],
                ],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [0, 0] },
        },
      ],
    }
    const got = await readBoundaryFile(
      file('farms.geojson', JSON.stringify(gj))
    )
    expect(got.map((f) => f.name)).toEqual(['North', 'farms 2'])
    expect(got[1].boundary).toHaveLength(2)
  })
  it('explains that KMZ must be unzipped', async () => {
    await expect(readBoundaryFile(file('farms.kmz', 'PK'))).rejects.toThrow(
      /unzip/
    )
  })
})
