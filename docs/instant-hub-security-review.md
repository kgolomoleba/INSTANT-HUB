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

## Second pass (2026-11-24): function, health, style and sense check

| Area | Problem | Fix |
|---|---|---|
| Security | Users could still set the older `profiles.verified` flag themselves (the badge reads it) | Migration `20261124040000` covers it; DB test added |
| Security | 3 high-severity advisories (react-router XSS/open redirects, ws) | Updated within existing version ranges: 0 advisories in shipped code |
| Function | Real admins were bounced from /admin to the dashboard (role check raced the redirect) | AdminRoute waits until the role is checked for the current user |
| Function | Blank white page if the site was built without Supabase settings | Clear "not set up yet" page |
| Function | Login state could hang on "Checking access" if loading the session failed | Treated as signed out |
| Function | Listing categories were free text but filters used a fixed list, so listings vanished from filters | Shared category lists, a dropdown in the form, "Other" catches the rest |
| Function | Listing form had no location (cards show one), no image limits, could hang on "Publishing..." | Location field, 5 MB / image-type check, errors handled, labelled fields |
| Function | Marketplace counts showed at most 12 | Real totals |
| Sense | Every listing showed made-up ratings (★ 4.8 / 4.9) and "In Stock"/"Available" | Removed |
| Sense | Listings without a photo showed a stock photo of a stranger | Neutral placeholder with the listing's first letter |
| Sense | Browser tab said "Vite + React + TS"; Vite logo as icon | Real title, description, share preview and logo |
| Sense | Profile hint mentioned "Auto Care" | Generic wording |
| Style | Two themes clashed (dark app, light page background): invisible headings on /admin and the dashboard checklist | One dark theme; light cards keep dark headings |
| Style | Dashboard heading slid under the top bar and a white focus outline framed the page | Focus without scrolling; no ring on code-focused containers |
| Health | Dead code and unused packages (router.tsx, old index.css, react-icons, tailwind, postcss, autoprefixer) | Removed |
| Health | One 470 KB script | Split into app and library files (app code 70 KB gzipped) for better caching |

Checked in a browser with a simulated Supabase: home, register, login, dashboard,
marketplace, products (filter, create listing, image limit), services, feed,
profile (save), admin (admin and non-admin), not found, and phone layouts. No
errors, no sideways scrolling.

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
   then `20261124040000_protect_legacy_verified_flag.sql`, then
   `20261124050000_financial_health.sql` (the financial tracker) into the SQL editor.
3. **Email function**: set a secret `INQUIRY_WEBHOOK_SECRET` (Edge Functions →
   Secrets), add the same value as an `x-webhook-secret` header on the
   inquiries database webhook, then redeploy `send-inquiry-email`. Until both
   are set, notification emails stop (the function refuses unsigned calls).

## Not reviewed (not in this repository)

The `products`, `services`, `posts` and `events` tables, their policies and the
`listings` storage bucket were created outside the migrations folder, so their
security can't be checked from the code. `check_security.sql` lists their
policies.

## Financial health tracker (2026-11-24)

New: `/finance` for business owners, `/report/<token>` for shared links,
`/finance/shared/<owner>` for funders with an account.

- **Data:** monthly totals only (`fin_months`). Bank statements are added up in
  the browser; individual transactions are never sent or stored.
- **Access:** owners only, by row-level security. Shared reports are served
  only by `fin_report_by_link` / `fin_report_by_grant`, which check the link
  or grant, its expiry and whether it was switched off, apply the scope
  (summary only, or month-by-month) and log each view. Links are 64 random hex
  characters, last at most a year, and are hidden from search engines and
  referrers. Owners can't fake view counts; funders can't widen their access.
- **Owner controls:** create/switch off links, share with/remove a user, see
  view counts, delete all financial data.
- **Tests:** `supabase/tests/finance_test.sql` (24 checks), plus unit tests for
  the health rules and bank-statement reading (`src/__tests__/finance.test.ts`).
- **Later:** accounting software (Xero, Sage, QuickBooks) needs developer
  agreements with each provider; shown as "coming soon".

## Modern feel (2026-11-24)

- **Instant Hub:** installable app (icon, offline start; the offline cache now
  saves every page file, so a first visit is enough), phone bottom tab bar,
  page transitions (off for "reduce motion"), card-shaped loading
  placeholders, "2 hours ago" times, share button on listings (phone share
  sheet), toast confirmations, offline banner.
- **Berg River:** "Numbers updated 5 minutes ago" with a Refresh button (shows
  the age of the oldest data on screen, even when it came from the device
  cache), tab transitions, offline banner (English and Afrikaans).
- Fixed on the way: Berg River's offline cache missed the app's script files on
  a first visit (blank screen offline).

## Redesign (2026-11-24)

A new design system and structure across Instant Hub, plus a polish pass on Berg River.

- **Foundation:** one set of colours, type (Inter + Plus Jakarta Sans, sentence
  case, no more spaced-out poster headings), buttons, inputs, chips, cards and
  pop-ups (`src/App.css`, `src/components/Modal.css`); a slim full-width top bar;
  one wide page container (pages used to shrink to their content and float in a
  narrow column).
- **Pages rebuilt:** landing page, sign in / sign up (split layout), dashboard
  (numbers row, inbox, checklist, trust status), marketplace, products and
  services (filter bar and four-column card grid), community feed, profile
  (two columns), and the pop-ups (the listing form was a white sheet in a dark
  app).
- **Behaviour fixes found on the way:** buttons that reloaded the whole page
  now navigate instantly; a "Like" button that did nothing was removed;
  profile showed the same checklist twice, a stray "\n", and told users an
  admin approves them "from Supabase"; the signed-out phone menu button was
  covered by a desktop-only button.
- **Berg River:** same type and spacing language, sticky period picker, larger
  verdict, numbered welcome steps.
