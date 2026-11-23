# Berg River Farms

A standalone web app that compares **vegetation (crop) cover** on farms along the
Berg River with the **weather**, between two time periods.

## What it shows

For a selected farm and two periods (A and B):

- **Green cover**: estimated % of vegetation cover from NASA MODIS NDVI
  (250 m, one reading every 16 days), drawn over the period.
- **Rainfall**: cumulative rainfall over the period.
- **Comparison tiles**: average green cover and NDVI, rainfall, rain days, longest
  dry spell, average daily high, days at or above 35 °C, frost days, and rainfall
  minus evaporation (ET0).
- **Plain-language summary** of what changed between A and B.
- **All farms table**: the same comparison across every farm at once.

Click the map to add your own farm locations. They're saved in your browser.
The built-in grey points are sample spots named after the nearest town, not real farms.

## Farm boundaries

Farms can have a real boundary instead of a point. Green cover is then measured
only from the 250 m satellite pixels whose centres fall inside the boundary
(the nearest pixel is used for farms smaller than one pixel).

Two ways to add boundaries, both under **Farm boundaries** in the sidebar:

1. **Cape Farm Mapper (default, no setup).** Click inside a farm on the map.
   The app asks Cape Farm Mapper's own Surveyor-General service
   (`gis.westerncape.gov.za/server3/rest/services/DOA-SG/WC_All_Layers/MapServer`,
   the same layers CFM checks when you click its map) which parcel contains that
   spot and adds it with its name and area. Where a farm and its portions
   overlap, it picks the smallest one (the portion you clicked). A different
   ArcGIS service or layer can be pasted in instead.
2. **Import a file**: KML (e.g. from Google Earth or a Cape Farm Mapper export)
   or GeoJSON. Every polygon becomes a farm.

## Data sources (free, no API key)

- Weather: [Open-Meteo historical API](https://open-meteo.com/en/docs/historical-weather-api) (ERA5 reanalysis, daily).
- Vegetation: [ORNL DAAC MODIS web service](https://modis.ornl.gov/data/modis_webservice.html), product MOD13Q1, band `250m_16_days_NDVI`.

Data is fetched directly from the browser; there is no backend.

Green cover uses `((NDVI − 0.15) / 0.70)²` (scaled NDVI, Carlson & Ripley 1997).
It's a rough, generic estimate: read it as a trend, not an exact percentage.

## Run it

```bash
cd berg-river
npm install
npm run dev
```
