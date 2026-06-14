# Verified tier — finish line plan (status)

Nav: **Public profile · Services · Verification · Education & CPD · Settings**. Shop-front gated to Pro+ only.

## Pass 1 — Cleanup ✅ SHIPPED
- Removed Shop-front from `VERIFIED_NAV` in `DashboardShell.tsx`.
- Tier gate on `dashboard_.shop-front.tsx`: Verified members redirected to `/dashboard/services` with toast.
- Removed delivery-mode (in-person/online) toggle from `dashboard_.profile.tsx` — Services owns it. Gyms section stays, with helper link to Services when online-only.
- Services upsell card rewritten to "Unlock your Shop-front" with link to `/features/shop-front` + `/pricing`.

## Pass 2 — Settings rebuild ✅ SHIPPED
New `src/routes/_authenticated/_professional/dashboard_.settings.tsx` with 5 URL-driven tabs (`?tab=`):
- **Account** — legal name (locked if identity approved), display name, trading name, phone, timezone, locale, email change via Supabase confirmation
- **Notifications** — new enquiry email, weekly digest, marketing opt-in (renewal + verification expiry locked as required)
- **Billing** — current plan, founding badge, renewal date, Stripe Customer Portal button, change-plan link
- **Security** — change password (with current-password re-auth), sign out everywhere
- **Privacy & data** — pause listing toggle, JSON data export, immediate hard-delete account (email + DELETE phrase confirmation)

Server fns in `src/lib/settings/settings.functions.ts`:
`getMySettings`, `updateMyAccount`, `updateMyNotificationPrefs`, `updateMyListingPaused`, `exportMyData`, `deleteMyAccount`.

## Pass 3 — Migration ✅ SHIPPED
- `professionals.timezone` (default `Europe/London`), `professionals.locale` (default `en-GB`)
- `notification_preferences` table (user_id PK → auth.users, 3 boolean toggles, RLS scoped to `auth.uid()`, updated_at trigger)

## Pass 4 — QA on locked sections (visual = no changes)
- Public profile: delivery toggles removed ✅
- Services: upsell copy updated ✅, specialism cap enforced by DB trigger
- Verification: no changes (already wired)
- Education & CPD: no changes (no mock copy found requiring "Coming soon" labels in this pass)

## Out of scope (Phase 2.1+)
Dashboard home overhaul, listing-health score, reviews-for-Verified, enquiries inbox, onboarding wizard, 2FA, mobile-first rebuild.
