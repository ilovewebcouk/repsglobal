## Goal

Make the top KPI row on `/admin/professionals` honest and commercially meaningful. Drop "Avg. rating" (reviews aren't real yet), add "Paid members", and tighten subtext on the rest.

Final row:

1. **Active professionals** — confirmed signed-up members
2. **Verified professionals** — `N of M active professionals`
3. **Paid members** — active or trialing subscriptions
4. **New signups, 30d** — `±X% vs prev`

## Changes

### 1. `src/lib/admin/professionals.functions.ts` — `getAdminProfessionalsKpis`

- Remove the `reviews` query and `avgRating` field from the response.
- Add a `paidCount` query: `subscriptions` where `status IN ('active','trialing')` AND `tier <> 'free'`, counted as distinct `user_id`. Read via `supabaseAdmin` (admin RPC already used here).
- Keep `activeCount`, `verifiedCount`, `verifiedPct`, `newSignups30`, `newSignupsDeltaPct`.
- Optional follow-up flagged below: `activeCount` currently passes `_only_published: true` to `count_confirmed_professionals`. Per your definition ("confirmed signed-up members"), unpublished but confirmed pros should also count, and the Verified subtext "N of M active" only reads right when both share the same denominator. **Question A below.**

### 2. `src/routes/admin_.professionals.tsx` — KPI card config (~lines 247–275)

Replace the 4-item `kpis` array:

```
Active professionals
  value: activeCount
  delta: "Confirmed signed-up members"

Verified professionals
  value: verifiedCount
  delta: `${verifiedCount} of ${activeCount} active professionals`

Paid members
  value: paidCount
  delta: "Active or trialing subscriptions"

New signups (30d)
  value: newSignups30
  delta: `${±}${newSignupsDeltaPct.toFixed(1)}% vs prev 30d`  (unchanged)
```

Also update the "Active professionals" subtext — today it shows `+N this month`, which duplicates the New signups card. Switching it to "Confirmed signed-up members" removes that duplication.

No schema changes, no Stripe changes, no UI structure changes — just KPI swap and copy.

## Out of scope

- Avg rating, LTV, renewal due, MRR, insurance/identity/qualifications KPIs — stay as columns/filters/secondary panels.
- Trialing breakout as its own card (you ruled it out for this page).
- Any change to the table, filters, invite flow, or Stripe wiring.

## Open question

**A.** Should "Active professionals" count all email-confirmed pros, or only published ones?
- **All confirmed** (recommended): matches your wording "confirmed signed-up members"; Verified subtext "9 of 400" reads correctly; unpublished-but-confirmed pros (mid-onboarding) still count as register size.
- **Published only** (current behaviour): stricter, but means the Verified % denominator excludes pros who haven't published a profile yet.
