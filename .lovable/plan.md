## One source of truth — provider display name

Currently the sidebar/avatar/header read `profiles.full_name` ("Diverse Trainers" — set at signup and never touched again), while the Profile → Identity row and public `/t/<slug>` page read `profiles.business_name` ("Test Profile" — the approved public trading name). For provider accounts we treat `business_name` as the single source of truth and stop showing `full_name` in chrome.

Rule: **if `profiles.business_name` is set, use it as the display name; otherwise fall back to `full_name`, then email.** Individuals (PT/coach) never have `business_name` set, so their behaviour is unchanged. Providers always have it once the name-change flow has approved a name.

### Changes

1. **`src/hooks/use-account-menu.ts`**
   - Extend the profile query to also select `business_name`.
   - `resolvedName = business_name?.trim() || full_name?.trim() || user.name || user.email || "Account"`.
   - No other logic changes.

2. **`src/lib/admin/impersonation.functions.ts` — `getImpersonationStatus`**
   - Add `business_name` to the `profiles` select.
   - `name: profile?.business_name ?? profile?.full_name ?? 'Professional'`.
   - This fixes the "Viewing as …" chip + sidebar name during admin impersonation.

3. **`src/routes/admin_.members_.$userId.tsx`** — already resolves `displayName = isProvider ? business_name : full_name`. Keep as-is.

4. **Nothing else changes.** `full_name` stays as a stored column and continues to power internal surfaces that name the *person* who owns the account (email templates, prospects table, campaign name lookups). Only the visible chrome for the signed-in provider swaps.

### Not doing

- No DB migration, no backfill, no delete of `full_name`.
- No changes to the Profile → Identity row (it already reads `business_name` via the name-change flow).
- No changes to public-facing pages (`/t/<slug>` already uses `business_name`).

### Verification

- Typecheck.
- Reload `/dashboard/profile` while impersonating this provider — sidebar footer, header avatar and "Viewing as …" chip should all read **Test Profile** (matching the Identity row + public page). Rename via Verification and confirm the whole chrome updates after refresh.
