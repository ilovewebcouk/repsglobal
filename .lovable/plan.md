## Brutal honest truth

Two separate things going on — only one is what you think it is.

### 1. You are NOT signed up as a client
I checked the database. Your latest account (`cruz.pt+demo1@icloud.com`) is:
- `signup_kind = professional`
- `user_roles = ['professional']`

You ARE a trainer. The reason `/dashboard` punted you back to `/pricing` is **not** a role problem — it's that the new subscription gate on `_authenticated/_professional/route.tsx` (the one we just added) checks for an active subscription row, and there isn't one. So it correctly assumed "unpaid trainer" and bounced you to `/pricing`. That's the gate doing its job — just at the wrong moment.

### 2. Why there's no subscription row
I checked `payment_events` — it's **empty**. Zero events, ever. That means **the Stripe webhook has never reached this app**. Stripe took your payment, Stripe redirected you to `/dashboard?billing=success&session_id=...`, but Stripe never told *us* you paid, so we never wrote the subscription row, so the gate bounced you.

Two things are missing:

**A. Webhook isn't configured (or is pointing at the wrong URL).** This is a Stripe Dashboard setup task, not a code task. The endpoint exists at `src/routes/api/public/stripe/webhook.ts` and `STRIPE_WEBHOOK_SECRET` is set — but Stripe itself needs an endpoint registered pointing at one of:
- `https://repsglobal.lovable.app/api/public/stripe/webhook` (published)
- `https://staging.repsuk.org/api/public/stripe/webhook` (custom domain)

Listening for at least `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`.

**B. Even with the webhook firing, the success-URL hop is racey.** Webhook can take 1–10 seconds. If the user's browser loads `/dashboard` before the webhook lands, the gate sees no subscription → bounces to `/pricing`. We need a sync screen between Stripe and the dashboard.

---

## The plan

### Step 1 — Confirm/set up the Stripe webhook (you, in Stripe Dashboard)
I can't do this for you — it's done inside Stripe. Once I tell you it's missing, you go to **Stripe → Developers → Webhooks → Add endpoint**, paste the URL above, select the 4 events, and copy the signing secret. If the secret matches the `STRIPE_WEBHOOK_SECRET` already in the project, no further code change is needed. If not, I rotate the secret.

### Step 2 — Add a `/dashboard/syncing` screen that handles the race
Currently `success_url` goes straight to `/dashboard`. That route runs the subscription gate immediately and loses the race. Change to:

- `success_url` → `/dashboard/syncing?session_id={CHECKOUT_SESSION_ID}` (set in `src/lib/billing/billing.functions.ts`)
- New route `src/routes/_authenticated/dashboard.syncing.tsx`:
  - Public-feeling "Setting up your account…" screen with REPs branding + spinner.
  - Polls `subscriptions` for the current user every 1.5s, up to ~20s.
  - When a row appears with `status ∈ (active, trialing)` → `navigate({ to: '/dashboard' })`.
  - On timeout → show "Still syncing — this can take up to a minute" with a manual "I've waited, take me to the dashboard" button + support email. Doesn't dump them on `/pricing`.

### Step 3 — Make the subscription gate aware of the sync screen
`_authenticated/_professional/route.tsx` currently redirects no-sub users to `/pricing`. Allow `/dashboard/syncing` through the gate so it can do its job without bouncing.

### Step 4 — Smoke test
After step 1 is confirmed: I'll seed a fresh test signup, you complete checkout in test mode, we verify a row lands in `payment_events` and `subscriptions`, and the syncing screen forwards you to the dashboard within a few seconds.

---

## Out of scope (for this turn)
- The onboarding pop-up inside the dashboard.
- Webhook idempotency hardening (already adequate for now).
- Email receipts (separate task).

---

## What I need from you to proceed
1. Confirm you want me to build Step 2 + 3 now.
2. Check Stripe → Developers → Webhooks and tell me whether an endpoint pointing at `repsglobal.lovable.app` or `staging.repsuk.org` exists. If not, I'll give you the exact steps to add it.
