-- Each farm's main growing season, used for its default comparison.
alter table public.berg_farms
  add column if not exists season text check (season in ('winter', 'summer', 'year'));
