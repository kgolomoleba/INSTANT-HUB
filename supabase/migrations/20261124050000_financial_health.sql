-- Financial health tracker.
--
-- Owners record monthly totals (typed in, or added up from a bank statement in
-- their browser: individual transactions are never stored). They can share a
-- health report with funders through private links (no account needed) or by
-- granting access to a registered user. Shared reports are only served through
-- the functions below, which check the link or grant, respect the chosen scope
-- (summary only, or month-by-month) and record each view.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.fin_months (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date and month >= '2000-01-01'),
  income numeric(14, 2) not null default 0 check (income >= 0 and income < 1e12),
  expenses numeric(14, 2) not null default 0 check (expenses >= 0 and expenses < 1e12),
  cash_balance numeric(14, 2) check (cash_balance is null or abs(cash_balance) < 1e12),
  debt numeric(14, 2) check (debt is null or (debt >= 0 and debt < 1e12)),
  source text not null default 'manual' check (source in ('manual', 'bank_csv', 'accounting')),
  note text check (note is null or char_length(note) <= 300),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists public.fin_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- 32 random bytes: unguessable. Only the owner can read it back.
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  label text not null check (char_length(label) between 1 and 80),
  scope text not null default 'summary' check (scope in ('summary', 'monthly')),
  expires_at timestamptz not null check (expires_at <= now() + interval '366 days'),
  revoked_at timestamptz,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fin_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  grantee_id uuid not null references auth.users (id) on delete cascade,
  scope text not null default 'summary' check (scope in ('summary', 'monthly')),
  expires_at timestamptz not null check (expires_at <= now() + interval '366 days'),
  revoked_at timestamptz,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (owner_id <> grantee_id)
);

