# Berg River Project

Project notes kept in the repo so later sessions can pick up the context.

## What it is

A system for farms along the Berg River (Western Cape, South Africa). It checks
farm coverage and the things that matter about each farm, and compares them with
weather effects across different time periods.

## Core ideas (as described so far)

- **Area:** farms in the Berg River catchment.
- **Coverage:** track coverage per farm over time.
- **Weather vs. farms:** relate weather (rainfall, temperature, drought, floods)
  to farm conditions, and compare one period with another (e.g. season vs.
  season, year vs. year, before vs. after an event).
- **Time comparison:** the main view is "how did farm X look at time A vs.
  time B, and what was the weather doing in between?"

## Open questions

- Users: farmers, insurers, co-ops, government or researchers.
- Real farm locations and boundaries (the app currently has sample points
  near towns plus farms users add on the map).
- Which time ranges matter most (default is the May–October winter grain season).
- Whether to move the app into its own repository.
- **Cape Farm Mapper** (https://gis.elsenburg.com/apps/cfm/, Western Cape Dept. of
  Agriculture): candidate source for real farm portions (Surveyor-General layer)
  and crop types (Agriculture Census 2013 / 2017 / 2023 layers). Still to confirm:
  its ArcGIS REST service URLs and layer IDs, whether browsers can call them
  directly, and the terms for reusing the data. A related national service is
  https://ndagis.nda.agric.za/arcgis/rest/services/Western_Cape/MapServer
  (Agric. Census 2018, cultivated fields).

## Decisions log

- **2026-11-23 — "Coverage" means crop/vegetation cover**, measured from
  satellite imagery.
- **2026-11-23 — Separate app**, not part of Instant Hub. Lives in `berg-river/`
  for now.
- **2026-11-23 — First version built** (`berg-river/`): NASA MODIS NDVI via ORNL
  for vegetation, Open-Meteo ERA5 for weather, compare period A vs B per farm and
  across all farms. No backend. See `berg-river/README.md`.
- **2026-11-23 — Farm boundaries from Cape Farm Mapper.** The app takes a pasted
  ArcGIS layer address and looks up the farm boundary at a clicked spot; green
  cover is then measured only inside the boundary. KML / GeoJSON import is the
  backup.
- **2026-11-23 — Real CFM service found** (from CFM's own code,
  `cfm-identify.js`): Surveyor-General parcels at
  `https://gis.westerncape.gov.za/server3/rest/services/DOA-SG/WC_All_Layers/MapServer`,
  layers 7, 8, 9, 10, 11, 3, 4, 6, queried with `identify`. Now the app's default.
  Crop census services on the same server:
  `DOA-Agric-Census/Census_2013_Crops`, `Census_2017_Crops`, `Census_2023_Crops`
  (MapServer). Next step: show each field's crop type.

- **2026-11-24 — Users:** farmers, insurers/banks, government/co-ops, and the
  owner. **Sample points removed**; only real farms the user adds.
- **2026-11-24 — Accounts with Supabase** (email sign-in link). Table
  `berg_farms`, owner-only row-level security
  (`berg-river/supabase/migrations/`). Without Supabase settings the app keeps
  farms in the browser. Not yet run against a real Supabase project.

- **2026-11-24 — Version 2** (focus: looks, reliability, features, speed):
  period presets, tabs, rename, satellite map, phone-first layout, farm diary
  (Supabase table `berg_farm_diary`, markers on charts), CSV export, print
  report, share links, retries/timeouts, on-device cache, partial results,
  all-farms in parallel with sorting.

- **2026-11-24 — Installable + online-ready, Sentinel-2, Explain.** Phone
  "Add to Home Screen" and offline app shell; Vercel/Netlify config.
  Sentinel-2 (10 m) via Copernicus Statistical API in Supabase function
  `sentinel-ndvi`, used for both periods when available, else NASA MODIS.
  "Explain this season" via Supabase function `farm-explain` (Claude Opus 5.5,
  low effort, refusal fallback on, signed-in users only). Keep it simple for
  users: extras appear automatically when configured, no new settings.

- **2026-11-24 — For any farm in the Berg River area; English + Afrikaans.**
  Farms of any kind (grain, vineyards/orchards, grazing); each farm's default
  season from the crop census. Official G10 catchment + DWS river line from
  the Western Cape DoA Water MapServer; farms outside the catchment need a
  confirmation. Simpler screen for non-technical users: verdict first, four
  figures, find-my-farm, welcome steps, in-app dialogs, big touch targets.
  Afrikaans text to be checked by a native speaker.

## Verified against real services

- **Open-Meteo**: real response checked, format matches; sends CORS `*`.
- **gis.elsenburg.com**: sends CORS `*`.
- **gis.westerncape.gov.za** (boundaries, crop census): not yet reached; the
  build environment needs this host allowed (approve from a computer, the phone
  app can't approve environment changes).
- **modis.ornl.gov** (NDVI): not yet reached from the build environment (its
  certificate chains to the emSign root, which the build machine's network
  gateway doesn't accept). Browsers trust it; whether it sends CORS headers is
  still unconfirmed.

## Demo builds (2026-11-24)

Both apps have a demo mode with clearly labelled sample data, for showing them
on a page that has no database and cannot reach other websites (for example a
claude.ai artifact):

```bash
# Berg River
cd berg-river && VITE_DEMO=1 npx vite build -c vite.demo.config.ts
node ../scripts/inline-html.mjs dist-demo berg-river.html
# Instant Hub
VITE_DEMO=1 npx vite build -c vite.demo.config.ts
node scripts/inline-html.mjs dist-demo instant-hub.html
```

The demo code (`src/demo.ts` in Berg River, `src/demo/mock.ts` in Instant Hub)
is only included when `VITE_DEMO=1`; the normal build contains none of it
(checked). Demo data is made up and each demo shows a "DEMO" label.
