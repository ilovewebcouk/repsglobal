# Kill the ghost data — one provider name, everywhere

Full audit of every column and file that touches a training-provider name is complete. Two problems to resolve in one pass:

1. **Provider name drift** — `profiles.full_name` is documented as the canonical field, but two other columns (`professionals.legal_entity_name`, `professionals.identity_verified_name`) still leak into the UI, PDFs, and emails. Plus two dead columns (`trading_name`, `display_name`) that were dropped from the DB are still referenced in code, silently returning nulls.
2. **Silent `/auth` failure** you reported — Supabase's `signInWithPassword` returned no error object for this specific case, so nothing surfaced under the form. We need a defensive fallback.

The two `demo-org-*` seeded rows are NOT drifted (email/full_name match "Forge Strength Institute" and "Northline Fitness Academy"). The only truly stale row is `…002`, which someone manually edited for testing after the seed.

## What "one source of truth" means (locking it in)

**Canonical display name for every training provider, everywhere: `profiles.full_name`.**

Other columns keep narrow, non-display roles:
- `professionals.identity_verified_name` — KYC audit trail only. Used by identity-verification review screens as "the name on the passport/ID" (labelled as such), and by insurance matching. **Never** as a display name or fallback for provider name.
- `professionals.legal_entity_name` — retired from display entirely. Kept as a nullable compliance field for future contracts/invoicing if needed. Nulled out on the drift row.
- `profiles.business_name`, `profiles.display_name`, `professionals.trading_name` — dead / dropped. Purge remaining references and drop the last surviving column (`business_name`) if it's still there.

## The 8 fixes (single PR)

### A. Provider-name reads → `profiles.full_name` only

| # | File | Change |
|---|---|---|
| 1 | `src/lib/certificates/certificates.functions.ts:903-929` `resolveProviderNames()` | Drop `legal_entity_name` from the select and the priority chain; return `profiles.full_name` only. This alone fixes `/admin/certificates` listing, batch PDFs, print queue, and downstream `provider_name` at lines 989/1063/1427. |
| 2 | `src/components/admin/verification/AdminProviderQualificationsTab.tsx` (lines 180-181, 313, 371, 761-762, 857, 973) + `src/lib/qualifications/qualifications.functions.ts:789,818,829,849` | Change queries to join `profiles.full_name`; replace all `legal_entity_name \|\| identity_verified_name \|\| "Unnamed"` fallbacks with `full_name`. |
| 3 | `src/lib/verification/provider-domain.functions.ts:143,244` | Domain-verification confirmation email `providerName` → `profiles.full_name`. |
| 4 | `src/lib/verification/insurance.functions.ts:85` | Flip fallback: `full_name ?? identity_verified_name`. Keep `identity_verified_name` in matching (`nameSimilarity`) unchanged — that's the whole point of the column. |
| 5 | `src/lib/onboarding/nudge-dispatcher.functions.ts:116,194` | `extractFirstName()` derives from `profiles.full_name`. |
| 6 | `src/lib/cpd/cpd.functions.ts:180-183` | Confirm downstream render — if it displays a provider name, switch to `full_name`; if it's KYC-scoped, label it as verified identity name explicitly. |

### B. Delete dead references to dropped columns

| # | File | Change |
|---|---|---|
| 7 | `src/routes/admin_.verification.tsx:391` | Remove `trading_name` fallback (column dropped 20260617). |
| 8 | `src/lib/campaigns/outbound.functions.ts:171,180` | Remove `trading_name` lookups (currently silently null). Use `full_name` if a name is needed for CSV export. |
| 9 | `src/mockups/legacy-admin/admin_.verification.tsx:308` | Delete this legacy mockup file — no longer referenced. |

### C. Fix the drift row

10. Migration: null out `professionals.legal_entity_name` on row `11111111-…-002` (the only actual drift row — the two `demo-org-*` seed rows are fine).

### D. Retire `profiles.business_name` (last dead name column)

11. Migration: `ALTER TABLE public.profiles DROP COLUMN IF EXISTS business_name;` — added in migration `20260613182803` alongside `display_name`; `display_name` was dropped in `20260709152109` but `business_name` was missed. Demo seed writes to it (still runs fine because Postgres ignores writes to dropped columns via `IF EXISTS`? No — actually `INSERT` to a dropped column fails). So we also update `supabase/migrations/20260706132157_*.sql`? No — never edit past migrations. Instead: drop the column AND add a follow-up migration that no-ops the seed by leaving `business_name` alone. Cleanest path is a single migration that drops the column; the seed is idempotent-guarded by `ON CONFLICT DO NOTHING` so re-runs won't hit it.

    We'll verify against the live schema first before dropping (audit couldn't confirm — noted as an open question).

### E. Fix the silent `/auth` error

12. `src/routes/auth.tsx:131-179`:
    - Add an explicit `if (!signInError && !data?.user)` guard — if Supabase returns neither an error nor a user (edge case that just bit you), set a friendly error: *"Sign-in didn't complete. Please try again."*
    - Also wrap the whole `try` in a `finally` guarantee that if `loading` was cleared but no error and no navigation happened, we show a generic fallback error rather than a silent no-op.
    - No visual redesign — reuses the existing `<Alert>` component at line 332.

## Verification (must all pass before saying "done")

1. `rg 'legal_entity_name' src/` returns **only** the KYC/audit write paths — zero display reads.
2. `rg 'trading_name|display_name|business_name' src/ supabase/migrations/*.sql` — remaining hits are schema (drop statements) or historical migrations only.
3. `psql \d professionals` and `\d profiles` — confirm only `full_name` (profiles) and `identity_verified_name`, `legal_entity_name` (professionals) remain as name-ish columns.
4. Manual: `/admin/certificates` shows "Test Profile" (or whatever `full_name` is) on the drift row, not "Forge Strength Institute Ltd".
5. Manual: log in with a bad password at `/auth` — red error visible under the form.
6. Playwright: sign in as `demo-org-forge@repsuk.org` with a known password → lands on dashboard (proves the account itself is fine — the earlier "silent reject" was likely wrong password + a Supabase edge case).

## Not in scope

- Redesigning `/admin/certificates` or `/admin/verification` layouts.
- Changing what `identity_verified_name` stores or how KYC captures it.
- Restoring the demo row `…002` to its original Forge identity (separate decision — this plan only nulls the stale `legal_entity_name` and leaves everything else as-is).
- The unrelated hydration warning in console logs (`data-lov-mode="selection"` — that's Lovable editor chrome, not our bug).

## Then and only then

I'll respond "audit complete, one source of truth confirmed" with the verification checklist output pasted. Not before.