create table if not exists public.fin_share_views (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  link_id uuid references public.fin_share_links (id) on delete cascade,
  grant_id uuid references public.fin_grants (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists fin_months_user_idx on public.fin_months (user_id, month);
create index if not exists fin_links_user_idx on public.fin_share_links (user_id);
create index if not exists fin_grants_owner_idx on public.fin_grants (owner_id);
create index if not exists fin_grants_grantee_idx on public.fin_grants (grantee_id);
create index if not exists fin_views_owner_idx on public.fin_share_views (owner_id, viewed_at);

alter table public.fin_months enable row level security;
alter table public.fin_share_links enable row level security;
alter table public.fin_grants enable row level security;
alter table public.fin_share_views enable row level security;

-- Owners manage their own rows. Nobody else reads these tables directly.
drop policy if exists fin_months_own on public.fin_months;
create policy fin_months_own on public.fin_months for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists fin_links_own on public.fin_share_links;
create policy fin_links_own on public.fin_share_links for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Grants: the owner manages them; the grantee can see that a grant exists.
drop policy if exists fin_grants_owner on public.fin_grants;
create policy fin_grants_owner on public.fin_grants for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists fin_grants_grantee_read on public.fin_grants;
create policy fin_grants_grantee_read on public.fin_grants for select to authenticated
  using (grantee_id = (select auth.uid()));

drop policy if exists fin_views_owner_read on public.fin_share_views;
create policy fin_views_owner_read on public.fin_share_views for select to authenticated
  using (owner_id = (select auth.uid()));

-- Owners can't fake view counts or reuse tokens.
create or replace function public.fin_protect_share_fields() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Only requests from the app (signed-in users) are limited; the report
  -- functions below run as the owner role and may count views.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.token := old.token;
    new.user_id := old.user_id;
    new.view_count := old.view_count;
    new.last_viewed_at := old.last_viewed_at;
  else
    new.view_count := 0;
    new.last_viewed_at := null;
  end if;
  return new;
end $$;
drop trigger if exists fin_protect_share_fields on public.fin_share_links;
create trigger fin_protect_share_fields before insert or update on public.fin_share_links
  for each row execute function public.fin_protect_share_fields();

create or replace function public.fin_protect_grant_fields() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Only requests from the app (signed-in users) are limited; the report
  -- functions below run as the owner role and may count views.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.owner_id := old.owner_id;
    new.grantee_id := old.grantee_id;
    new.view_count := old.view_count;
    new.last_viewed_at := old.last_viewed_at;
  else
    new.view_count := 0;
    new.last_viewed_at := null;
  end if;
  return new;
end $$;
drop trigger if exists fin_protect_grant_fields on public.fin_grants;
create trigger fin_protect_grant_fields before insert or update on public.fin_grants
  for each row execute function public.fin_protect_grant_fields();

-- ------------------------------------------------------------ the report
-- Builds the report for an owner. Summary scope: totals and ratios over the
-- last 12 recorded months, no month-by-month figures. Monthly scope: adds the
-- months.
create or replace function public.fin_build_report(p_owner uuid, p_scope text)
returns jsonb language sql stable security definer set search_path = public as $$
  with m as (
    select * from public.fin_months where user_id = p_owner
    order by month desc limit 12
  ), p as (
    select username, verification_status from public.profiles where id = p_owner
  )
  select jsonb_build_object(
    'business', (select username from p),
    'verification_status', (select verification_status from p),
    'scope', p_scope,
    'generated_at', now(),
    'summary', (
      select jsonb_build_object(
        'months', count(*),
        'first_month', min(month),
        'last_month', max(month),
        'income', coalesce(sum(income), 0),
        'expenses', coalesce(sum(expenses), 0),
        'profit', coalesce(sum(income - expenses), 0),
        'profitable_months', count(*) filter (where income > expenses),
        'avg_monthly_expenses', coalesce(avg(expenses), 0),
        'latest_cash', (select cash_balance from m where cash_balance is not null order by month desc limit 1),
        'latest_debt', (select debt from m where debt is not null order by month desc limit 1),
        'recent_income', (select coalesce(sum(income), 0) from (select income from m order by month desc limit 3) x),
        'previous_income', (select coalesce(sum(income), 0) from (select income from m order by month desc offset 3 limit 3) x),
        'bank_months', count(*) filter (where source = 'bank_csv'),
        'accounting_months', count(*) filter (where source = 'accounting')
      ) from m
    ),
    'months', case when p_scope = 'monthly' then (
      select coalesce(jsonb_agg(jsonb_build_object(
        'month', month, 'income', income, 'expenses', expenses,
        'cash_balance', cash_balance, 'debt', debt, 'source', source
      ) order by month), '[]'::jsonb) from m
    ) else null end
  )
$$;
revoke all on function public.fin_build_report(uuid, text) from public, anon, authenticated;

-- Shared link: anyone with a valid, unexpired, not-revoked token.
create or replace function public.fin_report_by_link(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  l public.fin_share_links;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then return null; end if;
  select * into l from public.fin_share_links
   where token = p_token and revoked_at is null and expires_at > now();
  if not found then return null; end if;
  update public.fin_share_links set view_count = view_count + 1, last_viewed_at = now() where id = l.id;
  insert into public.fin_share_views (owner_id, link_id) values (l.user_id, l.id);
  return public.fin_build_report(l.user_id, l.scope) || jsonb_build_object('shared_as', l.label, 'expires_at', l.expires_at);
end $$;
revoke all on function public.fin_report_by_link(text) from public;
grant execute on function public.fin_report_by_link(text) to anon, authenticated;

-- Granted access: the signed-in grantee.
create or replace function public.fin_report_by_grant(p_owner uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  g public.fin_grants;
begin
  select * into g from public.fin_grants
   where owner_id = p_owner and grantee_id = auth.uid() and revoked_at is null and expires_at > now()
   order by scope = 'monthly' desc limit 1;
  if not found then return null; end if;
  update public.fin_grants set view_count = view_count + 1, last_viewed_at = now() where id = g.id;
  insert into public.fin_share_views (owner_id, grant_id) values (g.owner_id, g.id);
  return public.fin_build_report(g.owner_id, g.scope) || jsonb_build_object('expires_at', g.expires_at);
end $$;
revoke all on function public.fin_report_by_grant(uuid) from public;
grant execute on function public.fin_report_by_grant(uuid) to authenticated;

-- Share with a registered user by username (profiles are private, so the
-- owner can't look the id up directly).
create or replace function public.fin_grant_access(p_username text, p_scope text, p_days integer)
returns uuid language plpgsql volatile security definer set search_path = public as $$
declare
  target uuid;
  new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if p_scope not in ('summary', 'monthly') or p_days is null or p_days < 1 or p_days > 366 then
    raise exception 'Invalid sharing options' using errcode = '22023';
  end if;
  select id into target from public.profiles where lower(username) = lower(trim(p_username));
  if target is null then raise exception 'No user with that username' using errcode = 'P0002'; end if;
  if target = auth.uid() then raise exception 'You can''t share with yourself' using errcode = '22023'; end if;
  insert into public.fin_grants (owner_id, grantee_id, scope, expires_at)
    values (auth.uid(), target, p_scope, now() + make_interval(days => p_days))
    returning id into new_id;
  return new_id;
end $$;
revoke all on function public.fin_grant_access(text, text, integer) from public;
grant execute on function public.fin_grant_access(text, text, integer) to authenticated;

-- What has been shared with me (owner names only).
create or replace function public.fin_shared_with_me()
returns table (owner_id uuid, business text, scope text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.owner_id, p.username, g.scope, g.expires_at
    from public.fin_grants g join public.profiles p on p.id = g.owner_id
   where g.grantee_id = auth.uid() and g.revoked_at is null and g.expires_at > now()
   order by p.username
$$;
revoke all on function public.fin_shared_with_me() from public;
grant execute on function public.fin_shared_with_me() to authenticated;

-- Grantee usernames for the owner's sharing list.
create or replace function public.fin_my_grants()
returns table (id uuid, grantee text, scope text, expires_at timestamptz, revoked_at timestamptz, view_count integer, last_viewed_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id, p.username, g.scope, g.expires_at, g.revoked_at, g.view_count, g.last_viewed_at
    from public.fin_grants g join public.profiles p on p.id = g.grantee_id
   where g.owner_id = auth.uid()
   order by g.created_at desc
$$;
revoke all on function public.fin_my_grants() from public;
grant execute on function public.fin_my_grants() to authenticated;
