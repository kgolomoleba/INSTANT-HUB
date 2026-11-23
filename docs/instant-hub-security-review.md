# Instant Hub — bug and security review (2026-11-24)

Fixes are on branch `claude/berg-river-project-cmpymf`. Database fixes were
tested on PostgreSQL 16 with a Supabase-like setup (auth.uid(), anon /
authenticated roles) — not on the live project.

## Found and fixed

| # | Severity | Problem | Fix |
|---|---|---|---|
| 1 | Critical | Any signed-in user could make themselves **admin** (`update profiles set role='admin'`): the own-row policy allowed every column, and `role` holds both the user's chosen role and `admin`. | Trigger `protect_profile_fields` blocks granting/removing `admin` unless done by an admin. |
| 2 | Critical | Any user could mark themselves **verified** (the Profile page even sent `verification_status` on save). | Same trigger: only admins can set `verified` or `verification_approved_at`. Profile page no longer sends it. |
| 3 | High | Migration `20260805…` had a quoting error (`$$` inside `$$`), so it always failed: `is_admin()` never existed and the admin policies stayed recursive → **"infinite recursion detected in policy for relation profiles"** for profile reads. | Quoting fixed; new migration recreates `is_admin()` and re-points the policies, so it also repairs a database where 0805 failed. |
| 4 | High | Inquiry email function: anyone could call it with a made-up payload and make it email any user; user text went into the email HTML unescaped. | Requires a shared secret header; reads the inquiry from the database by id; escapes all text. |
| 5 | Medium | Inquiry senders could set any `sender_username` (e.g. "Instant Hub Support"). | Trigger sets it from the sender's profile. |
| 6 | Medium | Inquiry recipients could rewrite any field of a received inquiry (message, sender). | Trigger allows only `status`, `read`, `responded_at`. |
| 7 | Medium | Sellers showed as "Unknown" with no verified badge on Marketplace / Products / Services / feed: profiles are owner-only, so other users' names couldn't be read. | `public_profiles` view (id, username, avatar, verification status only); pages read from it. |
| 8 | Medium | Registration's "username taken" check couldn't see other users, so it never triggered. | `username_available()` function. |
| 9 | Low | Admin page opened any submitted document URL. | Only `http(s)` links are opened. |
| 10 | Low | AdminRoute could stay on "Checking access…" forever if the role lookup failed, and didn't re-check after a user change. | Fixed. |
| 11 | Low | Login followed any `from` value in navigation state. | Only in-app paths. |
| 12 | Low | `catch (err: any)` + `err.message` crashed on non-Error throws. | `errorMessage()` helper. |
| — | Tooling | ESLint parsed TypeScript as JavaScript (28 parse errors, no real checking). | typescript-eslint configured; 0 errors. |

## To apply (needs your Supabase project)

1. **Check first** (read-only): run `supabase/check_security.sql` in the SQL
   editor. Look for:
   - any policy with `qual = true` on `profiles` (a starter-template "public
     profiles" policy would expose verification documents to everyone — drop it
     now that `public_profiles` exists);
   - tables without RLS;
   - unexpected admins or verified users (possible use of holes 1–2).
2. **Apply the migrations**: `supabase db push`, or paste
   `supabase/migrations/20261124010000_lock_down_profile_and_inquiry_fields.sql`
   into the SQL editor.
3. **Email function**: set a secret `INQUIRY_WEBHOOK_SECRET` (Edge Functions →
   Secrets), add the same value as an `x-webhook-secret` header on the
   inquiries database webhook, then redeploy `send-inquiry-email`. Until both
   are set, notification emails stop (the function refuses unsigned calls).

## Not reviewed (not in this repository)

The `products`, `services`, `posts` and `events` tables, their policies and the
`listings` storage bucket were created outside the migrations folder, so their
security can't be checked from the code. `check_security.sql` lists their
policies.
