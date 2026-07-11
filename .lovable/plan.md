## What the two long numbers actually are

In the Batches list, each row currently shows three lines:

```
Test Profile / <provider UUID>      ← bold: provider_name ?? provider_id
1 × £15.00 = £15.00 · printed_and_digital
<batch UUID>                        ← dim mono: batch id
```

- **Bold long number (`11111111-…002`)** — the *training provider's user id*. It's the fallback in `provider_name ?? provider_id`. It appears whenever `adminListBatches` can't resolve a display name for the provider. This should be the training provider's name (business/trading name), not a UUID.
- **Dim mono number (`91fb10cf-…`)** — the *batch id*. Only useful for support/debug, not for admins scanning the list.

## Why the provider name is missing

`adminListBatches` reads `profiles.full_name` via the *user-scoped* Supabase client (`requireSupabaseAuth`). For this batch, `profiles.full_name` is `"Test Profile"` in the DB, so either:
1. Profiles RLS is filtering out other users' profile rows for the admin session (most likely — admins read via `has_role`, but the policy may not cover this SELECT), or
2. The provider genuinely has no `full_name` set.

Either way, the current fallback (raw UUID) is wrong. The training-provider display name should come from the professional record (business/trading name), not `profiles.full_name`, since providers are organisations.

## Plan

1. **Fix the name source in `adminListBatches`** (`src/lib/certificates/certificates.functions.ts`)
   - Look up provider display name from `professionals` (business/trading name — check the actual column, likely `business_name` / `display_name` / `trading_as`) with a fallback chain: `professionals.business_name → profiles.full_name → email → "Unknown provider"`.
   - Do the lookup with `supabaseAdmin` (loaded inside the handler) so RLS on `profiles`/`professionals` can't hide rows from admin views.
   - Apply the same fix to `adminListPrintQueue` and any sibling admin fn that maps `provider_id → provider_name` (lines ~957, ~1035, ~1403).

2. **Clean up the Batches row UI** (`src/routes/admin_.certificates.tsx`, ~line 337–370)
   - Line 1: provider display name (always human-readable now).
   - Line 2: `N × £price = £total · format` (unchanged).
   - Line 3: keep the batch id but move it behind a small "Batch ID" label and shorten to the first 8 chars with a copy-on-click / tooltip showing the full id — no more naked UUID as a headline.
   - Remove the tracking line's redundancy where it duplicates info.

3. **QA pass**
   - Verify column names on `professionals` before wiring the fallback.
   - Load `/admin/certificates → Batches` as admin, confirm the seed batch shows "Test Profile" (or the provider's business name) instead of a UUID.
   - Check `pending`, `paid`, `awaiting_print`, `dispatched` filters all render names correctly.
   - Confirm Print queue rows show the same provider name.

## Out of scope

- No schema changes, no changes to how batches are created, priced, or dispatched.
- No changes to member/professional-facing certificate UI.
