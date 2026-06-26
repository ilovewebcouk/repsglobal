## Goal

Tighten "REPS Verified" so it requires **ID + qualification + in-date insurance**. If any one lapses, the badge comes off automatically and the pro stops appearing under the directory's "Verified" filter / featured rail.

Answering your question directly: **yes — under the current code you are "Verified" on the badge even with no insurance on file. After this change, you will not be.**

## Single source of truth

Add one SQL helper so every surface agrees:

```sql
-- supabase/migrations/<ts>_pro_fully_verified.sql
CREATE OR REPLACE FUNCTION public.is_pro_fully_verified(_pro_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = _pro_id
        AND p.verification = 'verified'
        AND p.identity_status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.insurance_policies ip
      WHERE ip.professional_id = _pro_id
        AND ip.status = 'active'
        AND ip.expiry_date >= CURRENT_DATE
    );
$$;
GRANT EXECUTE ON FUNCTION public.is_pro_fully_verified(uuid) TO anon, authenticated;
```

Identity approval already covers the qualification bundle (a verification submission contains both, and `verification='verified'` only flips when an admin approves that bundle), so this is the full 3-of-3 check.

## Wire it up

1. **Public profile badge** — `src/lib/profile/public-profile.functions.ts:202`
   `trust.verified` becomes:
   `(verification === 'verified') && (identity_status === 'approved') && Boolean(insuranceRow)`
   (`insuranceRow` is already restricted to `status='active'` and `expiry_date >= today`, lines 128–136.)

2. **Directory search "Verified" filter** — `src/lib/directory/search.functions.ts:125–126`
   Replace the two `.eq()` calls with `.in('id', ids_from_rpc)` where `ids_from_rpc` is filled by calling `is_pro_fully_verified` for the candidate set. Simpler alternative I'll use: change the predicate to an inner join filter via `professionals.id` ∈ subquery — implemented by a second small RPC `list_fully_verified_pro_ids()` returning the id set, called once per search and used as `.in('id', ids)`.

3. **Featured rail** — `src/lib/directory/featured.functions.ts:118`
   Same approach: swap `.eq("verification","verified")` for `.in("id", list_fully_verified_pro_ids())`.

4. **Counts** — `src/lib/directory/counts.functions.ts:29`
   Same swap.

5. **`verifiedRank` sort key** — `src/lib/directory/search.functions.ts:239`
   Compute from the same id-set (`fullySetHas(row.id) ? 1 : 0`) so ranking matches the badge.

## What stays the same

- Admin moderation flow, schema, and `verification` enum are unchanged — no migration on `professionals`.
- Insurance UX (upload, expiry, Trust card) is unchanged.
- The dashboard "Verification status" surfaces stay as-is — they already show identity/qualification/insurance individually.

## Files touched

- `supabase/migrations/<ts>_pro_fully_verified.sql` (new — adds two functions: `is_pro_fully_verified`, `list_fully_verified_pro_ids`)
- `src/lib/profile/public-profile.functions.ts`
- `src/lib/directory/search.functions.ts`
- `src/lib/directory/featured.functions.ts`
- `src/lib/directory/counts.functions.ts`

No UI/visual changes — only the rule behind the badge.
