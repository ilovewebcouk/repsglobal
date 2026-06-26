## Goal

Pro tier isn't launching yet, so every public/dashboard CTA that nudges users to buy Pro should behave the same as Studio: a "Join Pro waitlist" button that routes to `/contact`. Backend Pro access, admin tier management, and the existing Pro-tier trainer's dashboards stay exactly as they are.

## Changes

### 1. Pricing page (`src/components/pricing/pricing-data.ts` + `PricingPlans.tsx`)
- Pro card: `cta: "Join Pro waitlist"`, mark `waitlist: true`, `ctaHref: "/contact"`.
- Drop the founding-trial meta line on the Pro card (`Billed monthly after 30-day trial` → `Founding price · waitlist only`); annual meta similarly tagged as waitlist.
- Page hero subtitle (`src/routes/pricing.tsx` line 18): replace "Pro Founding £59/mo with a 30-day free trial" with "Pro Founding £59/mo — waitlist open."
- Comparison table row "Live offer" Pro cell → "£59/month or £590/year · waitlist".
- FAQ entries that mention the 30-day trial (lines 203, 223) reworded: Pro is waitlist-only at founding price; no trial copy.
- `PricingPlans.tsx`: no logic change needed — existing `if (p.waitlist) navigate /contact` branch already handles it once Pro is flagged.

### 2. Signup route (`src/routes/signup.tsx`)
- If `?tier=pro`, redirect to `/contact` (waitlist) instead of rendering the Pro signup flow.
- Verified signup flow stays unchanged.
- Remove the "30-day free trial" meta line from the Pro plan summary (kept for reference if someone is sent there directly via admin).

### 3. Dashboard "Upgrade to Pro" surfaces → "Join Pro waitlist"
All copy + link swaps; gating logic untouched.
- `src/components/dashboard/DashboardSidebar.tsx` (lines 407, 415): label + aria-label → "Join Pro waitlist"; link → `/contact`.
- `src/components/dashboard/primitives/UpgradePanel.tsx`: default `ctaLabel` → "Join Pro waitlist"; default href → `/contact`.
- `src/components/dashboard/PaymentsSettingsTab.tsx` (line 82): "Upgrade to Pro to take payments" → "Pro is coming soon — join the Pro waitlist".
- `src/routes/_authenticated/_professional/dashboard_.shop-front.tsx` (line 162): "Upgrade to Pro to add services…" → "Pro is launching soon — join the waitlist to add services and branding."
- `src/routes/_authenticated/_professional/dashboard_.enquiries.tsx` (line 200): button copy → "Join Pro waitlist", link → `/contact`.
- `src/routes/_authenticated/_professional/_pro/route.tsx` (line 48): description → "Pro is launching soon. Join the Pro waitlist to be first in." (this is the wall non-Pro users see when they try a `_pro` route).
- `src/lib/dashboard/useProGuard.ts` (line 26): toast description → "Pro is launching soon — join the Pro waitlist."
- `src/components/account/UserAccountMenu.tsx` (line 220): label → "Join Pro waitlist", link → `/contact`.

### 4. Contact form (`src/components/contact/ContactForm.tsx`)
- Reason option `upgrade`: relabel from "Upgrade to Pro or Studio" → "Join Pro or Studio waitlist".
- Same swap in `src/routes/api/public/support/contact-form.ts` (line 64) so labels stay aligned for inbound routing.

### 5. What we deliberately don't change
- `src/lib/billing.ts` Stripe price IDs, `auth.tsx` `tier=pro` validation, all `_pro` route logic, admin memberships KPIs, admin invite plan label, and any `tier === "pro"` permission check. The existing Pro-tier trainer keeps full Pro dashboards.
- Admin can still grant Pro via the existing admin invite/impersonation flows.
- Resources / competitor editorial copy (`src/lib/resources.ts`, `src/data/competitor-*`) — out of scope for this pass.

## QA after build
- `/pricing`: Pro card shows "Join Pro waitlist", clicks land on `/contact`. Studio unchanged.
- Logged in as a non-Pro trainer: sidebar, enquiries upsell, shop-front empty state, account menu all say "Join Pro waitlist" and route to `/contact`.
- Logged in as the existing Pro-tier trainer: full Pro dashboard still loads (no waitlist CTA visible — they're already Pro).
- `/signup?tier=pro` redirects to `/contact`. `/signup?tier=verified` still works.
