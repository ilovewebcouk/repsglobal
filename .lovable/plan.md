# Restore 50/50 pillar sections on /for-professionals

The screenshot confirms what we lost — a vertical stack of two-column blocks (mockup on one side, overline + H2 + body + bullets on the other), alternating sides. We'll rebuild that rhythm on `/for-professionals` using the existing `ProductBlock` component, which already renders exactly that layout.

## What changes

In `src/routes/for-professionals.tsx`, the **Act 2 — Platform Pillars** section currently ends in a five-up grid of small pillar cards. Replace that grid with **five stacked 50/50 sections**, one per pillar, alternating sides:

1. **Visibility** — mockup left
2. **Operations** — mockup right
3. **Coaching** — mockup left
4. **REPs AI** — mockup right
5. **Growth** — mockup left

Each block uses `ProductBlock` with:
- **Eyebrow**: pillar name (e.g. "Visibility")
- **H2**: short benefit headline derived from the group's `desc` in `feature-config.ts`
- **Body**: 2–3 lines on what the pillar covers
- **Bullets**: 3 top features for that pillar, pulled from `FEATURES.filter(f => f.group === key)` (uses each feature's `label`, so bullets stay in sync with feature config)
- **CTA**: "Explore {pillar} →" linking to `/features/{visibility|operations|coaching|ai|growth}`
- **Mockup**: `MockupPlaceholder` with a labelled frame (real screenshots later)

Everything else on the page stays:
- Hero (legibility fix is a separate follow-up, per your note)
- Press strip
- Act 1 — The register
- `ReplacesStrip` (kept above the new 50/50 stack as the intro to Act 2)
- AI operating layer band
- Pricing preview, final CTA, sticky CTA, footer

The five small pillar link-cards are removed — the 50/50 sections now do that job with much more substance.

## Out of scope
- Hero background image legibility (handle next)
- Any changes to `/features` or the `/features/*` group pages
- Real screenshots — placeholders only (Phase 1 lock)

## Technical notes
- `ProductBlock` currently links via `ctaSlug` to `/features/$slug`. Add an optional `ctaHref?: string` prop so we can link to pillar URLs like `/features/visibility`. Falls back to existing `ctaSlug` behaviour — no breaking changes.
- Pillar copy lives inline in `for-professionals.tsx` as a small `PILLAR_BLOCKS` array — no new data file.
- Wrap the five blocks in `space-y-20 lg:space-y-28` inside the existing Act 2 `<section>`, after `ReplacesStrip`.
- Radii / tokens: `ProductBlock` and `MockupPlaceholder` already use approved tokens (`rounded-[18px]`, `text-reps-orange`, etc.).

## Files touched
- `src/routes/for-professionals.tsx` — replace pillar grid with `<ProductBlock />` stack; add `PILLAR_BLOCKS`
- `src/components/marketing/ProductBlock.tsx` — add optional `ctaHref` prop
