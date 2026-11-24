-- Financial tracker: privacy and sharing rules. Raises on any broken rule.
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

insert into auth.users values
  ('00000000-0000-0000-0000-0000000000f1', 'owner@test'),
  ('00000000-0000-0000-0000-0000000000f2', 'funder@test'),
  ('00000000-0000-0000-0000-0000000000f3', 'stranger@test')
on conflict do nothing;
insert into public.profiles (id, username, role) values
  ('00000000-0000-0000-0000-0000000000f1', 'spaza_owner', 'seller'),
  ('00000000-0000-0000-0000-0000000000f2', 'fund_za', 'investor'),
  ('00000000-0000-0000-0000-0000000000f3', 'nosy', 'buyer')
on conflict do nothing;

create function pg_temp.as_user(id text) returns void language sql as
  $$ select set_config('request.jwt.claim.sub', id, false) $$;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAIL: %', label; end if;
  raise notice 'ok   %', label;
end $$;
create function pg_temp.expect_denied(stmt text, label text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAIL: % was allowed', label;
exception
  when insufficient_privilege or check_violation or raise_exception or undefined_function or no_data_found or invalid_parameter_value or unique_violation then
    if sqlerrm like 'FAIL:%' then raise; end if;
    raise notice 'ok   denied: %', label;
end $$;

set role authenticated;

-- Owner records months
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
insert into fin_months (month, income, expenses, cash_balance, source) values
  ('2026-05-01', 30000, 25000, 15000, 'manual'),
  ('2026-06-01', 32000, 26000, 21000, 'bank_csv'),
  ('2026-07-01', 31000, 33000, 19000, 'bank_csv'),
  ('2026-08-01', 40000, 28000, 31000, 'bank_csv');
select pg_temp.expect_denied($$insert into fin_months (month, income, expenses) values ('2026-09-15', 1, 1)$$, 'month not on the 1st');
select pg_temp.expect_denied($$insert into fin_months (month, income, expenses) values ('2026-05-01', 1, 1)$$, 'duplicate month');
select pg_temp.expect_denied($$insert into fin_months (user_id, month, income, expenses) values ('00000000-0000-0000-0000-0000000000f3', '2026-01-01', 1, 1)$$, 'months for someone else');
insert into fin_share_links (label, scope, expires_at) values ('Bank A', 'summary', now() + interval '30 days');
insert into fin_share_links (label, scope, expires_at) values ('Investor B', 'monthly', now() + interval '30 days');
select pg_temp.expect_denied($$insert into fin_share_links (label, expires_at) values ('Forever', now() + interval '5 years')$$, 'link longer than a year');
update fin_share_links set view_count = 999 where label = 'Bank A';
select pg_temp.check((select view_count from fin_share_links where label = 'Bank A') = 0, 'owner cannot fake view counts');
select pg_temp.check(fin_grant_access('FUND_ZA', 'summary', 30) is not null, 'share with a registered user by username');
select pg_temp.expect_denied($$select fin_grant_access('nobody_here', 'summary', 30)$$, 'share with unknown user');
select pg_temp.expect_denied($$select fin_grant_access('spaza_owner', 'summary', 30)$$, 'share with yourself');
create temp table toks as select label, token from fin_share_links;
grant select on toks to authenticated, anon;

-- Stranger
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f3');
select pg_temp.check((select count(*) from fin_months) = 0, 'stranger sees no months');
select pg_temp.check((select count(*) from fin_share_links) = 0, 'stranger sees no links');
select pg_temp.check(fin_report_by_grant('00000000-0000-0000-0000-0000000000f1') is null, 'stranger has no grant');
select pg_temp.expect_denied($$select fin_build_report('00000000-0000-0000-0000-0000000000f1', 'monthly')$$, 'call the internal report builder');

-- Anyone with the link (anon)
reset role; set role anon;
select pg_temp.check((select (fin_report_by_link(token) -> 'summary' ->> 'profitable_months')::int = 3 from toks where label = 'Bank A'), 'summary link: 3 of 4 months profitable');
select pg_temp.check((select (fin_report_by_link(token) -> 'months') = 'null'::jsonb from toks where label = 'Bank A'), 'summary link hides monthly figures');
select pg_temp.check((select jsonb_array_length(fin_report_by_link(token) -> 'months') = 4 from toks where label = 'Investor B'), 'monthly link shows the months');
select pg_temp.check(fin_report_by_link('deadbeef') is null and fin_report_by_link(repeat('0', 64)) is null, 'wrong tokens return nothing');
reset role; set role authenticated;

-- Funder with a grant
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f2');
select pg_temp.check((select count(*) from fin_shared_with_me()) = 1, 'funder sees "shared with me"');
select pg_temp.check((fin_report_by_grant('00000000-0000-0000-0000-0000000000f1') -> 'summary' ->> 'income')::numeric = 133000, 'funder report totals');
select pg_temp.check((select count(*) from fin_months) = 0, 'funder still cannot read the raw table');
update fin_grants set scope = 'monthly';
select pg_temp.check((select scope from fin_grants limit 1) = 'summary', 'funder cannot widen their own access');

-- Owner revokes; views were logged
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
select pg_temp.check((select view_count from fin_share_links where label = 'Bank A') = 2, 'link views counted');
select pg_temp.check((select count(*) from fin_share_views) >= 4, 'views logged for the owner');
update fin_share_links set revoked_at = now() where label = 'Bank A';
update fin_grants set revoked_at = now();
reset role; set role anon;
select pg_temp.check((select fin_report_by_link(token) is null from toks where label = 'Bank A'), 'revoked link stops working');
reset role; set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f2');
select pg_temp.check(fin_report_by_grant('00000000-0000-0000-0000-0000000000f1') is null, 'revoked grant stops working');

-- Expired links
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1');
reset role;
update fin_share_links set expires_at = now() - interval '1 minute' where label = 'Investor B';
set role anon;
select pg_temp.check((select fin_report_by_link(token) is null from toks where label = 'Investor B'), 'expired link stops working');

reset role;
\o
\echo 'All financial tracker checks passed.'
