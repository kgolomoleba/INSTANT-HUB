-- Minimal stand-in for what Supabase provides, so the migrations and security
-- tests can run on a plain local PostgreSQL. Not used in the real project.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

-- Base tables that were created in the dashboard, not in migrations
-- (only the columns the migrations and tests rely on).
create table public.profiles (
  id uuid primary key references auth.users,
  username text unique, bio text, role text, location text, avatar_url text, updated_at timestamptz
);
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid, recipient_id uuid, sender_username text,
  listing_type text, listing_title text, message text,
  read boolean default false, created_at timestamptz default now()
);
