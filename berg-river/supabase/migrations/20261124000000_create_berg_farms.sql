-- Farms saved by Berg River Farms users. Each user sees and edits only their own.
create table if not exists public.berg_farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  -- Farm boundary as GeoJSON MultiPolygon coordinates ([lon, lat]).
  boundary jsonb,
  area_ha double precision check (area_ha is null or area_ha >= 0),
  source text check (source in ('map point', 'Cape Farm Mapper', 'file')),
  created_at timestamptz not null default now()
);

create index if not exists berg_farms_user_id_idx on public.berg_farms (user_id);

alter table public.berg_farms enable row level security;

drop policy if exists "berg_farms_select_own" on public.berg_farms;
create policy "berg_farms_select_own" on public.berg_farms
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "berg_farms_insert_own" on public.berg_farms;
create policy "berg_farms_insert_own" on public.berg_farms
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "berg_farms_update_own" on public.berg_farms;
create policy "berg_farms_update_own" on public.berg_farms
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "berg_farms_delete_own" on public.berg_farms;
create policy "berg_farms_delete_own" on public.berg_farms
  for delete to authenticated using (user_id = (select auth.uid()));
