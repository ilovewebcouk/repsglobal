## Goal

Fold migrated Brilliant Directory members into the Verified tier everywhere on `/admin/memberships`, and make the forecast chart tooltip show Total + per-tier breakdown only (Verified, Pro, Studio).

BD members are Verified — full stop. They just don't have a live Stripe subscription yet. The app treats their renewals as scheduled Verified payments.

## Changes (UI + server shape only — no Stripe calls, no migration logic, no public routes)

### 1. `src/lib/admin/memberships.functions.ts` — `getRevenueForecast()`
- Remove the separate `scheduled` series from the returned monthly buckets.
- For each month, add legacy/BD Verified renewals into the `verified` bucket instead of a `scheduled` bucket.
- Keep `total = verified + pro + studio`.
- Return shape per month: `{ month, total, verified, pro, studio }` (drop `scheduled`).

### 2. `src/lib/admin/memberships.functions.ts` — `getMembershipMetrics()`
- Tier card for Verified: collapse "Active" + "Scheduled" into a single Verified count (still allowed to show a small secondary line like "incl. N awaiting Stripe setup" inside the Verified card only — but no separate tier, no separate KPI, no "BD" label anywhere).
- Remove any "Verified pending billing" framing from KPIs.

### 3. `src/routes/admin_.memberships.tsx` — chart
- Remove the `scheduled` Line / Area from the Recharts chart.
- Keep three tier lines: Verified, Pro, Studio (+ existing Total line if present).
- Custom dark tooltip rows, in this exact order:
  1. **Total** (projected cash due that month) — bold, white
  2. Verified — orange dot
  3. Pro — tier colour
  4. Studio — tier colour
- No "Scheduled" row. No "BD" row. No "Projected vs Scheduled" split.

### 4. `src/routes/admin_.memberships.tsx` — monthly forecast table
- Drop any Scheduled column.
- Columns: Month · Verified · Pro · Studio · Total (+ existing quarterly subtotal rows).

### 5. Copy sweep on the page
- Remove the words "Scheduled", "BD", "Brilliant Directory", "migrated", "legacy" from any user-visible label on `/admin/memberships`.
- Verified tier card may keep one subtle secondary line: "Includes N members awaiting Stripe setup" (internal-only language, no BD branding).

## Out of scope
- No changes to `/admin/payments`, `/admin/stripe`, public routes, checkout, or BD migration logic.
- No Stripe API calls on page load. No Stripe writes.
- `legacy_stripe_link` / `bd_member_seed` tables stay as-is — only the aggregation/labelling on this page changes.

## Verification after build
- Hover the forecast chart → tooltip shows Total + Verified + Pro + Studio only.
- Verified count = active Stripe Verified + legacy Verified (one number).
- No occurrence of "Scheduled" / "BD" / "Brilliant Directory" on `/admin/memberships`.
- No new Stripe calls in network tab on page load.
