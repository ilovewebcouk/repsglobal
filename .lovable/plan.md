# QA pass: make the training-provider dashboard actually reachable

The unlock landed but there are three blockers plus a test-data gap that stop you from seeing it end-to-end. This plan fixes each.

## Blockers

### 1. Identity gate hides the provider website editor
`src/routes/_authenticated/_professional/route.tsx` renders `IdentityGateWall` for any route not in `GATE_ALLOWLIST` when identity isn't approved. `/dashboard/provider-website` isn't allowlisted, so a training provider without an approved identity gets bounced away from the very page they're supposed to use.

**Fix:** add `/dashboard/provider-website` to `GATE_ALLOWLIST`. Verification is still surfaced in the training-provider sidebar, so they can complete it — but the gate no longer hides the editor itself.

### 2. Admin impersonation narrows tier to verified/pro/studio
`getImpersonationStatus` in `src/lib/admin/impersonation.functions.ts` collapses any tier that isn't `verified | pro | studio` to `"verified"`. When you impersonate a training-provider account for QA you get the Verified sidebar and the coach dashboard — never the provider one.

**Fix:** widen the tier union in the server function's return to include `"training_provider"`, and treat it the same way as the other paid tiers in the narrowing. Also widen the type on the client:
- `getImpersonationStatus` return: `tier: 'verified' | 'pro' | 'studio' | 'training_provider'`.
- `_professional/route.tsx` `beforeLoad` already accepts the impersonation tier verbatim, so no change there once the server side widens.

### 3. Account menu label + effective identity are hard-coded to Core/Pro/Studio
`use-account-menu.ts` narrows the account tier to `verified/pro/studio` and `use-effective-identity.ts` labels anything that isn't Pro/Studio as "Core". A training provider therefore sees "Core" in the sidebar footer badge and account menu.

**Fix:**
- `AccountTier` type: add `"training_provider"`.
- Include `training_provider` in the LIVE-tier check so `role` resolves for those accounts.
- `labelForRole`: return "Training provider" for training_provider.
- `use-effective-identity.ts`: label `training_provider` as "Training provider".

## Test-data gap

You almost certainly have no `training_provider` subscription in the DB, which is the real reason nothing shows for you today.

**Fix — admin QA path:** add a small admin action so you can flip a professional account to the training-provider plan for testing without touching Stripe. Two options in the plan — pick one when you approve:

- **A. Admin-only "Set plan to Training Provider" button** on `/admin/members` for a selected member. Server-side action upserts `subscriptions` with `tier='training_provider'`, `status='active'`, and sets `professionals.account_type='organisation'`. Guarded by `has_role(admin)`.
- **B. Impersonate-only override**: add a "Preview as: Training provider" toggle inside the admin impersonation start dialog, which just sets the impersonation tier without touching the DB. Non-destructive; disappears when impersonation ends.

Default recommendation: **A**, because it lets you exercise the real gate (`_professional/route.tsx` PAID_TIERS + isPaid check) end-to-end. **B** never touches the gate.

## Out of scope
- Public `/pricing` page for the training-provider plan.
- `provider_websites` persistence schema.
- Redesigning the placeholder provider-website editor sections.

## Files touched
- `src/routes/_authenticated/_professional/route.tsx` (allowlist)
- `src/lib/admin/impersonation.functions.ts` (tier union)
- `src/hooks/use-account-menu.ts` (tier + label)
- `src/hooks/use-effective-identity.ts` (label)
- Admin test action: either `src/routes/admin_.members.tsx` + a new `src/lib/admin/set-training-provider-plan.functions.ts` (option A) **or** the existing impersonation start flow (option B).
