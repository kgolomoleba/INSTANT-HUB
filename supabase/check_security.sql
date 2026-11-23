-- Read-only checks to run in the Supabase SQL editor. Nothing here changes data.

-- 1. Every policy on the app's tables. Policies are OR'ed together: one
--    permissive "using (true)" policy (common in Supabase starter templates)
--    opens the whole table, including private verification details.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 2. Tables in the public schema without row-level security turned on.
select c.relname as table_without_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 3. Who is admin right now. Anyone unexpected here may have used the
--    self-promotion hole fixed in 20261124010000.
select id, username, role, verification_status, verification_approved_at
from public.profiles
where role = 'admin' or verification_status = 'verified'
order by role, username;
