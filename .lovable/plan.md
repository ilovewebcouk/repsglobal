
## What you're really saying

The page right now does the work twice:

- **Act 1 + Act 2** = two intros that both say "here's what REPs does".
- **Six ProductBlock deep-dives** = full 50/50 mockup sections, one per pillar, that re-tell what the pillar pages already cover.

Result: long, repetitive, and the pillar pages (`/features/visibility`, `/shop-front`, `/operations`, `/coaching`, `/ai`, `/growth`) end up feeling like dim copies of `/for-professionals` instead of the actual destination.

Your instinct is right: **`/for-professionals` should sell the *shape* of REPs — the six pillars — and pillar pages should blow people away with the detail.**

## Plan

Single file edit: `src/routes/for-professionals.tsx`. No new components, no pillar-page changes, no design-token changes.

### 1. Kill the Act 1 / Act 2 framing

- Remove both `ActIntro` blocks ("Act 1 — Register" and "Act 2 — Six pillars").
- Replace with **one** section header above the pillar grid:
  - Eyebrow: `The platform`
  - Title: "Six pillars. One operating system."
  - Sub: one line — "Everything REPs ships, grouped into the six things a modern fitness business actually needs."

### 2. Delete all six ProductBlock deep-dives

Remove from the page (they stay alive on their pillar pages):

- Pillar 1 · Visibility ProductBlock
- Pillar 2 · Shop-front ProductBlock
- Pillar 3 · Operations ProductBlock + the OPERATIONS_SUB strip
- Pillar 4 · Coaching `PillarTabs` + Client portal ProductBlock
- Pillar 5 · REPs AI section (the big AI moment + 6-cap grid)
- Pillar 6 · Growth ProductBlock

Also drop the now-unused imports (`ProductBlock`, `PillarTabs`, `AiCommandCentreMock`, `OPERATIONS_SUB`, `AI_CAPS`, etc.).

### 3. Replace with a single 6-up Pillar Grid

One `<section id="pillars">` containing six cards in a 2×3 grid (3 cols on `lg`). Each card is a `<Link>` to its pillar page and shows:

```
[icon tile]   Pillar 0X
              Pillar label                e.g. "Operations"
              One-line desc (from FEATURE_GROUPS.desc)

              ✓ bullet 1
              ✓ bullet 2
              ✓ bullet 3
              ✓ bullet 4

              Explore {label} →
```

Card chrome: `rounded-[18px]` border card on `bg-reps-panel`, hover ring in `--reps-orange-border`, icon tile `rounded-[10px]` in `bg-reps-orange-soft`. AI card gets a subtle orange border accent (uses `FEATURE_GROUPS[ai].highlight`).

**Bullets** are short feature names — 4 per pillar, drawn from existing data:

- **Visibility**: Verified profile · Reviews on the record · Directory placement · Trust signals
- **Shop-front**: Your own `/c/you` page · Service tiers · Proof & transformations · Direct enquiries
- **Operations**: Leads CRM · Bookings & calendar · Payments & subs · Client records
- **Coaching**: Programmes · Check-ins · Nutrition · Messaging & portal
- **REPs AI**: Programme drafting · Check-in summaries · Lead scoring · Next Move + risk alerts
- **Growth**: Revenue insights · Retention & churn · Renewal forecasting · Monday Next Move

(These are pulled from the existing `FEATURES` / `AI_FEATURES` arrays — no new copy decisions, just pruning to the strongest 4.)

### 4. Final section order

```text
Hero
PressMarquee
RegisterProof                       (kept — quick "what the public sees" moment)
Six Pillars Grid       (id="pillars" — replaces both Acts + all 6 deep-dives)
TestimonialFeature
ComparisonStrip
ReplacedStackBoard + TestimonialTriad
UseCaseTriad
WeekWithReps                        (kept — concrete "what a week looks like")
FAQ
Final CTA
```

That trims the page from ~16 sections to ~10, no repetition, and `/for-professionals` becomes a clean funnel into the pillar pages.

### 5. Small fixes carried over

- Hero "Explore features" link → `to="/for-professionals" hash="pillars"` so it scrolls to the new grid.
- Page `<title>` / meta unchanged.

## Out of scope

- No changes to any `/features/*` pillar page (they remain the deep-dive destinations — separate pass if you want to "blow them out of the park").
- No changes to `feature-config.ts`, `PillarTabs`, `ReplacedStackBoard`, `ProductBlock`, or hero.
- No design-token or radius changes.
- No Phase 2 work.

Used the **reps-build-compliance** skill (Phase 1 static; no token/radius changes; uses locked semantic tokens and 18px card radius).
