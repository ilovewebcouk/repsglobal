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
| `/in/$location` | **Locked — Phase 1 approved** | City landing pages, static data. Unified to shared `FeaturedProCard`, added FAQ + related cities, region copy de-UK'd. Full visual + copy QA on all 4 mapped slugs (London, Manchester, Birmingham, Edinburgh) + fallback. |
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
| `/pro/$slug/enquire` | **Locked — Phase 1 approved** | Enquiry page. All form controls migrated to shadcn primitives (RadioGroup, ToggleGroup, Select, Textarea, Input, Checkbox, Badge, Button). Section order, radius map (incl. 14px photo exception) and copy frozen. See `mem://design/locked-enquire`. |
| `/c/$slug` | Shipped (new) | Coach shop-front landing page — the single page every REPs trainer can use as their public website. Slim REPs chrome bar, hero, trust strip, services grid, about, venues + cities, transformations, testimonials, qualifications, FAQ, social row (outbound links only), sticky mobile enquire bar. Tokenised accent palette (`--coach-accent-*`). All CTAs deep-link to `/pro/$slug/enquire`. `noindex` until profile data is wired. Mock data for `james-wilson`. See `mem://design/coach-shopfront`. |

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
- 2026-06-05 — City landing pages `/in/$location` LOCKED (Phase 1 approved). Unified to shared `FeaturedProCard` (extracted to `src/components/public/FeaturedProCard.tsx` and adopted by professions page too), added FAQ + related cities, de-UK'd region copy. Full visual + copy QA on all 4 mapped slugs (London, Manchester, Birmingham, Edinburgh) + fallback. See `mem://design/locked-cities`.
- 2026-06-05 — Enquire page `/pro/$slug/enquire` LOCKED (Phase 1 approved). Migrated every form control to shadcn primitives (RadioGroup, ToggleGroup multi-select capped at 3, Select, Textarea, Input, Checkbox, Badge, Button with `data-icon`). Layout/section order unchanged. Radius scale clean; the single 14px on the summary pro photo is the documented memory-allowed exception. See `mem://design/locked-enquire`.
- 2026-06-05 — Enquire page polish: aside is now sticky on desktop (`lg:sticky lg:top-24 lg:self-start`); trust block + "what happens next" step 3 rewritten as verification-led copy, dropping payment/refund promises the product can't yet keep. Heading caption tightened (no "no payment until you accept"). Lock memory updated.

## Marketing-page governance (2026-06-09)

To stop typography/layout drift across marketing routes (`/for-professionals`, `/features/*`, `/cpd`, `/compare/*`):

- Approved primitives are documented in `src/components/marketing/README.md` — single source of truth for `SectionHeading`, `BlockHeading`, `SectionEyebrow`, `ProductBlock`, `MarketingFaq`, `FinalCta`, `TrainerToPlatformComposite`, `HeroDeviceCluster`, `UseCaseTriad`, `WeekWithReps`, `AiCommandCentreMock`, etc.
- A new audit script `scripts/audit-marketing-primitives.mjs` (run with `npm run audit:marketing`) scans marketing routes + shared components for hand-rolled `font-display text-[Npx]` headings, banned pricing copy, banned org names, and placeholder panels. Hard violations fail the script (exit 1); soft warnings print.
- Future REPs marketing pages MUST consume the approved primitives — no new hand-rolled section headings, no bespoke 50/50 grids in route files, no ad-hoc FAQs or footer CTAs.
- **Why Tailwind tokens alone are not enough:** `src/styles.css` defines colour / radius / font-family tokens. It cannot enforce that "an H3 inside a 50/50 block is 28→36px", because `text-[32px]` and `text-[40px]` are both valid arbitrary utilities. Semantic typography rules live in the primitives (`SectionHeading`, `BlockHeading`) and the audit script — not in the token layer.
- Initial run (2026-06-09): 32 hard / 45 warn — pre-existing drift across `for-professionals.tsx`, `cpd.tsx`, `cpd-legacy.tsx`, `compare.tsx`. Tracked as a separate clean-up pass; no visual changes made in this governance pass.
- ESLint rule deferred — README + audit script first. Revisit if drift recurs after the clean-up pass.
