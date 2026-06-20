# Passwordless SMS sign-in

Replace (or sit alongside) email/password with a phone-number + one-time SMS code flow, available to every user — pros, clients, and admin.

## How hard is it?

Genuinely easy. Supabase has native Phone Auth built in — we don't write any auth backend ourselves. The work is roughly:
- ~1 hour: wire an SMS provider (Twilio) so Supabase can actually send codes
- ~2–3 hours: build the 2-step UI (enter phone → enter 6-digit code)
- ~30 mins: tidy account settings so existing email users can add a phone

The hard parts are operational, not technical: **SMS costs real money** (~£0.04 per UK SMS, more for some countries) and SMS is the #1 target for "SMS pumping" fraud (bots hammering send-code to rack up your bill). We mitigate both below.

## Scope decision needed before build

Two viable shapes — pick one:

1. **SMS as the only login** — remove email/password entirely. Cleanest UX, but every sign-in costs an SMS and locked-out-of-phone = locked-out-of-account.
2. **SMS + email/password side by side** — user picks on `/auth`. Safer, slightly more UI. Recommended.

I've planned (2) below because it's reversible and protects existing accounts. Say the word if you want (1).

## What gets built

### 1. Provider setup (Twilio via Lovable connector)
- Connect Twilio through the standard connector (you'll authorise it once).
- Enable **Phone provider** in Lovable Cloud auth settings, pointed at Twilio.
- Enable **SMS Pumping Protection** and restrict **Geo Permissions** to the countries REPs actually serves (UK + whichever others you name). This is the single most important anti-fraud step.

### 2. `/auth` route — add a "Continue with phone" path
Two-step flow inside the existing card:
- **Step 1:** phone input (with country selector, defaults to +44). Button: "Send code". Calls `supabase.auth.signInWithOtp({ phone })`.
- **Step 2:** 6-digit code input + "Resend in 30s" timer. Calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`. On success, runs the same `redirectAfterAuth` we already use for password sign-in (so checkout-redirect, dashboard routing all keep working).
- Toggle at the top: "Use email & password instead" — keeps the existing form available.

### 3. `/signup` route — same two-step phone option
Mirror the flow. First-time phone sign-in via OTP creates the auth user automatically; no separate "sign up" call needed for the phone path.

### 4. Profile setup after phone-only signup
A phone-first user has no email on file. Add a one-time "Complete your profile" step after first verify that captures email + name (writes to `profiles`). Skippable for clients, required for pros (matches existing pro-onboarding gate).

### 5. Dashboard → Settings → Security
- Show current sign-in method(s).
- "Add a phone number" / "Add a password" — lets users link the other method so they're not locked to one channel.
- "Remove phone" with confirmation.

### 6. Anti-abuse guardrails (server-side)
A small `createServerFn` wrapper around `signInWithOtp` that enforces:
- Max 3 codes per phone per hour
- Max 10 codes per IP per hour
- Block disposable/VOIP ranges (basic E.164 validation + optional Twilio Lookup later)

This sits in front of Supabase so a botnet can't just hammer the client SDK directly.

### 7. Admin visibility
Add "Phone verified" column to `/admin/professionals` and the user detail view (reads `auth.users.phone_confirmed_at` via the existing SECURITY DEFINER pattern).

## Out of scope (call out separately if wanted)
- WhatsApp OTP (Twilio supports it but needs business verification)
- TOTP / authenticator-app 2FA
- Backup recovery codes
- Step-up auth (re-prompt SMS for sensitive actions like changing payout details)

## Cost & risk summary (so you can decide)
- **Cost:** ~£0.04 per UK SMS × every login + every failed attempt. For ~1,000 active users logging in twice a week, that's ~£300/month at full passwordless. Mixed mode (option 2) cuts that significantly because power users will use password.
- **Fraud:** without geo-restriction + pumping protection, a single bad actor can burn hundreds of £ overnight. The guardrails above are mandatory, not optional.
- **Lock-out:** users who change phone numbers and have no email/password fallback will need admin recovery. Option 2 avoids this.

## What I need from you before I build
1. **Confirm option 2** (SMS alongside email/password) or switch to option 1 (SMS only).
2. **Country list** for Twilio Geo Permissions (default: UK only — confirm or add others).
3. **Twilio account** — I'll trigger the connector flow; you'll paste an API key when prompted. If you don't have a Twilio account yet, ~10 min to sign up at twilio.com and buy one UK number (~£1/month).

Once those are confirmed I'll execute in this order: connector → auth config → server guardrails → `/auth` UI → `/signup` UI → settings → admin column.
