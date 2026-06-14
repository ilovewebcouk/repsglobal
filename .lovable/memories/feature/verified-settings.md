---
name: Verified Settings tabs
description: Verified-tier Settings page structure, tabs, and server fn boundaries. Locks scope so Pro/Studio-only fields don't leak in.
type: feature
---

`/dashboard/settings` is URL-driven via `?tab=` with exactly 5 tabs for the Verified tier:

1. **Account** — legal name (locked when `professionals.identity_status='approved'`), display name, trading name, phone, timezone, locale; email change via `supabase.auth.updateUser({ email })` (sends confirmation).
2. **Notifications** — `new_enquiry_email`, `weekly_enquiry_digest`, `marketing_opt_in` from `public.notification_preferences`. Renewal + verification-expiry reminders are system-sent (rendered as locked toggles, not stored).
3. **Billing** — read-only summary from `subscriptions`, opens Stripe Customer Portal via `ManageBillingButton`. No payout account (REPs doesn't take payments for Verified). Change plan links to `/pricing`.
4. **Security** — change password with current-password re-auth, "Sign out everywhere". **2FA intentionally omitted for Verified** — adds friction at £99/yr (decision: 2026-06-14).
5. **Privacy & data** — pause listing toggle (`professionals.is_published`), JSON data export, **immediate hard-delete** account (no grace period — confirmed 2026-06-14).

Forbidden in Verified Settings (Pro+ features only): payout account, Google Calendar / Zoom / Mailchimp / MyFitnessPal / Garmin integrations, credits panel, business-profile tab (duplicates `/dashboard/profile`).

Server fns live in `src/lib/settings/settings.functions.ts` — never duplicate this surface in other files.
