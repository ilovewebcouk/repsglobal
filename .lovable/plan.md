# Plan — REPs AI repositioning + IA split

Phase 1 visual/content only. No backend, no real AI calls, no auth/DB/payments. Brand orange, radius scale, and locked mock-ups unchanged.

## 1. Promote AI to a core product pillar

Update `src/components/features/feature-config.ts` so feature groups become **5 sales pillars**:

1. **Visibility** — public profile, verification, reviews, directory search, profile analytics
2. **Operations** — CRM, bookings, payments, calendar, messages, tasks
3. **Coaching** — programmes, exercise library, nutrition, check-ins, progress, client portal
4. **REPs AI Operating System** *(new top-level pillar)*
5. **Growth** — analytics, retention, referrals, Content Studio, business insights

Admin & Verification stays a separate section on `/features` (not a sales pillar).

Add a new `aiFeatures` array (separate from `FEATURES`) with the 14 AI capabilities as static cards (icon + label + one-liner + included-in-tier). No new deep-dive routes per AI feature in Phase 1 — they roll up under `/features/ai`.

AI list:
- AI Business Command Centre
- Weekly Next Move Growth Cards
- AI Programme Writer
- AI Nutrition Planner
- AI Check-in Summariser
- AI Coach Reply Drafts
- AI Lead Scoring
- AI Lead Reply Assistant
- AI Client Risk Alerts
- AI Revenue & Retention Insights
- AI Content Studio
- AI Client Plateau Detection
- AI Adherence Analysis
- AI Follow-up Suggestions

## 2. Information architecture split

New/changed routes:

```
/for-professionals       Sales landing — sell the vision (slimmed)
/features                Feature hub (5 pillars + Admin)
/features/visibility     NEW — group deep-dive
/features/operations     NEW — group deep-dive
/features/coaching       NEW — group deep-dive
/features/ai             NEW — AI Operating System deep-dive (hero feature)
/features/growth         NEW — group deep-dive
/features/$slug          Existing per-feature pages (kept)
/pricing                 Buying page (expand)
/compare                 NEW — full plan-by-plan comparison (move PricingCompare here)
```

`/compare/$competitor` deferred.

## 3. Navigation (amended — no top-level Features item)

**Top-level public header stays clean:**
- Find a Professional
- For Professionals *(becomes the professional-side gateway dropdown)*
- Resources
- About REPs

Right-side actions: Log in · Join REPs.

**For Professionals dropdown** (`PublicHeader` + `nav-config.ts`):
- Overview → `/for-professionals`
- Features → `/features`
- Visibility → `/features/visibility`
- Operations → `/features/operations`
- Coaching → `/features/coaching`
- REPs AI → `/features/ai`
- Growth → `/features/growth`
- Pricing → `/pricing`
- Compare plans → `/compare`
- Join REPs → `/signup`

**Mobile drawer:** For Professionals renders as an accordion with the same links.

No new top-level Features nav item.

## 4. `/for-professionals` rewrite (focused landing)

Trim to a tight sales narrative:

1. Hero — headline **"Not just software. An AI operating system for fitness professionals."** + brief subheading.
2. `RegisterProof` (Act 1, kept)
3. Platform showcase — short version: 5 pillar tiles linking to `/features/{pillar}`, not the 8 `ProductBlock`s
4. **NEW major section: "The AI layer behind your fitness business"** — 6 cards (Programmes, Check-ins, Leads, Next Move, Risk, Content) using the brief's copy
5. `ReplacesStrip` (kept)
6. `CompetitorCompare` teaser → CTA to `/compare`
7. **Pricing preview** — 3 condensed tier cards + CTAs: "Compare all plans" → `/compare`, "See full pricing" → `/pricing`, "Explore all features" → `/features`
8. Final CTA

Remove the full `ProductBlock` × 8 stack, full pricing table, and full competitor table from this page.

## 5. `/features` hub rewrite

Replace the 3-group layout with 5 pillar sections. Each: section header + 2-line desc + grid of feature cards + **"Explore {pillar} →"** to its group page. AI pillar visually emphasised (orange-accented panel), listed second (after Visibility) to lead with differentiation.

## 6. Group deep-dive pages (`/features/{pillar}`)

Shared `FeatureGroupLayout`:
- Hero (pillar name + positioning + CTA)
- Static mock-up via `BrowserFrame` + relevant `PlatformMockups`
- Grid of feature cards
- Cross-links to other pillars + CTA to `/signup`

`/features/ai` extra: positioning hero, 6 narrative cards from `/for-professionals`, full 14-item AI grid, "How REPs AI compares" mini-table.

## 7. `/pricing`

Expand existing route into the dedicated buying page:
- Founding banner · `PricingPlans` · monthly/yearly toggle · fee explainer · short feature summary (not full table) · `PricingFAQ` · CTA to `/compare`.

## 8. `/compare` (new)

`src/routes/compare.tsx`:
- Hero "Compare every REPs plan"
- Move `PricingCompare` here
- **Expand `COMPARE_GROUPS`** in `pricing-data.ts`: new "REPs AI" group with one row per AI feature (replaces the single "AI business insights" row); reorganise existing rows into 6 categories (Visibility & trust, Business operations, Coaching delivery, REPs AI, Growth & scale, Admin)
- CTA back to `/pricing`

## 9. Docs sync

After build, update:
- `docs/07_phase1_build_status.md` — add new routes, mark `/for-professionals` as rebuilt (slimmed), note AI pillar
- `docs/03_reps_page_by_page_specification.md` — spec new `/features/{pillar}` and `/compare`
- `docs/06_reps_lovable_build_prompt_pack.md` — prompts for AI pillar + IA split

## Technical notes

- All AI sections are **static visual mock-ups** — no AI Gateway, no Supabase, no API keys.
- Reuse `ProductBlock`, `AICapabilities`, `BrowserFrame`, `PlatformMockups`, `FeaturePageLayout`. New shared component: `FeatureGroupLayout`.
- `feature-config.ts` stays the single source of truth — add `aiFeatures`, `group: "ai"`, group-page metadata.
- No changes to `src/styles.css`, locked mock-ups, brand tokens, or radius scale.
- All new routes ship `head()` metadata (title, description, og:title, og:description, canonical).

## Out of scope (deferred)

- `/compare/$competitor` pages
- Real AI functionality — Phase 2
- Per-AI-feature deep-dive routes — Phase 2 if needed
- Promoting Features to a top-level nav item — only if explicitly decided later
