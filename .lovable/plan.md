# Next Steps — Phased Build Plan

You've completed **Phase 1** (locked static screens for public site, pro dashboard, admin). Below is the sequence I'd build in, based on your answers: foundation + client portal in parallel, invite-only client onboarding with automatic email, all four portal features in v1, FatSecret ready.

---

## Phase 2 — Foundation + Client Portal (parallel)

Two tracks run side-by-side. Track A is invisible plumbing; Track B is visible design progress so you always see something moving.

### Track A — Foundation (data + auth)

1. **Enable Lovable Cloud** (Supabase under the hood).
2. **Design the database schema** for the whole platform, but only create tables we need now. Core tables:
   - `profiles` (1:1 with `auth.users`, basic info)
   - `app_role` enum: `admin | professional | client`
   - `user_roles` (separate table — never store roles on profile, prevents privilege escalation)
   - `professionals` (extends profile for pros — REPs level, specialisms, DBS, insurance)
   - `clients` (extends profile for clients)
   - `coach_client` (links a professional to their clients, status = active/paused/ended)
   - `client_invites` (token, email, invited_by, expires_at, accepted_at)
3. **Row-Level Security** on every table:
   - Clients can only read/write their own data.
   - Professionals can read/write only data for clients linked to them via `coach_client`.
   - Admins use a `has_role()` security-definer function (no recursive RLS).
4. **Auth flow:**
   - Public can only sign up as a **professional** (existing `/signup` page).
   - **Clients cannot self-signup.** A pro adds a client → row in `client_invites` → branded email auto-sent with a one-time token link → `/accept-invite?token=…` page → client sets password → account created with `client` role and `coach_client` link in place.
5. **Branded auth emails** via Lovable's built-in email infrastructure (welcome, invite, password reset, magic link) — using the REPs orange/dark design.
6. **Protect routes:** `_authenticated` layout + role gates so `/dashboard/*` requires `professional` or `admin`, `/admin/*` requires `admin`, `/portal/*` requires `client`.

### Track B — Client portal mock-ups (visible progress)

The client portal is a **new surface** — it's not in the six locked mock-ups. We design and build it static first, then wire data in Phase 3. Four locked screens at `/portal/*`, matching REPs dark + orange visual language:

1. **`/portal`** — Today dashboard: today's session, macros ring, next check-in due, unread messages, weekly adherence.
2. **`/portal/program`** — Assigned programme, weekly schedule, today's workout with set/rep/RPE/notes logging.
3. **`/portal/nutrition`** — Daily food log, macros vs target, food search (FatSecret), meal builder, water + weight.
4. **`/portal/check-ins`** — Weekly check-in form, photos, measurements, progress chart.
5. **`/portal/messages`** — 1:1 thread with assigned coach.
6. Shared `ClientShell` with sticky sidebar + footer, same shell pattern as `ProShell`/`AdminShell`.

We design these as static screens (real-looking placeholder data) before wiring anything, same workflow as Phase 1.

---

## Phase 3 — Wire live data

Once Phase 2 is approved, swap placeholder JSON for Supabase queries via TanStack Start `createServerFn` (auth-aware, RLS-respected). Order:

1. **Clients list** — `/dashboard/clients` reads real `coach_client` rows. Pro can "Add client" → triggers invite email.
2. **Programs** — pro builds programmes at `/dashboard/programs`; client sees assigned programme at `/portal/program`; client logs workouts → pro sees adherence on the client detail page.
3. **Check-ins** — pro defines weekly template; client submits at `/portal/check-ins`; pro reviews at `/dashboard/check-ins`.
4. **Messages** — 1:1 thread per `coach_client`, realtime via Supabase Realtime.
5. **Bookings + calendar** — wire `/dashboard/bookings` and `/dashboard/calendar` to a `bookings` table.

---

## Phase 4 — FatSecret nutrition engine

You have credentials, so this slots in cleanly.

1. Add `FATSECRET_CONSUMER_KEY` + `FATSECRET_CONSUMER_SECRET` as runtime secrets.
2. Server-only OAuth1 helper in `src/lib/fatsecret.server.ts` (Worker-compatible — no Node-only deps).
3. `createServerFn` wrappers: `searchFoods`, `getFood`, `getRecipes`. Server-side cache table `food_cache` keyed on FatSecret ID to stay under the rate limit and speed up repeat lookups.
4. App tables: `food_log_entry`, `meal`, `meal_plan`, `meal_plan_assignment`.
5. Client portal: searchable food log on `/portal/nutrition` with macros vs target, water, weight; mobile-friendly.
6. Pro side: meal-plan builder on `/dashboard/nutrition`, assigns plan → client sees it on `/portal/nutrition`; pro sees adherence on the client detail page.

---

## Phase 5+ — Later

- **Stripe payments** — Stripe Connect for client subscriptions to pros, plus REPs Pro membership billing.
- **AI assist** — Lovable AI Gateway for programme suggestions, check-in summaries, lead-reply drafts. AI enhances workflows that already work; never replaces missing structure.
- **BD migration** — only after schema is fully stable and live for new pros.
- **Public marketplace booking** — wire `/find-a-professional` search + booking flow to live data.

---

## What I'd do next (decision)

I recommend we kick off **Phase 2 immediately**: I enable Lovable Cloud, ship the schema + roles + RLS + invite-email auth flow in one go, and in parallel start the static design of the **four client portal screens** (Today, Program, Nutrition, Check-ins + Messages). When both are approved, Phase 3 wires them up.

If you approve this plan I'll start with **Cloud enablement + the schema migration + the invite flow**, then move straight into the portal `Today` screen mock-up so you have something visual to react to.

## Technical notes

- Roles in a separate `user_roles` table + `has_role()` security-definer function — required to avoid RLS recursion and privilege-escalation bugs.
- Client invite emails use Lovable's built-in email queue (durable, retried, rate-limit-aware).
- Server access via TanStack `createServerFn` with `requireSupabaseAuth` middleware — no Supabase Edge Functions, no direct DB calls from loaders.
- FatSecret OAuth1 signing runs server-side only; consumer secret never reaches the browser.
- All new screens reuse existing design tokens in `src/styles.css` and the REPs radius scale — no new visual language introduced.
