-- Farm diary: dated notes on a farm (planting, spraying, hail, fire, ...).
-- Shown on the charts so changes in green cover can be matched to events.
create table if not exists public.berg_farm_diary (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.berg_farms (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null check (day between '2000-01-01' and '2100-12-31'),
  note text not null check (char_length(note) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists berg_farm_diary_farm_day_idx on public.berg_farm_diary (farm_id, day);

alter table public.berg_farm_diary enable row level security;

-- Own entries only, and only on farms you own.
drop policy if exists "berg_farm_diary_select_own" on public.berg_farm_diary;
create policy "berg_farm_diary_select_own" on public.berg_farm_diary
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "berg_farm_diary_insert_own" on public.berg_farm_diary;
create policy "berg_farm_diary_insert_own" on public.berg_farm_diary
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.berg_farms f where f.id = farm_id and f.user_id = (select auth.uid()))
  );

drop policy if exists "berg_farm_diary_update_own" on public.berg_farm_diary;
create policy "berg_farm_diary_update_own" on public.berg_farm_diary
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.berg_farms f where f.id = farm_id and f.user_id = (select auth.uid()))
  );

drop policy if exists "berg_farm_diary_delete_own" on public.berg_farm_diary;
create policy "berg_farm_diary_delete_own" on public.berg_farm_diary
  for delete to authenticated using (user_id = (select auth.uid()));
