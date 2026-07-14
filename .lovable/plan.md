## Why they appear

`/find-a-professional` queries the `professionals` table with no `account_type` filter (see `src/lib/directory/search.functions.ts` around line 125). Training providers are stored as `professionals` rows with `account_type = 'organisation'` (that's what the separate providers directory uses via `listPublicProviders` in `src/lib/directory/providers.functions.ts`). So organisations get returned alongside individuals — hence "Test Profile" (an org account with the REPS logo) and "Northline Fitness Academy" showing up in the individual pro results.

## Fix

Scope `/find-a-professional` to individuals only by adding one line to the query in `src/lib/directory/search.functions.ts`:

```ts
.in("id", visibleIds)
.eq("account_type", "individual")   // ← add
```

Apply the same filter to the count/aggregate queries in that file (lines ~452, 473, 488) so filter counts stay consistent. Training providers continue to appear on their dedicated providers directory (which already filters `account_type = 'organisation'`).

No UI changes, no schema changes.

## Verification

- Reload `/find-a-professional` — "Test Profile" and "Northline Fitness Academy" are gone.
- Providers directory still lists Northline etc.
- Filter chips / totals still line up with the visible rows.
