## Problem
`startStripeConnect` always creates a **sandbox** Stripe account because it calls `getStripeEnvironment()` from `stripe-client.ts` on the server. That function checks `window.location.hostname`, but `window` is undefined server-side, so it always falls back to `"sandbox"` — even when the user is on `repsuk.org`.

## Plan
1. **Pass environment from client**
   - Update `startStripeConnect` to accept `{ environment: "sandbox" | "live" }` via `.inputValidator()` (same pattern used by billing/credits server functions).
   - Use the passed `data.environment` instead of calling `getStripeEnvironment()` inside the server handler.

2. **Update client call site**
   - In `PaymentsSettingsTab.tsx`, pass `environment: getStripeEnvironment()` when calling `startStripeConnect`.

3. **Clean up the existing test account**
   - Scott Pro's account (`cruz.pt+pro@icloud.com`) currently has a sandbox `connected_accounts` row. After the code fix, delete that row so the next "Connect Stripe" click on `repsuk.org` creates a fresh **live** connected account.

4. **Verify Stripe webhook for live**
   - Confirm the live webhook endpoint in the Stripe dashboard points to `https://repsuk.org/api/public/payments/webhook?env=live` with "Listen to events on connected accounts" enabled.

## Expected result
Clicking **Connect Stripe** or **Continue setup** on `repsuk.org` will create a live Standard account and redirect to live Stripe onboarding.