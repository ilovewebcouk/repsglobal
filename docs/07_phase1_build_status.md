# 07 — Phase 1 Build Status

> **Snapshot date:** 3 June 2026 (IA split + AI pillar promotion)
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
| `/for-professionals` | Shipped (rebuilt — slim sales landing) | Repositioned around the AI operating system. Sections: cinematic hero ("Not just software. An AI operating system for fitness professionals."), press strip, Act 1 (`RegisterProof`), Act 2 platform pillars (`ReplacesStrip` + 5 pillar tiles linking to `/features/{pillar}` with AI emphasised), AI Operating Layer section (6 narrative cards), pricing preview (3 condensed tier cards + CTAs to `/compare` / `/pricing` / `/features`), final CTA, sticky CTA. Full `ProductBlock` × 8, full pricing table and full competitor table moved off this page. |
| `/for-professionals-v2` | **Locked — Phase 1 approved** | Copy QA pass complete and approved by stakeholder. No further redesign without explicit request. Outstanding manual verifications tracked separately: (a) swap placeholder testimonial identities for opted-in pros, (b) sign-off on "Founding pricing — locked for life" public language, (c) methodology cross-check for "no cut of your bookings" competitor claims. |
| `/features` | Shipped (rebuilt) | 5-pillar hub: Visibility, Operations, Coaching, REPs AI (highlighted, orange-accented), Growth. Each pillar links to its `/features/{pillar}` deep-dive. AI pillar shows top 6 of 14 capabilities + "See all 14" CTA. |
| `/features/visibility` | Shipped | Pillar deep-dive via shared `FeatureGroupLayout` (hero + `BrowserFrame` mock-up + feature grid + cross-links). |
| `/features/operations` | Shipped | Pillar deep-dive via `FeatureGroupLayout`. |
| `/features/coaching` | Shipped | Pillar deep-dive via `FeatureGroupLayout`. |
| `/features/ai` | Shipped | REPs AI Operating System deep-dive: 6-card narrative ("AI layer behind your fitness business"), full 14-item AI capability grid from `AI_FEATURES`, mini comparison table vs Trainerize / My PT Hub / PT Distinction / Kahunas, CTA to `/compare`. |
| `/features/growth` | Shipped | Pillar deep-dive via `FeatureGroupLayout`. |
| `/features/$slug` | Shipped | Per-feature deep-dives (9 slugs) driven by `feature-config.ts` + `feature-content.tsx` via `FeaturePageLayout`. |
| `/pricing` | Shipped (rebuilt as dedicated buying page) | `FoundingBanner` + hero + `PricingPlans` + cross-link to `/compare` + `PricingFAQ` + final CTA. No longer a redirect to `/for-professionals#pricing`. |
| `/compare` | Shipped (new) | Dedicated plan-by-plan comparison: hero + `FoundingBanner` + full `PricingCompare` (with expanded `COMPARE_GROUPS` covering Billing, Visibility & trust, Business operations, Coaching delivery, REPs AI (14 rows), Growth & scale, Admin & support). |
| `/find-a-professional` | Shipped | Static directory results, no real search logic (deferred). |
| `/in/$location` | Shipped | Location landing pages, static data. |
| `/professions/$profession` | **Locked — Phase 1 approved** | Profession landing pages, static data. Full visual + copy QA on all 5 mapped slugs (PT, PI, NU, SC, OC). |
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
- `/compare/$competitor` per-competitor comparison routes (Trainerize, My PT Hub, PT Distinction, Kahunas, Everfit)
- Per-AI-feature deep-dive routes (the 14 `AI_FEATURES` roll up under `/features/ai` only)
- Promoting Features to a top-level public-header item (currently lives inside the For Professionals dropdown by design)

## 9. Navigation (public header)

Top-level public nav (`PublicHeader`): **Find a Professional · For Professionals · Resources · About REPs**, with right-side actions Log in · Join REPs (→ `/signup`). The **For Professionals** dropdown is the professional-side gateway and contains: Overview (`/for-professionals`), All features (`/features`), the 5 pillar pages (`/features/visibility`, `/features/operations`, `/features/coaching`, `/features/ai`, `/features/growth`), Pricing, Compare plans, Join REPs. Mobile drawer mirrors the same structure as a "For Professionals" accordion. Train-by-goal and How it works are no longer top-level items.

## 10. Known visual debt

- `/terms` and `/privacy` — legal copy still placeholder via `LegalShell`. Awaiting final wording before promoting to Shipped.
- Final compliance audit (`reps-build-compliance` skill) should be re-run before sign-off to catch any drift in hex/radius/shadow rules across recently edited files.

## 11. Phase 2 candidates

- Resources CMS (currently static articles in `src/lib/resources.ts`).
- Real directory search + filters backed by the database.
- Auth + role-based redirects for `/dashboard`, `/portal`, `/admin`.
- Booking flow on `/pro/$slug/enquire`.
- Sitemap and `robots.txt` generation (not yet present).
- Per-profession and per-location SEO landing-page generation at scale.

## Lock log

- 2026-06-05 — Homepage `/` LOCKED (Phase 1 approved). See `mem://design/locked-homepage`.
- 2026-06-05 — Profession landing pages `/professions/$profession` LOCKED (Phase 1 approved). Full visual + copy QA pass on all 5 mapped slugs (PT, PI, NU, SC, OC). See `mem://design/locked-professions`.
