## Goal

Introduce **one canonical Active Paying Member model** used identically by the admin dashboard, the reconciliation page, and the legacy renewal engine. Stripe subscriptions are no longer the source of truth — they become one of three inputs to a shared, deduped collection.

## 1. New shared module — `src/lib/members/active-paying-member.ts`

Single source of truth. Lives outside `/admin` so the renewal engine can import it without depending on dashboard code.

Exports:

- **Predicates**
  - `isActiveSubscription(sub)` — `environment === 'live'` AND `status ∈ {active, trialing}` AND `tier ∈ {verified, pro, studio}`.
  - `isActiveLegacyLink(link, nowIso)` — `access_expires_at > nowIso`.
  - `isActiveBdSeed(seed, nowIso)` — `bd_next_due_date > nowIso` (the same predicate the renewal engine already uses).

- **Tier helpers**
  - Re-export `TIER_RANK` (Studio > Pro > Verified) plus `tierForLegacy()` / `tierForBdSeed()` returning `'verified'`.

- **`buildActivePayingMemberCollection({ subs, legacyLinks, bdSeeds, authEmailById, nowIso })`** returning:
  ```
  {
    members: ActivePayingMember[],
    counts: {
      stripe_subscriptions,
      legacy_members,
      bd_migrated_members,
      duplicates_removed,
      final_active_members,
    },
    rawRows: ActiveMemberRawRow[],
  }
  ```

### `ActivePayingMember` shape

```
{
  id: string                 // stable: user_id > claimed_user_id > email > bd:<member_id>
  primary_source: 'subscription' | 'legacy_link' | 'bd_seed'
  sources: Array<{ source, source_row_id, tier }>
  tier: 'verified' | 'pro' | 'studio'   // highest-rank wins
  user_id: string | null
  email: string | null
  bd_member_id: string | null
  earliest_activation_at: string        // min(sub.created_at, link.created_at, seed.bd_signup_date)
  merge_reason: 'user_id' | 'claimed_user_id' | 'email' | 'bd_member_id' | null
}
```

### Dedupe ladder

Walk subs → legacy_links → bd_seeds. For each candidate, look up survivors by, in order:

1. `user_id` (subs) / `claimed_user_id` (legacy, bd)
2. lower-cased `email` (subs via `authEmailById`, legacy via `legacy_stripe_link.email`, bd via `bd_member_seed.email`)
3. `bd_member_id` (legacy ↔ bd only)

If matched → merge into existing survivor, record `merge_reason`, append to `sources`, upgrade `tier` if higher rank, keep earliest `earliest_activation_at`, and emit a `rawRow` with `merged_into_member_id` set.
If no match → create new survivor.

### `rawRows`

One row per input record (every sub, every link, every seed), tagged with:
- `source`
- `included_in_total: boolean`
- `exclusion_reason: string | null` (e.g. `"subscription status=canceled"`, `"legacy_link access_expires_at in past"`, `"bd_next_due_date in past"`)
- `merge_reason: string | null`
- `merged_into_member_id: string | null`
- `member_id: string | null` (the surviving member this row contributes to, if any)

`counts.duplicates_removed = (active sub rows) + (active legacy rows) + (active bd rows) − final_active_members`.

## 2. Wire into admin overview

`src/lib/admin/overview.functions.ts`:

- Fetch `subscriptions`, `legacy_stripe_link`, `bd_member_seed` plus an `auth.users` email map (admin client) — same `await import('@/integrations/supabase/client.server')` pattern already used in this file.
- Call `buildActivePayingMemberCollection(...)`.
- `totalMembers = counts.final_active_members`.
- `mix` recomputes from `members[].tier`.
- `membersSeries` keyed by `earliest_activation_at` per member (replaces the current subs-only `joinsByDay`). Forecast logic, revenue, joined/churned all unchanged.

`src/lib/admin/metrics-definitions.ts` re-exports the predicates from `@/lib/members/active-paying-member` so existing imports keep working; internal duplication of the rules is removed.

## 3. Wire into reconciliation

`src/lib/admin/reconciliation.functions.ts`:

- New `getActiveMembersReconciliation()` that runs the same fetch + `buildActivePayingMemberCollection` and returns `{ counts, members, rawRows }`.

`src/routes/admin_.reconciliation.tsx`:

- New **Active Members** section (first under `#members`) with:
  - Summary lines:
    - `Stripe subscriptions  …  X`
    - `Legacy members        …  X`
    - `BD migrated members   …  X`
    - `Duplicates removed    …  X`
    - `Final Active Members  …  X`
  - Three tables grouped by source. Each row shows `included/excluded` badge, `exclusion_reason`, `merge_reason`, link to surviving `member_id`.
- The "Final Active Members" number is asserted (visually) to equal the `/admin` Active Members tile.

## 4. Wire into renewal engine

`src/routes/api/public/hooks/legacy-renewal.ts`:

- Replace its in-file "is this BD seed still active?" / "is this legacy link still active?" checks with `isActiveBdSeed` / `isActiveLegacyLink` imported from `@/lib/members/active-paying-member`.
- No behaviour change — just unifies the predicate. The renewal engine and dashboard can no longer drift.

## 5. Out of scope (explicitly unchanged)

- Revenue Received, Projected Cash Due, Net Member Growth definitions and calculations.
- Database schema (no migrations).
- Renewal engine scheduling/cron behaviour.
- Subscriptions/legacy_link/bd_seed table contents.

## Acceptance

1. `grep -r "ACTIVE_STATUSES\|isActiveSubscription\|bd_next_due_date" src` shows the predicates exist in exactly one implementation (the shared module); other files only import them.
2. `/admin` Active Members KPI === `/admin/reconciliation` Final Active Members (asserted via Playwright screenshot).
3. Reconciliation page lists every subscription / legacy_link / bd_seed row with included/excluded and merge reasons; sum check `(included subs) + (included legacy) + (included bd) − duplicates_removed = final`.
4. Pick 3 users present in both `subscriptions` and `bd_member_seed` → each appears in exactly one survivor row; the other source rows show `merged_into_member_id` with the correct `merge_reason`.
5. Renewal hook still passes its existing smoke test; revenue/forecast/growth numbers unchanged before/after.
