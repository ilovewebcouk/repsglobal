# Plan — Trim Admin Overview chrome

## 1. Drop the Ops Header

Remove the entire `OverviewOpsHeader` block from `/admin` (both the red **alerts banner** and the 5-tile **status strip**). The Overview becomes: title row → KPI strip → charts.

- Delete `src/components/admin/OverviewOpsHeader.tsx`
- Delete `src/components/admin/OpsAlertsBanner.tsx`
- Delete `src/components/admin/SystemStatusStrip.tsx` (only used by the header)
- Remove the import and the `<OverviewOpsHeader />` line from `src/routes/admin.tsx`

The 487-emails-in-DLQ alert stops being surfaced on the Overview. That's the explicit tradeoff — if it matters later we can wire a single discreet badge somewhere instead, but it's gone for now.

## 2. Strip the "Reconcile →" link from every KPI tile

`TileShell` in `OverviewKpis.tsx` currently renders a "Reconcile →" link in the top-right corner of each of the 4 KPI cards. Remove it entirely — the prop, the JSX branch, and the `ReconcileLink` import. Tiles become clean: icon · label · value · sparkline.

## 3. Reorder the 4 KPI tiles

Current order: Active paying · Revenue received · Projected cash due · Total revenue.

Proposed new order (left → right, money-first):

1. **Revenue received** (period actual — what landed in the bank)
2. **Total revenue** (period gross — including refunds/disputes)
3. **Projected cash due** (forward-looking — next 30d / 60d / 90d toggle stays)
4. **Active paying members** (the "who" behind the money)

Rationale: an admin overview should read **money first, members second**. Today the page leads with member count, which is a vanity number; revenue is the lead metric on every world-class billing dashboard (Stripe, Paddle, ChartMogul, Baremetrics).

## 4. What stays

- The KPI period selector ("Last 30 days") in the top-right
- The `RevenueAndMembership` block (revenue chart + members-by-tier chart) below the KPI strip — unchanged
- The pinned `MemberFinder` in the top bar — unchanged

## Out of scope
- A new `/admin/emails` page (we'll do that when you want a DLQ surface; for now you can still query `email_send_log` directly)
- Changing the sparkline / delta calculations on the tiles
- Touching the charts below the KPI strip

## After this ships
The Overview is: heading → 4 clean money-first KPI cards → revenue chart + members chart. No banner, no status pills, no "Reconcile →" noise.
