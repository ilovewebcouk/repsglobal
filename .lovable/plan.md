## What's wrong

On Jordon's Member 360 the Snapshot shows "no subscription" and the Stripe Customer / Subscription identifiers are blank — but he has an active £99 sub in Stripe (`sub_1TmXWIAP31Yc4cJj9jb8rduk` on `cus_RmoJlLmTA752zV`). The page is reading the local mirror, which is stale because the webhook didn't fire when we cancelled the duplicate via the Node script.

You want two changes:

1. **Member 360 → resolve from Stripe live on load**, every load. No refresh button, no mirror pill.
2. **/admin/billing → resolve from Stripe live on load**, every load. Remove the Refresh button and any "Stripe mirror" pill/jargon.

## Plan

### 1. Member 360 (`/admin/members/$userId`)

- In the loader for the member route, after we have the user's `stripe_customer_id`, call Stripe directly (server-side) for that one customer: list subscriptions (status=all, expand `data.items.data.price.product`, limit 10), pick the "best" one (active > trialing > past_due > canceled, then latest `current_period_end`), and upsert that single row into `public.subscriptions` so the rest of the app stays consistent.
- Return the live-resolved billing row to the page so Snapshot fills in:
  - **Tier** — from the resolved price → product mapping
  - **Price** — formatted £/interval
  - **Next renewal** — `current_period_end` (or `trial_end` while trialing)
  - **Stripe Customer** — `cus_…` with deep-link to Stripe
  - **Stripe Subscription** — `sub_…` with deep-link
- Cost: 1 Stripe API call per Member 360 page load (scoped to that one customer) — safe, not the 340-call problem.

### 2. /admin/billing

- Loader calls the existing `resyncStripeMirror` once on every page load (server-side, before render). KPIs, Subscriptions, Payments, Disputes, Refunds all read fresh data.
- Remove the **Refresh from Stripe** button entirely.
- Remove the **Stripe mirror** pill / "Source" jargon from the header.
- Add a small muted timestamp instead: "Live from Stripe · {time}".
- Cost: 1 full mirror resync per `/admin/billing` page load. At ~340 subs that's one paginated Stripe walk per admin pageview — acceptable for an admin-only route; we can debounce later if it gets heavy.

### 3. Cleanup

- Delete `resyncStripeMirror` *button* wiring in `admin_.billing.tsx` and any `MirrorPill` / "Source: Stripe mirror" UI.
- Keep `resyncStripeMirror` the server function — now called from the loader, not a button.
- Keep `member-billing-row.server.ts` as the canonical resolver; extend it (or wrap it) so it can do a per-customer live Stripe pull when called from Member 360's loader.

### Out of scope

- No background polling, no websocket, no auto-refresh timer. Just "fresh on navigation/reload", which is what you asked for.
- No changes to the Professionals list (still reads the mirror; the `/admin/billing` resync keeps it warm).

## Result for Jordon

After this ships, loading `/admin/members/5c543d9e…` will pull live from Stripe, write the surviving `sub_1TmXWIAP31Yc4cJj9jb8rduk` into the mirror, and the Snapshot will show: Tier **Verified (Core)**, Price **£99/yr**, Next renewal **{stripe date}**, Stripe Customer **cus_RmoJlLmTA752zV**, Stripe Subscription **sub_1TmXWIAP31Yc4cJj9jb8rduk**.
