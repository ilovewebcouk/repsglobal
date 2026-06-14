# Skip the /checkout review page — go straight to Stripe

## Goal
Pricing button → (auth check) → Stripe Hosted Checkout. No intermediate REPs screen.

## New flow
```
/pricing  →  createCheckoutSession()  →  window.location.assign(stripe_url)  →  /checkout/return
```
Unauthenticated users still detour through `/auth?tier=…&period=…&next=checkout`, but `next=checkout` now triggers the server call directly (no `/checkout` stop).

## Changes

### 1. `src/components/pricing/PricingPlans.tsx`
- `handlePaidCta`: if signed in, call `createCheckoutSession` server fn directly and `window.location.assign(url)`. If not, keep current `/signup` (or `/auth`) redirect with `next=checkout`.
- Keep the button's `Loader2 / Redirecting…` state through the redirect (don't clear `checkoutTier` in `finally` — only on error).
- Surface server errors via `toast.error`.

### 2. `src/routes/auth.tsx` and `src/routes/signup.tsx`
- After successful sign-in/sign-up, when `search.next === "checkout"` and `search.tier`/`period` present: call `createCheckoutSession` and redirect to Stripe URL, instead of navigating to `/checkout`.
- On error, fall back to `/pricing` with a toast.

### 3. `src/routes/checkout.tsx`
- Delete the file. The route disappears from `routeTree.gen.ts` on next build.
- Anyone with a stale `/checkout?...` link: add a tiny redirect-only route OR rely on the not-found boundary → `/pricing`. Recommend the redirect for safety.

### 4. `src/routes/checkout.return.tsx`
- No change. Still the Stripe `success_url` target.

### 5. Cleanup
- Remove unused imports (`Badge`, `RepsWordmark`, `TIERS`, etc.) that only `checkout.tsx` used elsewhere — none expected.
- No DB / server function / webhook changes.

## QA after build
1. Signed-in user clicks "Start 30-day free trial" on `/pricing` → button shows spinner → browser navigates to `checkout.stripe.com/...`. No REPs screen in between.
2. Signed-out user clicks same → lands on `/signup` → completes account → auto-redirects to Stripe.
3. Cancel on Stripe → returns to `/pricing?checkout=canceled`.
4. Complete payment → returns to `/checkout/return` → auto-routes to `/dashboard` after 2s.
5. Old `/checkout?tier=…` URL → 404 or graceful redirect (depending on whether step 3 above includes the safety redirect).

## Out of scope
Stripe products/prices, webhook, subscription table, dashboard, locked Phase 1 screens, marketing pages.
