-- Security rules for profiles and inquiries. Each check raises an error if a
-- rule is broken, so the run fails. Run with: npm run test:db
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@test');
-- Seed an admin as the server (no signed-in user).
insert into public.profiles (id, username, role) values ('00000000-0000-0000-0000-00000000000a', 'admin', 'admin');

create function pg_temp.as_user(id text) returns void language sql as
  $$ select set_config('request.jwt.claim.sub', id, false) $$;

create function pg_temp.expect_denied(stmt text, label text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAIL: % was allowed', label;
exception
  when insufficient_privilege or raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
    raise notice 'ok   denied: %', label;
end $$;

create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAIL: %', label; end if;
  raise notice 'ok   %', label;
end $$;

set role authenticated;

-- Bob, a regular user
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from profiles) = 0, 'profiles readable without recursion error');
select pg_temp.expect_denied($$insert into profiles(id, username, role) values (auth.uid(), 'bob', 'admin')$$, 'sign up as admin');
insert into profiles(id, username, role, verification_status) values (auth.uid(), 'bob', 'seller', 'verified');
select pg_temp.check((select verification_status from profiles where id = auth.uid()) = 'unverified', 'sign up as verified is downgraded');
select pg_temp.expect_denied($$update profiles set role = 'admin' where id = auth.uid()$$, 'promote self to admin');
select pg_temp.expect_denied($$update profiles set verification_status = 'verified' where id = auth.uid()$$, 'mark self verified');
update profiles set verification_approved_at = now() where id = auth.uid();
select pg_temp.check((select verification_approved_at from profiles where id = auth.uid()) is null, 'cannot set own approval date');
update profiles set bio = 'hello', role = 'buyer', verification_status = 'pending' where id = auth.uid();
select pg_temp.check((select bio = 'hello' and role = 'buyer' and verification_status = 'pending' from profiles where id = auth.uid()), 'normal edits and verification request work');
select pg_temp.check((select count(*) from profiles where id <> auth.uid()) = 0, 'cannot read other profiles');
select pg_temp.check((select count(*) from public_profiles) = 2, 'public_profiles lists everyone');
select pg_temp.check(not username_available('ADMIN') and username_available('someone_new'), 'username_available');
insert into inquiries(sender_id, recipient_id, sender_username, message)
  values (auth.uid(), '00000000-0000-0000-0000-00000000000c', 'Instant Hub Support', 'hello');
select pg_temp.check((select sender_username from inquiries) = 'bob', 'sender name comes from profile');
update profiles set role = 'seller' where username = 'admin'; -- RLS: matches no rows for Bob

-- Carol, the recipient
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
update inquiries set read = true, status = 'read' where recipient_id = auth.uid();
select pg_temp.check((select read from inquiries), 'recipient can mark read');
select pg_temp.expect_denied($$update inquiries set message = 'changed' where recipient_id = auth.uid()$$, 'recipient rewrites message');

-- Admin
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from profiles) = 2, 'admin sees all profiles');
select pg_temp.check((select role from profiles where username = 'admin') = 'admin', 'Bob could not edit the admin profile');
update profiles set verification_status = 'verified', verification_approved_at = now() where username = 'bob';
select pg_temp.check((select verification_status = 'verified' and verification_approved_at is not null from profiles where username = 'bob'), 'admin can verify');

reset role;
\o
\echo 'All security checks passed.'
