# Public Analytics — v1.1 Plan (anonymous / public visitor analytics)

**Status:** Draft for approval — 2026-06-30
**Decision required before:** any anonymous capture is enabled.
**Owner:** Platform / Growth
**Related:** `docs/privacy/activity-analytics-privacy-plan.md`, `docs/admin-v2/public-analytics-architecture-decision.md`

> v1 ships operational logging only. **Nothing in this plan is enabled in v1.** This document exists so v1.1 can be built directly without another round of planning.

## Recommendation

**Option E — Hybrid (PostHog EU-cloud + Supabase rollups).**

| Layer | Tool | Reason |
| --- | --- | --- |
| Anonymous behavioural analytics (page views, searches, click-throughs, funnels, conversions) | **PostHog Cloud EU**, consent-gated | Purpose-built; UK/EU residency; first-party domain (`a.repsuk.org`) to avoid third-party cookie loss; export/SQL access for our own dashboards |
| Business intelligence (revenue, churn, verification SLAs, support volumes) | **Supabase + REPs admin pages** | Already our source of truth |
| Cross-layer reporting (e.g. "public profile views → enquiries" funnel) | **PostHog → Supabase rollup table** (`public_analytics_events_daily`) populated by a daily job that pulls aggregates from PostHog | Keeps the union surface simple and lets admins query stable Supabase aggregates without paying PostHog per-query |

Rejected alternatives:

- **Option A — Supabase-only with consent.** Forces us to build event SDK, session stitching, funnels, retention reports ourselves. High build cost, low strategic value, and we still need a consent layer.
- **Option B — PostHog only.** Loses tight join to our business data (members, professionals, subscriptions). Cross-funnel analysis becomes export-driven and slow.
- **Option C — Aggregate-only.** Loses behavioural depth needed to actually improve the funnel; this is what we are trying to fix.
- **Option D — Disabled.** We accept being blind to anonymous traffic indefinitely; not acceptable given the SEO programme.

## Tables / events to enable

### Captured in PostHog (consent required)

| event_name | event_family | trigger | properties (sanitised) |
| --- | --- | --- | --- |
| `$pageview` | page | every navigation | path, referrer, utm_*, device, country |
| `directory_search` | search | search form submit | q, profession, location, results_count |
| `directory_no_results` | search | results_count=0 | q, profession, location |
| `directory_result_click` | search | click on a result | profession, location, position, target_pro_slug |
| `profile_view` | profile | `/pro/$slug` mounted | slug, profession, location |
| `profile_cta_click` | profile | enquiry/book CTA | slug, cta |
| `enquiry_start` | conversion | `/pro/$slug/enquire` mounted | slug |
| `enquiry_submit` | conversion | enquiry form success | slug, with_message |
| `signup_start` | conversion | signup page mounted | tier |
| `signup_complete` | conversion | account created | tier |
| `coming_soon_waitlist` | conversion | waitlist form success | tier |

All events include `is_bot` (best-effort), `is_internal` (REPs IP/UA flag), `consent_scope`.

### Materialised inside Supabase

`public.public_analytics_events_daily` (rollup, **no individual events**):

```
day date PRIMARY KEY,
event_name text PRIMARY KEY,
breakdown_key text,            -- e.g. profession slug, profile slug, country
breakdown_value text,
n int NOT NULL,
inserted_at timestamptz default now()
```

Populated by a daily job at 04:00 UTC that calls PostHog's HogQL with `SELECT count() FROM events WHERE event = $1 AND timestamp >= today() - 1 GROUP BY ...`.

## Widgets unlocked in `/admin/activity` (v1.1)

| Widget | Source | Where |
| --- | --- | --- |
| Anonymous page views (24h / 7d / 30d) | PostHog | Right rail |
| Top public profiles (7d) | PostHog | Right rail |
| Top professions / locations / specialisms (7d) | PostHog | Right rail |
| Searches with no results (7d, alerted) | PostHog | Needs-attention panel |
| Public → enquiry conversion (% by profession) | PostHog + Supabase enquiries | New "Funnel" tab |
| Profile-view → enquiry conversion (per profile) | PostHog + Supabase enquiries | Per-profile drill-in |
| Top referrers / top landing pages | PostHog | Right rail |
| Anonymous → member conversion | PostHog distinct_id linkage at signup | Funnel tab |

## Consent model

- **Cookie banner** with three options: **Accept**, **Reject**, **Customise**. Default state is **no PostHog SDK loaded**.
- Banner copy: "We use cookies to understand how visitors find REPs and to improve the directory. You can accept, reject, or choose."
- PostHog loads only when the visitor accepts the **analytics** scope.
- Banner state stored in a first-party cookie `reps.consent.v1` (12 months).
- The banner is also reachable from the footer ("Cookie preferences") to allow opt-out at any time.
- Logged-in members see a one-time inline banner inside `/dashboard` to confirm or change preferences; default for existing accounts is **reject** until they choose.
- DNT / GPC: if either is set, the banner defaults to **reject** and is not shown unless the user clicks the footer link.

## Bot / internal filtering

- PostHog's `$bot` filter is enabled.
- Server-side proxy at `/_a/*` (PostHog reverse proxy on `a.repsuk.org`) strips REPs office/admin IPs and sets `is_internal: true` on events from authenticated admin sessions.
- Known crawler UA patterns are dropped at the proxy.

## Retention & anonymisation

| Layer | Retention | Notes |
| --- | --- | --- |
| PostHog raw events | 12 months | EU residency; deletion API used for erasure requests |
| Supabase rollups | indefinite (aggregate only) | not member-identifying |
| Distinct IDs | 12 months | rotate the salt yearly |

Pseudonymisation: PostHog uses a first-party random `distinct_id`. No raw IP, no email, no name is sent to PostHog. When a visitor signs up, we call `posthog.alias(userId, anonId)` so we can measure anonymous → member conversion; the link is then severed from PostHog's perspective after 90 days by rotating the alias salt.

## Implementation order (v1.1)

1. **Cookie banner + consent storage** (no SDK yet).
2. **PostHog EU project + reverse proxy** under `a.repsuk.org`. Verify with curl.
3. **Wire `$pageview`** behind consent. Smoke-test on a small slice.
4. **Add `directory_search` + `directory_result_click`** with sanitised properties.
5. **Add `profile_view` + `profile_cta_click`**.
6. **Add `enquiry_start` / `enquiry_submit` / `signup_*`**.
7. **Daily rollup job** `pull-posthog-daily.ts` → `public_analytics_events_daily`.
8. **Admin widgets** in `/admin/activity` right rail + Funnel tab.
9. **Cookie preferences page** in footer.
10. **Member CSV export** for subject-access requests.

## Explicitly NOT enabled in v1

- No PostHog SDK present anywhere.
- No cookie banner.
- No `distinct_id`.
- No anonymous events written into any table.
- No anonymous-visitor right-rail widgets.
- The legacy `page_view_events`, `profile_view_events`, `search_appearance_events` tables are **not** repurposed as the anonymous capture path — see `docs/admin-v2/page-view-events-deprecation-decision.md`.

## Approval needed before v1.1 build starts

1. Hybrid (Option E) confirmed by founder.
2. PostHog EU project provisioned.
3. `a.repsuk.org` CNAME created.
4. Cookie banner copy approved by founder + legal review (light-touch).
5. Privacy notice update published before SDK ever loads.
