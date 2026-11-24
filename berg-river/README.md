# Berg River Farms

A standalone web app that compares **vegetation (crop) cover** on farms along the
Berg River with the **weather**, between two time periods.

## What it does

- **Compare two periods** with one tap: this winter season vs last year's,
  summer vs summer, the last 90 days vs a year ago, or the last 12 months vs
  the 12 before. Or pick custom dates.
- **Per farm**, in tabs:
  - **Overview**: a plain-language summary and side-by-side figures (green
    cover, rainfall, longest dry spell, daily highs, hot and frost days, rain
    minus evaporation).
  - **Charts**: green cover and rainfall through each period, with diary
    notes marked on them.
  - **Crops**: crops recorded on the farm in the Western Cape crop census.
  - **Diary**: dated notes (planting, spraying, hail, fire...). Notes inside
    the compared periods appear as ◆ on the charts.
- **Download** a farm's data as a spreadsheet (one row per day), **print** a
  report, or **share a link** that opens the same farm and periods.
- **All farms**: the same comparison for every farm, biggest drop in green
  cover first, downloadable as a spreadsheet.
- **Satellite map** (with a street map option) for finding farms.

Weather and satellite data load separately, so if one service is down the
other still shows, with a "Try again" button. Requests that fail because a
service is busy are retried automatically, and data you've viewed is kept on
the device (IndexedDB) so it opens instantly next time.

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

## Crops

Each farm shows its crops from the Western Cape Department of Agriculture crop
census (2013, 2017, 2023; winter and summer), the same layers Cape Farm Mapper
uses: crop, dry land / irrigated, and hectares. A census field counts when a
point inside it falls inside the farm boundary.

## Data sources (free, no API key)

- Weather: [Open-Meteo historical API](https://open-meteo.com/en/docs/historical-weather-api) (ERA5 reanalysis, daily).
- Vegetation: [ORNL DAAC MODIS web service](https://modis.ornl.gov/data/modis_webservice.html), product MOD13Q1, band `250m_16_days_NDVI`.

Satellite, weather and boundary data are fetched directly from the browser.

## Accounts (optional, Supabase)

Without Supabase settings the app works fully, with farms and diary kept in the browser.
To turn on sign-in (email link) and online saving:

1. In a Supabase project (Instant Hub's or a new one), run
   the migrations in `supabase/migrations/` (SQL editor, or `supabase db push`).
   They create `berg_farms` and `berg_farm_diary`; row-level security lets each
   user see and change only their own farms and notes.
2. In Supabase → Authentication → URL Configuration, add the app's address
   (e.g. `http://localhost:5173`) to the redirect URLs.
3. Deploy the satellite fallback function (used only if a browser can't reach
   NASA's service directly): `supabase functions deploy modis-ndvi`.
4. Create `berg-river/.env.local`:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```

Green cover uses `((NDVI − 0.15) / 0.70)²` (scaled NDVI, Carlson & Ripley 1997).
It's a rough, generic estimate: read it as a trend, not an exact percentage.

## Run it

```bash
cd berg-river
npm install
npm run dev
```

## Put it online (phone app)

The app is a static site: `npm run build` produces `dist/`. `vercel.json` and
`netlify.toml` are included, so importing the repository in Vercel or Netlify
with **root directory `berg-river`** is enough. Add the two `VITE_SUPABASE_*`
settings there too. On a phone, open the site and choose **Add to Home
Screen**; it then opens like an app and works offline for farms already viewed.

## Optional extras (switch on by themselves once set up)

| Extra | What users get | Set up |
|---|---|---|
| Sharper satellite | Sentinel-2: 10 m detail, a reading every ~5 days instead of NASA's 250 m / 16 days | Free account at dataspace.copernicus.eu → OAuth client; Supabase secrets `CDSE_CLIENT_ID`, `CDSE_CLIENT_SECRET`; `supabase functions deploy sentinel-ndvi` |
| Explain this season | A ✦ button (signed-in users) where Claude writes 3–5 plain sentences about the farm's figures | Supabase secret `ANTHROPIC_API_KEY`; `supabase functions deploy farm-explain` |
| NASA backup | Satellite data still loads if a browser can't reach NASA directly | `supabase functions deploy modis-ndvi` |

Without them the app works as before (NASA satellite, no ✦ button).

## Tests

```bash
npm test          # app logic: stats, periods, polygons, imports, exports, network retries
npm run test:db   # database rules on a throwaway local PostgreSQL (needs PostgreSQL installed)
```
