## Make the 24 admin-uploaded training providers live-but-unverified; restore verification gate for future signups

### Goals

1. The 24 training providers admin has already imported become live on `/find-a-training-provider`.
2. They remain "Unverified" in status — they haven't completed the 3-step verification, so the badge stays unverified on public + admin surfaces. No fake approvals.
3. Future Stripe signups only appear publicly after clearing the full verification flow — original behaviour restored.
4. Remove the temporary "Live" switch column from `/admin/members` → Training Providers.

### Investigation summary

- Exactly 24 `professionals` rows have `account_type='training_provider'` — matches admin's import count.
- Original public gate required TPs to have `identity_status='approved'` + `provider_domain_verifications.status='approved'`. Last change relaxed that globally — we'll restore it and add a narrow admin-seeded exemption instead.
- Faking `identity_status='approved'` would flip their public badge to verified, which the user explicitly does not want.

### Changes

**1. New column `admin_seeded_public` on `professionals`** (migration)

- `admin_seeded_public boolean NOT NULL DEFAULT false`.
- Meaning: "admin has manually placed this row on the public directory pre-verification". Only ever set by admin backfill/import scripts. Signup / Stripe checkout never sets it.

**2. Restore the visibility gate with a narrow exemption** (migration)

Rewrite `list_publicly_visible_pro_ids` and `is_pro_publicly_visible` back to the pre-toggle form for real accounts, but treat `admin_seeded_public=true` as an alternative to identity+domain approval for training providers only:

```
account_type <> 'training_provider'
OR admin_seeded_public = true
OR (
  identity_status = 'approved'
  AND full_name present
  AND provider_domain_verifications.status = 'approved'
)
```

Everything else (published, non-demo, active subscription) still required. So a self-signup TP without admin seed stays hidden until real verification.

**3. Backfill the 24 admin-uploaded providers** (insert tool)

`UPDATE professionals SET admin_seeded_public = true WHERE account_type = 'training_provider'` (there are 24; no self-signups yet).

Do NOT touch `identity_status` or `provider_domain_verifications` — they stay as-is so the public + admin UIs continue to show "Unverified".

**4. Remove the temporary Live toggle** in `src/routes/admin_.members.tsx`

- Delete `<th>Live</th>` and the `<td>` cell (both marked `TEMP:`).
- Delete `setPublishedFn`, `publishedOptimistic`, `publishM`, `isLive` in `ProRow`.
- Remove `setProfessionalPublished` and `Switch` imports from this file (still used elsewhere).

### Sub-agent verification

After the edits, spawn one read-only sub-agent to:
- Confirm no leftover references to the removed toggle (`isLive`, `publishM`, `publishedOptimistic`, `TEMP: manual publish toggle`, Switch import in this file).
- Dump `pg_get_functiondef` for `list_publicly_visible_pro_ids` and `is_pro_publicly_visible` and confirm both check `admin_seeded_public` as the TP exemption and keep `identity_status`/domain checks otherwise.
- Confirm all 24 TPs now satisfy the gate (appear in `list_publicly_visible_pro_ids()`).
- Confirm none of the 24 have been silently marked `identity_status='approved'` — status must stay unverified.
- Simulate a "future signup": insert a synthetic row with `account_type='training_provider'`, `is_published=true`, active subscription, `admin_seeded_public=false`, unverified identity — confirm it does NOT appear in the RPC. Roll back the insert (or use a transaction the sub-agent reports on).
- Grep public UI (`/find-a-training-provider`, provider profile) for anywhere status is derived, confirm the "Unverified" badge is driven by `verification_status` / `identity_status` and not overridden by anything we changed.
- Report any TP that fails to appear, by slug.

### Not changing

- `/find-a-training-provider` UI unchanged — badge on cards is driven by real verification fields, so admin-seeded rows will keep showing "Unverified".
- Stripe signup / checkout flow unchanged — defaults leave `admin_seeded_public=false`.
- `setProfessionalPublished`, suspend/republish, and admin Member 360 controls unchanged.
- No visual changes to admin members table beyond removing the toggle column.

### Files touched

- `src/routes/admin_.members.tsx` (delete toggle column + related code)
- Migration: add `admin_seeded_public` column + restore RPCs with exemption
- Data update: set `admin_seeded_public=true` for the 24 existing TPs
