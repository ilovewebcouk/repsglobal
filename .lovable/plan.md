## Goal

A single `/admin/activity` page where you can see **every** thing happening on REPs in real time — who's online now, who just signed in, what page they're on, what device, where from, plus every business event (enquiries, payments, verification, support, reviews, impersonation). 10/10, GA-style.

Today we have **Member 360 timeline** (per-user, file `src/lib/ops/timeline.functions.ts`) and a thin "Activity" dropdown in `/admin/professionals` that just links to Member 360. We have rich business-event tables (`payment_events`, `support_messages`, `verification_decisions`, `admin_audit_log`, `email_send_log`, `churn_lifecycle`, `reviews`, `enquiries`, `disputes`, `lead_activity`) but **zero capture** of page views, sign-ins, devices, or IP/geo for normal users. `profile_view_events` and `search_appearance_events` exist but are empty.

We'll build the capture pipeline first, then the page.

---

## Phase 1 — Capture pipeline (new)

### 1.1 New tables (one migration, with GRANTs + RLS)
- `auth_events` — `user_id`, `event` (`sign_in` | `sign_out` | `sign_in_failed` | `password_reset` | `email_confirmed`), `ip`, `user_agent`, `country_code`, `city`, `device`, `browser`, `os`, `created_at`. Indexes on `(user_id, created_at desc)` and `(created_at desc)`.
- `page_view_events` — `id`, `user_id` (nullable for anon), `anon_id` (uuid cookie), `session_id`, `path`, `referrer`, `ip`, `user_agent`, `country_code`, `city`, `device`, `browser`, `os`, `duration_ms` (nullable), `created_at`. Indexes on `(created_at desc)`, `(user_id, created_at desc)`, `(session_id)`.
- `user_sessions` — `id`, `user_id` (nullable), `anon_id`, `started_at`, `last_seen_at`, `ip`, `country_code`, `device`, `pages_viewed`, `ended_at`. Drives the "who's online now" widget (active = `last_seen_at` within 5 min).

Service-role writes only; admin-only reads via `has_role(_, 'admin')`.

### 1.2 Page-view capture
- New server route `POST /api/public/activity/pageview` — accepts `{ path, referrer, session_id }`, reads `cf-ipcountry`, `cf-ipcity` (if present), `x-forwarded-for`, `user-agent`, and the Supabase bearer (if any) to resolve `user_id`. Parses UA with `ua-parser-js` (worker-safe). Upserts `user_sessions` and inserts `page_view_events`.
- Client beacon: a tiny `useActivityBeacon()` hook wired once in `src/routes/__root.tsx`, fires on `router.subscribe('onResolved', …)` using `navigator.sendBeacon` so it never blocks navigation. Generates/persists `anon_id` and `session_id` in `localStorage`/`sessionStorage`.
- Respects DNT and is no-op on `/admin/*` impersonation sessions (so admin browsing doesn't pollute member activity).

### 1.3 Auth-event capture
- Client: in `src/routes/__root.tsx`, the existing `onAuthStateChange` listener fires `POST /api/public/activity/auth-event` for `SIGNED_IN` / `SIGNED_OUT` / `USER_UPDATED` (already filtered to identity transitions per memory). 
- Server: route writes to `auth_events` with IP/UA/geo enrichment as above.
- Sign-in failures: capture from the `/auth` page submit handler when Supabase returns an error.

### 1.4 Geo enrichment
- Default to **Cloudflare headers** (`cf-ipcountry`, `cf-ipcity`, `cf-region`) — already on the edge, zero cost, no new secret.
- Leave a single `enrichGeo(ip)` helper so we can swap in MaxMind or ipapi later without touching call sites.

---

## Phase 2 — `/admin/activity` page

Route: `src/routes/admin_.activity.tsx`, `DashboardShell`-wrapped, REPs dark tokens, shadcn primitives only.

### Layout (top to bottom)
1. **Realtime strip** (sticky under header)
   - 4 KPI tiles: **Online now** (5-min active sessions), **Sign-ins today**, **Page views (24h)**, **New members (24h)** — each with 14-day sparkline + MoM delta, matching the Professionals KPI pattern.
2. **Live feed** (left, 2/3 width)
   - Infinite virtualized list of every event across all sources, newest first, auto-refreshing every 10s via TanStack Query.
   - Each row: avatar + name (linked to Member 360) · event icon + label · path/target · device pill · country flag · "2m ago".
   - Filter bar (shadcn `ToggleGroup` + `Select`): event type (page view, sign-in, enquiry, payment, support, verification, review, admin action, impersonation), user (`MemberFinder` reuse), date range, country, device.
   - Search box for free-text (path, email, ticket #).
3. **Right rail** (1/3 width)
   - **Who's online now** — list of active sessions with current page, time on site, country.
   - **Top pages (24h)** — bar list.
   - **Top referrers (24h)**.
   - **Devices / browsers** — donut.
   - **Geo** — country list with counts (lightweight; no map needed for v1, optional v2 with `react-simple-maps`).

### Data sources (unioned in one server fn `getActivityFeed`)
Built on the Member 360 timeline aggregator (`src/lib/ops/timeline.functions.ts`) generalized to "global mode" (no `user_id` filter). Adds: `auth_events`, `page_view_events`, `enquiries`, `lead_activity`, `disputes`, `admin_impersonation_sessions`, `bookings`. Cursor pagination by `(created_at, id)`.

### Drilldowns
- Click a row → opens a side `Sheet` with full event payload (JSON-pretty), related events for the same session, and a "Open Member 360" button.
- Click a session in "Online now" → side `Sheet` with the session's page path trail.

---

## Phase 3 — Polish & ops

- Member 360 gains a new **Sessions** tab (sign-ins + page-view trails for that user).
- Retention: nightly `pg_cron` to roll `page_view_events` older than 90 days into a monthly aggregate table.
- Hash raw IPs at rest (already the pattern in `profile_view_events.viewer_ip_hash`) — store country/city in plaintext, IP as sha256 hash, for GDPR.
- `/admin/professionals` "Activity" dropdown item points at `/admin/activity?user=<id>` (prefilled filter), replacing the current Member 360 alias.

---

## Out of scope (v1)
- Funnels / cohorts / retention curves (GA-style multi-step funnels) — propose as v2 once we have ~30 days of data.
- City-level geo beyond what Cloudflare gives us (would need MaxMind/ipapi secret).
- Anonymous visitor identity stitching across devices.

---

## Technical notes
- Tables follow `<public-schema-grants>`: `GRANT` to `service_role`, no `anon` SELECT, RLS via `has_role(auth.uid(), 'admin')` for reads.
- All capture endpoints under `/api/public/activity/*` (auth-bypass prefix) but verify Supabase bearer when present; never trust client-supplied `user_id`.
- UA parsing: `ua-parser-js` (pure JS, worker-safe). No native deps.
- Live updates: TanStack Query `refetchInterval: 10_000` on the feed; consider Supabase Realtime channel on `page_view_events` insert as a v1.1 upgrade.
- Honors existing impersonation rule — `requireSupabaseAuthWithImpersonation` style scoping; admin events recorded with `actor_id` = real admin, not impersonated user.
