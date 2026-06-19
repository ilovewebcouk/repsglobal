## What's wrong today

When an admin (Scott) uses **Viewing as Cherie Hallett**, the dashboard still shows admin data in three places:

1. **Payments tab** holds the *REPs membership payments* table + *Next renewal* — that's billing, not "payments" (which is Stripe Connect for taking client bookings). Mixing them is confusing.
2. **"No active plan" card** shows `cruz.pt@icloud.com` — that's the admin's email, not Cherie's. The settings server fn reads email from the JWT claims, which never get swapped during impersonation.
3. **Bottom-left sidebar** shows `Scott · cruz.pt@icloud.com · Admin` instead of `Cherie Hallett`. The `MemberCard` reads from `useAccountMenu()`, which only knows about the signed-in admin.

## What we'll change

### 1. Move membership history Payments → Billing

- Remove `<SubscriptionHistoryPanel />` from `PaymentsSettingsTab`. Payments tab becomes Stripe Connect only.
- Render `<SubscriptionHistoryPanel />` at the bottom of `BillingTab` (under Card & invoices), so a member's full picture — plan, card, history, next renewal — lives in one tab.
- Rename the Payments tab subtitle / empty-state copy to make the split obvious:
  - **Billing** → "Your REPs membership, card, invoices and payment history."
  - **Payments** → "Take client bookings and payments through Stripe."

### 2. Fix the email on the "No active plan" card (and everywhere `getMySettings` returns email)

`src/lib/settings/settings.functions.ts` → `getMySettings`:

- When `context.isImpersonating` is true, look up the impersonated user's email via `supabaseAdmin.auth.admin.getUserById(userId)` instead of trusting `claims.email`.
- All other fields already query by the swapped `userId`, so they're correct — only `email` needs fixing.

### 3. Fix the sidebar identity (and any other client-side "I'm signed in as X" chrome) under impersonation

- Add a small hook `useEffectiveIdentity()` that reads `getImpersonationStatus`. When active, return `{ name, email, avatarUrl, tierLabel: 'Viewing' }` for the impersonated professional; otherwise fall back to `useAccountMenu()`.
- Update `MemberCard` in `DashboardShell.tsx` to consume `useEffectiveIdentity()` so the bottom-left card shows **Cherie Hallett · cherie's email** while impersonating, with a subtle `Viewing` badge instead of the admin's `Admin` chip.
- Hide the **Admin console** and **Upgrade to Pro** buttons in the sidebar while impersonating — they're admin chrome that doesn't belong in the "viewing as" view (Exit view is already in the orange banner).

### 4. QA pass for the "Viewing as" experience

Walk the trainer dashboard while impersonating Cherie and fix any remaining leaks:

- Top-right avatar chip (currently shows `SC` — should show Cherie's initials/avatar).
- Any `useAccountMenu()` consumers that render name/email in the dashboard chrome (header, dropdowns, greeting strings like "Welcome back, Scott").
- Settings sidebar account card (already covered by #2).
- Notification preferences / privacy / activity tabs — confirm they query by the swapped `userId` (they do, via `requireSupabaseAuthWithImpersonation`), but spot-check the rendered email/name strings.

This is presentational only; data fetching is already impersonation-aware via the middleware.

## Files touched

- `src/components/dashboard/PaymentsSettingsTab.tsx` — remove `SubscriptionHistoryPanel`, tighten copy.
- `src/routes/_authenticated/_professional/dashboard_.settings.tsx` — mount `SubscriptionHistoryPanel` inside `BillingTab`; update tab subtitles.
- `src/lib/settings/settings.functions.ts` — resolve `email` from `auth.admin.getUserById` when impersonating.
- `src/components/dashboard/DashboardShell.tsx` — `MemberCard` uses new `useEffectiveIdentity()`; hide admin-only sidebar buttons while impersonating.
- `src/hooks/use-effective-identity.ts` (new) — wraps `useAccountMenu` + `getImpersonationStatus`.
- Any header/avatar component that hard-codes `useAccountMenu()` — swap to `useEffectiveIdentity()` (found during the QA pass).

## Out of scope

- No schema / RLS changes — the impersonation middleware already swaps the server-side identity correctly.
- No changes to the £99 renewal rule or the launch billing logic — already handled in the previous turn.
- No new "switch back to admin" UI — Exit view in the orange banner already covers it.
