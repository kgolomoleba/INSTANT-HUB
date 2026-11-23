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

- What "coverage" means here: crop/vegetation cover (e.g. from satellite
  imagery), insurance coverage, irrigation/water coverage, or several of these.
- Data sources: satellite imagery (Sentinel-2 / Landsat NDVI), weather data
  (SAWS, Open-Meteo, ERA5), farm boundaries.
- Users: farmers, insurers, co-ops, government or researchers.
- Whether it lives inside Instant Hub or is a separate app.
- Which farms or areas to start with, and which time ranges matter.

## Decisions log

_None yet._
