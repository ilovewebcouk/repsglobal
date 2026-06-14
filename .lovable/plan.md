## What I found

- **The AI credits purchase is a separate checkout flow** from the subscription flow.
  - UI entry: `src/components/dashboard/CreditsPanel.tsx:144-155`
  - Dedicated route: `src/routes/_authenticated/_professional/checkout_.credits.tsx:15-169`
  - Server checkout creation: `src/lib/credits/credits.functions.ts:59-109`
- **There is no recovery/sync step for credit top-ups after payment.**
  - Top-ups return straight to `/dashboard/settings?topup=success...` in `src/lib/credits/credits.functions.ts:81-82`
  - But `src/routes/_authenticated/_professional/dashboard_.settings.tsx` does not read `topup` or `session_id` at all.
  - Unlike subscriptions, credits do **not** go through `/checkout/return` + `/dashboard/syncing` with a retry/reconcile path.
- **That means a successful Stripe payment can still look broken** if the webhook is slow or missed, because the user is dropped back on Settings with no confirmation, no polling, and no manual reconciliation.
- **The database currently shows zero credit wallet / credit transaction rows**, so the top-up write-back is not happening yet, or no successful credit payment has completed.
- **The dev runtime has a real route integrity problem around checkout**:
  - Vite logs show repeated SSR failures trying to load a deleted file: `/src/routes/checkout.tsx`
  - This is consistent with the “middleman page again” symptom and means checkout routing is not fully clean.
- **Stripe host/environment selection is brittle**:
  - `src/lib/billing/stripe-client.ts:9-26` only treats `repsuk.org` and `www.repsuk.org` as live.
  - Your known app URLs include `staging.repsuk.org` and `repsglobal.lovable.app`, which currently fall back to **sandbox/test**.
  - If you expect live checkout on those hosts, it will be wrong.
- **Checkout origin fallback is also risky**:
  - `src/lib/billing/stripe.server.ts:66-80` falls back to `https://repsglobal.lovable.app` if request origin is absent.
  - That can create a cross-domain handoff / “middleman” feel instead of returning cleanly to the current host.

## Fix plan

### 1. Repair checkout route integrity first
- Remove the stale `/checkout.tsx` route reference causing SSR/dev-server errors.
- Verify there are no remaining imports, links, route IDs, or generated tree mismatches pointing at a plain `/checkout` page.
- Re-validate that only the intended routes exist:
  - `/checkout/return`
  - `/checkout/credits`

### 2. Fix environment and return-origin detection
- Update host detection so the correct Stripe mode is used on every intended domain.
- Stop relying on a brittle fallback that can send users to the wrong host after checkout.
- Make return URLs consistently use the active site origin for both subscription checkout and credit top-ups.

### 3. Rebuild the AI credits post-payment flow so it is fault-tolerant
- Replace the passive `?topup=success` return with a proper return/sync experience.
- Add a credits-specific post-checkout state that:
  - confirms payment is received,
  - polls for wallet update,
  - shows a real success state when credits land,
  - shows a controlled timeout/retry state instead of silently failing.
- Add a manual recovery path for top-ups similar to the subscription recovery pattern when webhooks lag.

### 4. Verify and harden Stripe top-up creation
- Validate that all credit pack lookup keys resolve correctly in the intended Stripe environment:
  - `credits_small`
  - `credits_medium`
  - `credits_large`
- Improve error surfacing so failures like missing lookup keys, wrong environment, or missing checkout URL are visible in the UI instead of appearing as a broken redirect.

### 5. Verify webhook processing for top-ups end-to-end
- Confirm `checkout.session.completed` with `kind=credit_topup` reaches the webhook.
- Confirm `grant_credit_topup` writes to:
  - `credit_wallets`
  - `credit_transactions`
- Add enough logging / instrumentation to distinguish:
  - checkout never created,
  - payment completed but webhook failed,
  - webhook succeeded but UI never refreshed.

### 6. Do a real QA pass after the fixes
- Test the AI credits purchase from the dashboard.
- Confirm the path is:
  - click pack
  - dedicated checkout page
  - Stripe hosted checkout
  - correct return route
  - credits visible in wallet
  - transaction visible in history
- Test cancel flow and retry flow.
- Test on the actual domains that matter so mode/origin bugs are caught.

## Technical details

Files most likely to change:
- `src/lib/billing/stripe-client.ts`
- `src/lib/billing/stripe.server.ts`
- `src/lib/credits/credits.functions.ts`
- `src/routes/_authenticated/_professional/checkout_.credits.tsx`
- `src/routes/_authenticated/_professional/dashboard_.settings.tsx`
- possibly a new dedicated credits return/sync route

Files already implicated by QA:
- `src/components/dashboard/CreditsPanel.tsx`
- `src/routes/checkout.return.tsx`
- `src/routes/_authenticated/_professional/dashboard.syncing.tsx`
- `src/routes/api/public/payments/webhook.ts`

## Expected outcome

After this, the AI credits checkout should either:
- complete cleanly and show the wallet update, or
- fail with a precise, visible reason.

No more ambiguous middleman handoff, no silent success-with-zero-credits state, and no stale checkout route instability.