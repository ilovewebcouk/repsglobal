## What you're seeing

You're right — the reason edits don't propagate is that **`profiles` has three overlapping name columns** and different surfaces read different ones:

| Column | Currently used by | Value on your test row |
|---|---|---|
| `profiles.full_name` | Dashboard hero, support tickets, campaigns, individual-trainer flows | `"Diverse Trainers"` |
| `profiles.business_name` | Sidebar chip, public `/t/<slug>`, provider profile page, admin impersonation, name-change queue | `"Test Profile"` |
| `profiles.display_name` | Not read anywhere in `src/` (dead) | (null) |

Plus `professionals.legal_entity_name` — separate concept, keep.

So "business_name is not being used" is half-true: the *dashboard* and a handful of admin surfaces still read `full_name` for providers instead of `business_name`. Fix = collapse to one column, delete the rest.

## Decision to confirm

**Keep `full_name` as the single name column for every account (individual and provider). Drop `business_name` and `display_name`.**

Why `full_name` (not `business_name`):
- Already used by every individual-trainer flow — no rename there.
- Mirrors `auth.users.raw_user_meta_data.full_name`.
- One column ⇒ dashboard/public/sidebar/admin can never disagree again.

For providers, "full_name" simply stores the trading name (e.g. "Test Profile"). The name-change approval flow writes to that one column.

## Plan

### 1. Data + schema migration (one migration)

```sql
-- Move approved provider names into full_name where they diverge.
UPDATE public.profiles p
SET full_name = p.business_name, updated_at = now()
FROM public.professionals pr
WHERE pr.id = p.id
  AND pr.account_type = 'organisation'
  AND p.business_name IS NOT NULL
  AND p.business_name <> ''
  AND (p.full_name IS DISTINCT FROM p.business_name);

-- Drop the now-redundant columns.
ALTER TABLE public.profiles DROP COLUMN business_name;
ALTER TABLE public.profiles DROP COLUMN display_name;
```

(RLS/GRANTs untouched — column drops don't affect them.)

### 2. Code — collapse every `business_name` reference to `full_name`

All ~15 call sites, batched in one turn:

- `src/lib/dashboard/dashboard.functions.ts` — remove `business_name` from select; `identity.full_name` becomes the sole name; the `profileComplete` check switches to `full_name`.
- `src/lib/verification/provider-name.functions.ts` — read + write `full_name` (both `submitProviderNameChange` first-time-set branch and `reviewProviderNameRequest` approval branch); `getMyProviderNameStatus.approved_name` reads `full_name`.
- `src/lib/profile/provider-profile.functions.ts` — drop the `business_name ?? full_name` fallback, just read `full_name`.
- `src/lib/website/website.functions.ts` — 2 select lists + 2 fallbacks.
- `src/lib/admin/impersonation.functions.ts` — 1 select + 1 fallback.
- `src/hooks/use-account-menu.ts` — drop `business_name` from select + fallback chain.
- `src/lib/support/tickets.functions.ts:783` — flip to `full_name` only.
- `src/lib/campaigns/scheduled-runner.server.ts:182`, `outbound-extras.functions.ts:85` — same.
- `src/components/dashboard/organisation/DashboardHome.tsx:94` + `src/routes/_authenticated/_professional/dashboard.tsx:105` — read `identity.full_name` only.
- Any admin views listing `business_name` in a column selector (name-request queue) — swap to `full_name`.

Regenerated `src/integrations/supabase/types.ts` (auto after migration) will lose `business_name` / `display_name`, so any missed reference will fail typecheck — that's the safety net.

### 3. QA — the broader "unused column" audit

Same-turn deliverable: a written audit at `docs/schema-audit-providers-2026-07-09.md` listing every column on `profiles` (74 cols currently) and `professionals`, marked:

- ✅ Read AND written by app code
- ⚠️ Written but never read (candidate for removal)
- ❌ Neither read nor written (dead)
- 🗂️ Read by BD-migration/legacy code only (mark for future removal, not now)

I run this by grepping `src/` for each column name, cross-referencing SELECT lists and mutation payloads. No columns are dropped from this audit in this turn — you approve the ❌/⚠️ list first, then a follow-up migration clears them.

Columns I already suspect are stale (to confirm in the audit):
- `profiles.avatar_is_ai_generated`, `profiles.avatar_qa_status`, `profiles.avatar_qa_source` — worth checking if still wired.
- `professionals.bd_seed_thin`, `professionals.quality_score`, `professionals.reps_member_id` — BD-migration era, banned from copy but may still be written.
- `professionals.identity_verified_name` / `identity_verified_dob` vs `identity_documents.*` — possible duplication.
- `professionals.legal_entity_name` vs the new single `full_name` — decide whether provider legal name lives in one place.

### 4. Verification after code + migration land

1. `SELECT full_name, business_name FROM profiles LIMIT 1` errors with "column business_name does not exist" — proof no code still references it.
2. Dashboard, sidebar, `/t/test-profile`, admin impersonation, admin name-request queue — all show `full_name` and match.
3. Rename via Profile page → pending banner shows; after admin approve, everywhere updates in one refresh.

## Out of scope this turn

- Actually dropping the ⚠️/❌ columns surfaced by step 3 — done in a follow-up after you sign off on the audit list.
- Any UI/copy change beyond swapping the column name.
- `professionals.legal_entity_name` (kept — different concept: registered company name).

## Files touched

Migration + ~10 `.ts`/`.tsx` files listed under step 2 + one new audit doc `docs/schema-audit-providers-2026-07-09.md`.
