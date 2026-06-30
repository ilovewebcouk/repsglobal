# Activity Architecture Decision (ADR)

**Status:** Accepted — 2026-06-30
**Owner:** Platform / Admin v2
**Supersedes:** ad-hoc per-source admin pages
**Related:** `docs/admin-v2/page-view-events-deprecation-decision.md`, `docs/privacy/activity-analytics-privacy-plan.md`, `docs/privacy/public-analytics-v1-1-plan.md`

## Decision

For **Admin Activity v1**, the global activity feed (`/admin/activity`) is built as a **read-through union** over existing business tables, **not** as a canonical `activity_events` ledger.

Only three classes of event get their own dedicated table:

| Table | Why dedicated |
| --- | --- |
| `auth_events` | Auth state transitions have no other home; sign-ins are not modelled in any existing business table. |
| `member_session_events` | Per-page beacon for logged-in members — new capture, new shape. |
| `user_sessions` | "Who's online now" requires an upsert-on-heartbeat row, not an immutable event row. |

Every other event family — payments, subscriptions, disputes, enquiries, reviews, support, verification, admin actions, email, churn, lead activity, impersonation, bookings — is read from its source table and normalised at query time inside `getActivityFeed`.

## Why not a canonical ledger in v1

| Option | v1 cost | v1 risk |
| --- | --- | --- |
| Read-through union (**chosen**) | One server fn, no new write paths to teach existing code | Cross-table query latency; per-source failures must be tolerated |
| `activity_events` ledger written by triggers | New tables, RLS, triggers on 13 source tables, dedupe key design, backfill of historic rows | Migration risk, double-writes during transition, broken triggers can silently lose business events |
| Outbox per source → projector | Even more moving parts; needs a worker | Worst-case data loss surface; massive build cost for v1 |

The ledger approach is **strictly better** for query latency and analytics use cases, but it has a much larger build surface and a higher blast radius if any trigger goes wrong. Given REPs has < 1k members and < 100 admin sessions/day, the union model is comfortably inside its performance envelope.

## When we promote v1 → ledger

Trigger conditions (any one is sufficient):

1. `getActivityFeed` p95 latency **> 800ms** in production for **3 consecutive days**.
2. Source-table count in the union exceeds **18**.
3. Cross-source dedupe pain — i.e. the same logical event surfacing twice and requiring app-level filters.
4. Public analytics v1.1 ships and starts feeding the same admin views (anonymous event volume dominates).
5. We need to answer "what happened across the platform between t1 and t2 for cohort X" in **< 200ms**.

When promoted, the design lands as:

- `public.activity_events(id uuid pk, source text, source_id text, event_family text, event_type text, severity text, user_id uuid, professional_id uuid, actor_id uuid, ts timestamptz, payload jsonb, context jsonb)`
- Natural-key idempotency: `UNIQUE (source, source_id, event_type)` — re-inserts no-op.
- Written by `INSERT ... ON CONFLICT DO NOTHING` triggers on each source table.
- `getActivityFeed` reads only from `activity_events` once backfilled.
- Old read-through code is removed (not kept as a fallback — dual-read is its own bug factory).

## Idempotency strategy (forward-looking)

When the ledger arrives, the dedupe key is `(source, source_id, event_type)`. For sources where the source row itself can be updated (e.g. a subscription updated multiple times), we emit a new event row per **state change**, with `source_id = "${subscription_id}#${updated_at_epoch_ms}"`.

This is forward-looking only; v1 inherits dedupe behaviour from the underlying tables.

## How v1 prevents slow queries

See `getActivityFeed` performance guardrails:

- Per-source `.limit(N)` **before** union (default 50/source).
- Hard max date window: **31 days**. Larger ranges → 400.
- Cursor pagination over `(created_at desc, id desc)`.
- No cross-table free-text search; the `q` param is dispatched per source and union'd.
- Per-source try/catch → failed source logs to `ops_alerts` and the UI shows a partial-feed warning; the rest of the feed renders.
- Slow-source warning if any single source takes > 250ms (dev only).
- Migration ensures `created_at desc` indexes exist on every source table the union touches.

## How v1 evolves into public analytics

Public anonymous analytics ships as **its own** separate capture path — never written into operational tables — see `docs/privacy/public-analytics-v1-1-plan.md`. Possible end states once that lands:

- Anonymous events live in PostHog (recommended in v1.1 plan); admin views call a thin PostHog query proxy.
- A small `public_analytics_events` rollup table holds aggregate counts (top profiles, top searches) and is written by a nightly job from PostHog or from a Supabase capture pipe with consent.
- The global activity feed remains operational-only; public analytics gets its own surface inside `/admin/activity` as additional right-rail widgets (visible only once anonymous capture is consented and enabled).

## What this decision is NOT

- Not a commitment to keep read-through forever.
- Not a deprecation of any existing admin page (Billing Console, Verification queue, Support inbox stay as-is — they are write-paths).
- Not a billing source of truth — see "Final conditions" in the v1 approval: activity is **display intelligence only**; billing truth remains Stripe + subscriptions mirror + `payment_events` + `disputes`.
- Not a public-visibility decision input — public visibility continues to be governed by the Stripe/public-visibility contract.
