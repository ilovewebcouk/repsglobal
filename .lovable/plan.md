
# Verified tier — finish line plan

Nav stays: **Public profile · Services · Verification · Education & CPD · Settings**. Shop-front gets removed from Verified nav (Pro+ only). Dashboard home is out of scope (build last). No locked mockup visuals change — wiring and Settings only.

---

## Pass 1 — Cleanup (no DB)

1. **Remove Shop-front from VERIFIED_NAV** in `src/components/dashboard/DashboardShell.tsx`. Add tier gate on `dashboard_.shop-front.tsx` redirecting Verified users to `/dashboard/services` with a "Shop-front is a Pro feature" toast.
2. **Fix delivery-mode duplication**: `in_person_available` / `online_available` live on **Services** only. Remove the toggle block from `dashboard_.profile.tsx`. Profile keeps photo, headline, bio, city, gyms, social, languages.
3. **Update Services upsell copy**: change "03 Pro upsell" to "Unlock your Shop-front — sell packages, take payments, onboard clients" linking to `/features/shop-front` + `/pricing`.
4. Enforce `SpecialismsPicker` 3-cap (DB trigger already enforces; surface client-side error nicely).

## Pass 2 — Settings rebuild (the main work)

Replace `src/routes/_authenticated/_professional/dashboard_.settings.tsx` with a real, wired 5-tab layout. Keep the existing dark-panel visual language (PCard / PPanel / Row pattern) — only the content + wiring changes.

### Tab structure (URL-driven via `?tab=`)

**1. Account**
- Full name (locked if `identity_status='approved'` — show lock notice + "Contact support")
- Email — change flow sends Supabase confirmation to new address; old email notified
- Phone (E.164, shared `PhoneField`)
- Profile photo (existing avatars bucket)
- Timezone + locale (new columns)
- Save via `updateMyAccount` server fn

**2. Notifications**
- New enquiry email (default on)
- Weekly enquiry digest (default off)
- Renewal reminder 30/7 days before (default on, can't fully disable required ones — show "required" lock)
- Verification expiry reminders (DBS, insurance, qualifications) — required, shown as locked
- REPs product updates / marketing (default off; explicit opt-in for GDPR)
- New `notification_preferences` table, one row per user, JSON-ish columns

**3. Billing**
- Current plan card: "Verified — £99/year · renews {date}" pulled from `subscriptions`
- "Manage billing" → existing `ManageBillingButton` (Stripe Customer Portal: card, invoices, cancel)
- "Change plan" → links to `/pricing`
- Founding badge if `is_founding=true`
- Hide payout account entirely (no payments through REPs for Verified)

**4. Security**
- Change password (Supabase `updateUser({ password })` with re-auth via current password)
- Active sessions list: current session only (Supabase doesn't expose session list to client cheaply — show device/IP from `auth.getUser()` and "Sign out everywhere" → `supabase.auth.signOut({ scope: 'global' })`)
- 2FA: **omitted per your call** (no toggle shown)
- Sign out

**5. Privacy & data**
- **Pause listing** toggle → sets `professionals.is_published=false`. Shows "Your profile is hidden from search. Enquiries paused. Resume any time." Subscription stays active.
- **Export my data** → server fn returns JSON blob of profile + enquiries + reviews + verifications, triggers download
- **Delete account** → **immediate hard delete** (per your call). Confirmation dialog requires typing email + "DELETE". Server fn: cancels Stripe subscription, deletes auth user (cascades via FKs), signs out. No grace.
- Legal name lock notice + "Contact support to change"

### Server functions (new, all in `src/lib/settings/settings.functions.ts`)

- `getMySettings` — bundles account + prefs + subscription summary
- `updateMyAccount` — name (respects identity lock), email (triggers Supabase email change), phone, timezone, locale, avatar
- `updateMyNotificationPrefs`
- `updateMyPrivacy` — `is_published` pause toggle
- `exportMyData` — returns JSON
- `deleteMyAccount` — verifies email match, cancels Stripe sub via API, calls `supabaseAdmin.auth.admin.deleteUser(userId)` (loaded inside handler)
- `changeMyPassword` — re-auths then `auth.updateUser`

All use `requireSupabaseAuth` middleware. `attachSupabaseAuth` already wired.

## Pass 3 — Migration

Single migration:

```text
-- professionals: add timezone, locale
ALTER TABLE public.professionals
  ADD COLUMN timezone TEXT DEFAULT 'Europe/London',
  ADD COLUMN locale TEXT DEFAULT 'en-GB';

-- notification preferences
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  new_enquiry_email BOOLEAN NOT NULL DEFAULT true,
  weekly_enquiry_digest BOOLEAN NOT NULL DEFAULT false,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
```

Required renewal + verification-expiry reminders are system-sent (not toggleable) — no column needed.

## Pass 4 — QA on locked sections (no visual change)

- **Public profile** (`dashboard_.profile.tsx`) — confirm delivery toggles removed, save status pill works, gyms/socials persist
- **Services** (`dashboard_.services.tsx`) — confirm specialisms cap, in-person/online toggles save, directory card preview updates live, upsell copy updated
- **Verification** (`dashboard_.verification.tsx`) — confirm Stripe Identity callback, insurance upload, qualifications → CPD link, badge tier reflects DB
- **Education & CPD** (`dashboard_.cpd.tsx`) — label any mock-only CPD log rows as "Coming soon"; confirm certificate upload + earned titles work

## Out of scope (later phases)

- Dashboard home overhaul, listing-health score, reviews-for-Verified, enquiries inbox, onboarding wizard, 2FA, mobile-first rebuild — captured for Pass 5/Phase 2.1.

## Files touched

- New: `src/lib/settings/settings.functions.ts`
- New: `src/components/settings/*` (5 tab panels + DeleteAccountDialog + PauseListingCard)
- Edited: `src/routes/_authenticated/_professional/dashboard_.settings.tsx` (rebuild)
- Edited: `src/components/dashboard/DashboardShell.tsx` (remove Shop-front from VERIFIED_NAV)
- Edited: `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` (Verified tier gate)
- Edited: `src/routes/_authenticated/_professional/dashboard_.profile.tsx` (remove delivery toggles)
- Edited: `src/routes/_authenticated/_professional/dashboard_.services.tsx` (upsell copy)
- Migration: timezone/locale + notification_preferences

Ship Pass 1 + Pass 3 migration together, then Pass 2 Settings, then Pass 4 QA.
