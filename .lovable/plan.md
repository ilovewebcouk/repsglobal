## Goal

The manual Core-invite flow (`/admin/core-invites` → `billing_setup_tokens.kind='admin_core_invite'` → `/activate/$token` → Stripe setup → webhook) was only ever used to onboard Barrend Cathline and Derek Pryor. Both are done (Derek deleted). Going forward, Core members self-signup via `/auth` + Stripe Checkout, so this whole flow gets deleted.

The separate `admin_pro_invites` / `sendProfessionalInvite` / `createProvider` (training-provider) flows are **not** touched — they are still live.

## Files to delete outright

- `src/routes/admin_.core-invites.tsx` — the Admin → Core invites page
- `src/routes/activate.$token.tsx` — the `/activate/$token` page + its 3 server fns
- `src/lib/admin/core-invites.functions.ts` — `createCoreInvite` / `sendCoreInvite` / `resendCoreInvite` / `revokeCoreInvite` / `listCoreInvites` / `previewCoreInvite` / `verifyStripeCustomer`
- `src/lib/email-templates/trainer/invite/core-manual-invite.tsx`

## Files to edit (shared, keep — remove only invite parts)

1. **`src/lib/email-templates/registry.ts`** — drop the `core-manual-invite` import and the `'core-manual-invite': coreManualInvite` entry. Leave `professional-invite` and `admin-invite` alone.
2. **`src/routes/api/public/payments/webhook.ts`** — delete the `else if (session.mode === "setup" && meta.kind === "admin_core_invite")` branch (~lines 696–803) that creates the trialing subscription, publishes the profile, and consumes the token. Leave every other webhook branch alone.
3. **`src/lib/admin/member-stripe-sync.server.ts`** — remove the `billing_setup_tokens.stripe_customer_id` lookup block (lines 36–43) inside `resyncUserFromStripe`. Keep the rest of the resync helper.
4. **Admin nav** — grep `src/components/admin/` for anything linking to `/admin/core-invites` and remove that menu entry. (Inventory found no hits, but I'll double-check before finishing.)

## Database

- **No forward migration in this pass.** `billing_setup_tokens` stays; the `admin_core_invite` value in its `kind` CHECK constraint is harmless once no code writes it, and the table still has reserved `setup` / `reactivate` kinds. If you want a follow-up migration later to narrow the CHECK and drop the invite-only columns/indexes (`client_reference`, `professional_id`, `stripe_customer_id`), we can do that as a separate, standalone change.
- Barrend's existing data rows (`subscriptions`, `professionals`, `auth.users`, `billing_setup_tokens` row) are untouched — his live Core membership keeps working. Nothing in the deleted code path is referenced by ongoing operation of his account.

## Out of scope (call out, don't touch)

- `admin_pro_invites` + `src/lib/admin/invites.functions.ts` (`sendProfessionalInvite`) + `src/lib/admin/providers.functions.ts` (`createProvider`) + `admin-invite` / `professional-invite` email templates — these back the live Pro/Provider invite systems and stay.
- `docs/admin-v2/post-bd-migration-admin-audit-2026-06-28.md` has one stale reference to `billing_setup_tokens` as a metric source; it's already out of date and doesn't need editing now.

## Verification after the cuts

1. `tsgo` typecheck clean (no dangling imports of deleted files).
2. `rg 'core-manual-invite|admin_core_invite|/admin/core-invites|/activate/'` returns zero hits in `src/`.
3. Load `/admin/members` and the admin nav — no broken "Core invites" link.
4. Visit `/activate/anything` → 404 (route gone).
5. Barrend's Member 360 still shows Core tier + Stripe customer/subscription (comes from `subscriptions` table, not the deleted lookup).
