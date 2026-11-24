-- Each check raises an error if a rule is broken. Run with: npm run test:db
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000b', 'bob@test'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@test');

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
  when insufficient_privilege or check_violation or raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
    raise notice 'ok   denied: %', label;
end $$;

set role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into berg_farms (id, name, lat, lon, source) values ('11111111-1111-4111-8111-111111111111', 'Bob farm', -33.4, 18.9, 'Cape Farm Mapper');
insert into berg_farm_diary (farm_id, day, note) values ('11111111-1111-4111-8111-111111111111', '2026-06-03', 'Hail');
select pg_temp.check((select count(*) from berg_farm_diary) = 1, 'owner adds a diary note');
select pg_temp.expect_denied($$insert into berg_farms (user_id, name, lat, lon) values ('00000000-0000-0000-0000-00000000000c', 'x', 0, 0)$$, 'create a farm for someone else');
select pg_temp.expect_denied($$insert into berg_farms (name, lat, lon, source) values ('x', 0, 0, 'hacked')$$, 'unknown farm source');
select pg_temp.expect_denied($$insert into berg_farm_diary (farm_id, day, note) values ('11111111-1111-4111-8111-111111111111', '2026-06-04', '')$$, 'empty diary note');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from berg_farms) = 0, 'others cannot see the farm');
select pg_temp.check((select count(*) from berg_farm_diary) = 0, 'others cannot see the diary');
select pg_temp.expect_denied($$insert into berg_farm_diary (farm_id, day, note) values ('11111111-1111-4111-8111-111111111111', '2026-06-04', 'spam')$$, 'note on someone else''s farm');
delete from berg_farm_diary;
delete from berg_farms;
update berg_farms set name = 'stolen';

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select name from berg_farms) = 'Bob farm', 'others cannot rename or delete the farm');
select pg_temp.check((select count(*) from berg_farm_diary) = 1, 'others cannot delete the diary');
delete from berg_farms;
select pg_temp.check((select count(*) from berg_farm_diary) = 0, 'removing a farm removes its diary');

reset role;
\o
\echo 'All Berg River security checks passed.'
