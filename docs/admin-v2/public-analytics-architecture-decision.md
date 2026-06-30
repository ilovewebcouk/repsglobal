# Public Analytics — Architecture Decision

**Status:** Accepted (design only; implementation deferred to v1.1) — 2026-06-30
**Pairs with:** `docs/privacy/public-analytics-v1-1-plan.md`

## Decision

Anonymous public visitor analytics will be captured **outside REPs' operational database** by a consent-gated PostHog Cloud (EU) project, routed through a first-party reverse proxy on `a.repsuk.org`, with daily aggregates pulled into a Supabase rollup table (`public.public_analytics_events_daily`). Operational activity tables (`auth_events`, `member_session_events`, `user_sessions`, `payment_events`, etc.) **must never** contain anonymous visitor events.

## Capture pipe

```
Browser (consent === 'accepted')
  ↓ posthog-js initialised with api_host = 'https://a.repsuk.org/_a'
Browser → a.repsuk.org/_a/*  (REPs edge: TanStack server route under /api/public/_a/*)
  - Strips client IP before forwarding to PostHog
  - Sets is_internal=true when the request bearer belongs to an admin
  - Drops requests when User-Agent matches a known bot
  - Drops requests when DNT/GPC asserted
PostHog Cloud EU (events stored 12 months)
  ↓ nightly HogQL pull at 04:00 UTC
Supabase: public.public_analytics_events_daily (admin-read rollups)
  ↓
/admin/activity right rail + /admin/activity/funnels  (v1.1 surfaces)
```

## Why first-party proxy

- Avoids third-party cookie + tracking-blocker loss (`/_a/*` is same-origin).
- Lets us strip raw IP before it ever reaches PostHog.
- Gives a single chokepoint for bot/internal filtering and consent enforcement.
- Easy to disable: turn off the route → all capture stops, no app deploy needed.

## Why a daily Supabase rollup

- PostHog query cost scales with admin pageviews; rollups make `/admin/activity` widgets free to render.
- Funnels that join "PostHog `profile_view`" to "Supabase `enquiries`" need a stable Supabase-side aggregate to be queryable in a single SQL call.
- Survives PostHog outages (admin widgets stay readable; only "live" widgets degrade).

## What the proxy looks like (forward-looking, not in v1)

```ts
// src/routes/api/public/_a/$.ts   ← v1.1
export const Route = createFileRoute("/api/public/_a/$")({
  server: { handlers: {
    POST: async ({ request, params }) => {
      if (request.headers.get("DNT") === "1") return new Response(null, { status: 204 });
      if (request.headers.get("Sec-GPC") === "1") return new Response(null, { status: 204 });
      const ua = request.headers.get("user-agent") ?? "";
      if (BOT_UA.test(ua)) return new Response(null, { status: 204 });

      const body = await request.json();
      // Strip any incoming $ip; replace properties.is_internal from server context.
      delete body.properties?.$ip;
      const internal = await detectInternalAdmin(request);
      body.properties = { ...body.properties, is_internal: internal };

      return fetch(`https://eu.i.posthog.com/${params._splat}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    },
  } },
});
```

## Why this is NOT in v1

- No consent banner yet; capture without consent is the failure mode we are trying to prevent.
- No `a.repsuk.org` CNAME yet.
- No PostHog project provisioned yet.
- Founder approval of Option E (hybrid) is still required.

## Boundaries (hard rules)

1. Operational tables (`auth_events`, `member_session_events`, `user_sessions`, `payment_events`, `disputes`, etc.) **never** receive anonymous events.
2. `getActivityFeed` **never** queries PostHog directly at request time; it only reads `public_analytics_events_daily` and only after v1.1 ships.
3. Public-visibility decisions for professionals **never** depend on analytics — that contract stays Stripe + verification.
4. PostHog SDK must not load until `reps.consent.v1.analytics === "accepted"`.
