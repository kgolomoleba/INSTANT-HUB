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
