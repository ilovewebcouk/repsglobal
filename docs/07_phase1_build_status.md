# 07 — Phase 1 Build Status

> **Snapshot date:** 3 June 2026
> **Scope reminder:** Phase 1 = static high-fidelity screens only. No auth wiring, RLS, DB writes, payments, bookings, AI, live maps, real search/filter logic, or BD migration. Visuals must reference the six locked mock-ups in `src/mockups/reps_fullpage_*_v1.png`.

Status legend:

- **Shipped** — route renders the locked design at high fidelity, content in place.
- **Partial** — route exists but content is thin, awaiting copy, or has known visual debt.
- **Not started** — route file does not exist yet.

---

## 1. Public marketing

| Route | Status | Notes |
|---|---|---|
| `/` | Shipped | Locked homepage hero + search panel + marketplace blocks. |
| `/about` | Shipped | |
| `/how-it-works` | Shipped | |
| `/for-professionals` | Shipped (rebuilt) | Two-act narrative: Act 1 (the register) via `RegisterProof` + `ActIntro`, Act 2 (the operating system) via 8 `ProductBlock` stories covering Leads, Bookings & Payments, Clients CRM, AI Programme Builder, Nutrition (replaces MyFitnessPal), Check-ins, Messaging, Insights. Plus `ReplacesStrip` (six apps REPs replaces), `AICapabilities` tiles, and `CompetitorCompare` table with real Trainerize / MyPTHub / PT Distinction logos (`src/assets/logos/*.svg.asset.json`). |
| `/features` | Shipped | Hub page listing the 9 feature deep-dives from `feature-config.ts`, grouped by Visibility / Operations / Growth. |
| `/features/$slug` | Shipped | Per-feature deep-dive pages driven by `feature-config.ts` + `feature-content.tsx` via `FeaturePageLayout`. |
| `/pricing` | Shipped | Founding Business + tiered plans. **Student tier removed** from Phase 1. |
| `/find-a-professional` | Shipped | Static directory results, no real search logic (deferred). |
| `/in/$location` | Shipped | Location landing pages, static data. |
| `/professions/$profession` | Shipped | Profession landing pages, static data. |
| `/specialisms` | Shipped | |
| `/standards` | Shipped | |
| `/cpd` | Shipped | |
| `/business-tools` | Shipped | |
| `/help` | Shipped | |
| `/faq` | Shipped | |
| `/contact` | Shipped | |
| `/complaints` | Shipped | |
| `/press` | Shipped | |
| `/careers` | Shipped | |
| `/reviews` | Shipped | |
| `/terms` | Partial | Thin shell via `LegalShell` — final legal copy pending. |
| `/privacy` | Partial | Thin shell via `LegalShell` — final legal copy pending. |
| `/cookies` | Shipped | |

## 2. Resources (Insights hub)

| Route | Status | Notes |
|---|---|---|
| `/resources` | Shipped | Hub: hero + search + category pills + featured + 3-col grid. |
| `/resources/$slug` | Shipped | Article detail with breadcrumbs, author bio, related articles, JSON-LD `Article` schema. Three sample articles in `src/lib/resources.ts`. |

## 3. Professional profile

| Route | Status | Notes |
|---|---|---|
| `/pro/$slug` | Shipped | Layout outlet. |
| `/pro/$slug/` | Shipped | Locked profile layout — horizontal service cards, no icons, 3-col grid. Do not redesign without explicit request. |
| `/pro/$slug/enquire` | Shipped | Enquiry page with summary card (scaled-down pro photo uses the documented exception in `mem://design/source-of-truth`). |

## 4. Auth

All auth routes ship the visual surface. Backend wiring is deferred to Phase 2.

| Route | Status | Notes |
|---|---|---|
| `/signup` | Shipped | Two account types (Fitness Professional, Business / Facility). "I am a" label removed. No student type. |
| `/login` | Shipped | |
| `/forgot-password` | Shipped | |
| `/reset-password` | Shipped | |
| `/verify` | Shipped | |
| `/verify-email` | Shipped | |
| `/accept-invite` | Shipped | |
| `/unsubscribe` | Shipped | |

## 5. Professional dashboard

| Route | Status | Notes |
|---|---|---|
| `/dashboard` | Shipped | Locked dashboard shell. |
| `/dashboard/bookings` | Shipped | |
| `/dashboard/business` | Shipped | |
| `/dashboard/calendar` | Shipped | |
| `/dashboard/check-ins` | Shipped | |
| `/dashboard/clients` | Shipped | |
| `/dashboard/clients/$slug` | Shipped | |
| `/dashboard/community` | Shipped | |
| `/dashboard/content` | Shipped | |
| `/dashboard/cpd` | Shipped | |
| `/dashboard/leads` | Shipped | |
| `/dashboard/messages` | Shipped | |
| `/dashboard/nutrition` | Shipped | |
| `/dashboard/payments` | Shipped | |
| `/dashboard/profile` | Shipped | |
| `/dashboard/programs` | Shipped | |
| `/dashboard/reports` | Shipped | |
| `/dashboard/reviews` | Shipped | |
| `/dashboard/settings` | Shipped | |

## 6. Client portal

| Route | Status | Notes |
|---|---|---|
| `/portal` | Shipped | Layout outlet. |
| `/portal/today` | Shipped | |
| `/portal/programme` | Shipped | |
| `/portal/nutrition` | Shipped | |
| `/portal/check-ins` | Shipped | |
| `/portal/messages` | Shipped | |
| `/portal/profile` | Shipped | |

## 7. Admin

| Route | Status | Notes |
|---|---|---|
| `/admin` | Shipped | Locked admin overview. |
| `/admin/cpd` | Shipped | |
| `/admin/directory` | Shipped | |
| `/admin/memberships` | Shipped | |
| `/admin/migration` | Shipped | Static visual only — no real migration logic (deferred). |
| `/admin/payments` | Shipped | |
| `/admin/professionals` | Shipped | |
| `/admin/reviews` | Shipped | |
| `/admin/settings` | Shipped | |
| `/admin/support` | Shipped | |
| `/admin/verification` | Shipped | |

---

## 8. Phase 1 deferred (do not build yet)

The following are explicitly out of scope until Phase 1 visuals are signed off:

- Supabase auth wiring, session handling, RLS
- Database tables, migrations, real reads/writes
- Stripe / payments
- Bookings engine and calendar sync
- AI features (programme generation, chat, summarisation)
- Live maps / geocoding
- Real search and filter logic on `/find-a-professional`, `/in/$location`, `/professions/$profession`
- BD (REPsUK.org) data migration

## 9. Known visual debt

- `/terms` and `/privacy` — legal copy still placeholder via `LegalShell`. Awaiting final wording before promoting to Shipped.
- Mobile mega-menu for `PublicHeader` is deferred — header dropdowns are desktop (`lg:`) only; mobile keeps the CTA-only state until a drawer pass.
- Final compliance audit (`reps-build-compliance` skill) should be re-run before sign-off to catch any drift in hex/radius/shadow rules across recently edited files.

## 10. Phase 2 candidates

- Resources CMS (currently static articles in `src/lib/resources.ts`).
- Real directory search + filters backed by the database.
- Auth + role-based redirects for `/dashboard`, `/portal`, `/admin`.
- Booking flow on `/pro/$slug/enquire`.
- Sitemap and `robots.txt` generation (not yet present).
- Per-profession and per-location SEO landing-page generation at scale.
