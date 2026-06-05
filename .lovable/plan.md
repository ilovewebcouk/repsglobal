
# QA pass: `/professions/$profession`

Full visual + copy QA on the shared profession landing template (`src/routes/professions.$profession.tsx`, 617 lines). Verified across all 5 mapped slugs: `personal-trainer`, `pilates-instructor`, `nutritionist`, `strength-coach`, `online-coach`.

## Goals

1. Bring copy in line with the global-platform rule (no "UK" phrasing) and the no-booking-fee / tier-ladder content rules.
2. Audit the page against the locked radius system, semantic tokens, and the shadcn-first rule.
3. Verify mobile / tablet / desktop at high fidelity for every mapped slug.
4. Capture findings, then ship fixes in a single focused edit pass.

## Phase 1 — Audit (read-only)

Walk the file section by section and check against project memory:

- **Copy / content**
  - Hero blurbs in `PROFESSIONS` for UK-only phrasing, "across the UK", country qualifiers. Default to global voice ("in your city", "wherever you train").
  - Hiring FAQ for any booking-fee / commission / "Stripe included" claims (currently looks clean — re-confirm).
  - £ currency is fine to keep per Core rules.
  - `CITIES` list is UK-only (London / Manchester / …). Either reframe heading ("Popular cities") and keep, or add an "Or browse all locations" link — decide during audit, do not silently rewrite as global.
  - "REPs-verified" usage consistent with brand (never "REPs UK").

- **Radius audit** (locked system: button 10, input 12, std card 16, featured/result 18, large panel 22, hero 24, pill full):
  - `rounded-[18px]` form wrapper at L353 — should be **22px** (large panel) since it wraps inputs/CTA, OR keep 18 if treated as a result-style card. Flag for decision.
  - `rounded-[12px]` inputs L354, L363 ✓
  - `rounded-[10px]` CTA L373 ✓
  - `rounded-[22px]` aside L381 ✓
  - `rounded-[18px]` featured card L568 ✓
  - `rounded-[16px]` city card L475 ✓
  - `rounded-[18px]` trust band L491 + FAQ L520 ✓
  - Tag chips use `rounded-full` ✓

- **Token / color audit** — no hardcoded hex; all `reps-*` tokens. Quick re-confirm.

- **shadcn-first**
  - Native `<details>/<summary>` FAQ (L520–530) → swap to shadcn `Accordion`.
  - Native `<form>` could stay (it's marketing chrome, not a real form), but inputs could use shadcn `Input` for consistency. Decide during audit — leaning **keep native** to match the homepage hero search pattern.
  - Tooltip already shadcn ✓.

- **Imagery / `FeaturedCard`**
  - `pro-james.jpg`, `pro-sophie.jpg`, `pro-daniel.jpg`, `pro-laura.jpg` — confirm the REPS wordmark rule (mem://design/trainer-imagery) is satisfied. If any are missing the visible "REPS" wordmark on the garment, flag for a later imagery pass (do not regenerate in this QA — that's out of scope unless trivially fixable).
  - Card "View Profile" links to `/pro/$slug` derived from the featured name — confirm these slugs resolve (e.g. `james-wilson`). If not, point them at a known good slug or `/find-a-professional`.

- **SEO `head()`**
  - Confirm canonical and og tags per slug. Add `og:image` per slug if a sensible hero exists; otherwise leave omitted (per `tanstack-route-architecture`: no image beats a generic one).
  - Confirm fallback slug (`getProfession`) still produces a clean title for unmapped slugs.

- **Responsive**
  - Hero `lg:grid-cols-[1.4fr_1fr]` — verify aside doesn't crowd at the md→lg break.
  - Featured cards `sm:grid-cols-2 lg:grid-cols-4` — verify at tablet (~820px) the 2-up doesn't leave huge images.
  - Trust band `lg:grid-cols-[1.2fr_repeat(4,1fr)]` — verify the heading column isn't squashed below ~1100px.
  - Mobile breadcrumb wrap, hero font scale, search form stacking.

## Phase 2 — Fix pass (single edit batch)

Based on the audit, apply targeted fixes. Expected scope:

1. **Copy edits in `PROFESSIONS`** — strip any UK-only language; tighten 1–2 blurbs if they read thin. No structural changes to the type.
2. **Radius fix** — bump the hero search wrapper to `rounded-[22px]` if audit confirms it's the large-panel role (or leave at 18 with a note).
3. **FAQ → shadcn `Accordion`** — replace native `<details>` block with `Accordion` / `AccordionItem` / `AccordionTrigger` / `AccordionContent`, keeping the same `FAQS` data and visual rhythm (ChevronRight rotate, divide borders preserved via accordion styling).
4. **City section heading** — soften to "Browse {plural} by city" + add a small "See all locations" tertiary link to `/find-a-professional` so the UK-only list reads as a sample, not an exhaustive global list.
5. **Featured card slugs** — confirm or repoint `View Profile` so no slug 404s.
6. **`head()`** — minor tweaks if needed (e.g. trim title length under 60 chars).

Strictly out of scope: redesigning hero composition, adding new imagery, changing the page section order, touching `/in/$location`, or any backend work.

## Phase 3 — Visual verification

For each of the 5 mapped slugs, capture screenshots at:
- Mobile **390×844**
- Tablet **820×1180**
- Desktop **1366×768**

(15 screenshots total.) Spot-check the unmapped-slug fallback at desktop only. Inspect for: hero balance, aside crowding, search form stacking, featured-card image cropping, city grid, trust-band squash, FAQ accordion open/closed states, related-pill wrap. Re-edit if anything breaks; otherwise report PASS per slug.

## Phase 4 — Lock decision

If the pass is clean, ask whether to lock `/professions/$profession` the same way the homepage is locked (new `mem://design/locked-profession-landing` + Core line + entry in `docs/07_phase1_build_status.md` lock log). Do **not** lock automatically.

## Files touched (expected)

- `src/routes/professions.$profession.tsx` — copy + radius + FAQ accordion + city heading + (maybe) head() tweaks.
- No other route, component, or token files unless audit surfaces something unexpected.

## Out of scope

- Real search wiring, profile data, BD migration.
- Imagery regeneration for `FeaturedCard` photos (flagged only).
- `/in/$location` and `/find-a-professional` QA — separate passes.
