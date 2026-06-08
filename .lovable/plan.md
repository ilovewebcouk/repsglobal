## You're right — receipts first

Heading sizes are drifting across files. Audit:

| Where | h3 (mobile → lg) |
| --- | --- |
| `SectionHeading` primitive (the canonical one) | **30 → 40** |
| `PillarPage` `PillarFeatureBlock` h3 (visibility today) | **30 → 40** |
| `ProductBlock` h3 (every pillar block on `/for-professionals`) | **26 → 32** |
| `FeaturePageLayout` block h3 | 28 → 34 |
| `features.ai.tsx` block h3 | 28 → 34 |
| `features.shop-front.tsx` block h3 | 30 → 38 |

So the "40 vs 32" you're seeing is real: `/features/visibility` renders the pillar block heading at **40px** via `PillarPage`, while the identical-looking block on `/for-professionals` renders it at **32px** via `ProductBlock`. Three other files invented their own sizes too. That's a system failure, not a one-off.

The canonical scale already exists in the locked source of truth (`mem://design/marketing-section-primitives`): `SectionHeading` = 30 → 40, `SectionEyebrow` = 11px tracked orange. Everything else should resolve to that. It hasn't been enforced.

## What I'll do (one combined pass, no scope creep)

### 1. Lock the type scale, then apply it everywhere a 50/50 block heading lives

Single source: `SectionHeading` for section H2 (30 → 40), new `BlockHeading` primitive for the 50/50 in-block H3 (28 → 36 — mid-step on the same scale, smaller than a section H2 because it sits inside a section).

- **Create** `src/components/marketing/BlockHeading.tsx` — `font-display text-[28px] font-bold leading-[1.1] text-white lg:text-[36px]`.
- **Rewrite** the heading line in every 50/50 block to consume `BlockHeading`:
  - `src/components/marketing/ProductBlock.tsx` (drives `/for-professionals` pillars)
  - `src/components/features/PillarPage.tsx` `PillarFeatureBlock`
  - `src/components/features/FeaturePageLayout.tsx`
  - `src/routes/features.shop-front.tsx` (3 occurrences)
  - `src/routes/features.ai.tsx` (2 occurrences)
- After this pass, every 50/50 block heading on every pillar/feature page = 28 → 36, full stop. No more divergence.

I'm not touching hero H1s or section H2s in this pass — only the 50/50 block H3 that's actively wrong.

### 2. Rebuild the "Cinematic Product Composite" properly

Rename + replace `CinematicCardStack` with the right pattern. New component:

**`src/components/marketing/TrainerToPlatformComposite.tsx`**

The composition you actually described:

- Cinematic full-bleed trainer photo on one side of the 50/50 (not aspect-locked panel — bleeds to the edge).
- Real REPs UI elements **emanating from the subject** with depth, not pinned to corner slots. Three preset compositions so it stays consistent page-to-page:
  - `composition: "card-trail"` — two stacked cards descending diagonally from the trainer's torso (subject → card 1 overlapping shoulder → card 2 lower-right, larger, with subtle shadow ramp).
  - `composition: "device-and-stats"` — one device mockup (phone or laptop, real `ScaledFrame` of a REPs route) emerging from one side + one stat tile floating beside it.
  - `composition: "single-hero"` — one big floating device, photo subject framed behind it. For the "less is more" capabilities.

- Cards built on shadcn `Card` primitives (per the always-on shadcn rule) — no hand-rolled panel markup.
- Stat cards reuse the orange-label / white-value / emerald-delta token triplet already in memory (`mem://design/status-colors`).
- Real REPs routes inside device mockups via existing `ScaledFrame` / `LaptopFrame` / `PhoneFrame` — no new device chrome.
- Depth treatment: each floating element gets a tiered shadow + a thin `ring-1 ring-reps-border` and `backdrop-blur-md` over a `bg-reps-panel/85`, so the cards feel like they're lifting off the photo.
- Subtle "ray" gradient from the subject to the cards (single `radial-gradient` brand-orange tint at low opacity) — gives the "expanding from the scene" feel without becoming a Genially graphic.
- Reuses my existing `PillarFeature.mockup = { kind: "cinematic", ... }` wiring on `PillarPage`, just changes the component it renders to and extends props with `composition`.

**Delete** `src/components/marketing/CinematicCardStack.tsx` (the corner-pinned version I built — it wasn't the right read).

### 3. Source-of-truth + audit fixes

- **Update memory** `mem://design/cinematic-card-stack` → rename to `mem://design/trainer-to-platform-composite`, rewrite to describe the new pattern + the three locked compositions + the H3 = `BlockHeading` rule. Update `mem://index.md` accordingly.
- **Add a Core rule** to `mem://index.md`: *"50/50 block H3 = `BlockHeading` (28 → 36). Section H2 = `SectionHeading` (30 → 40). Hand-rolled `font-display text-[Npx]` for these is forbidden."*
- **Run** the `doc-sync-source-of-truth` audit after the changes land — no doc rewrite needed, just confirm clean.

### 4. Proof on visibility only

- Wire the new `TrainerToPlatformComposite` into Capability 1 on `/features/visibility` using `composition: "card-trail"` so you can review the pattern live before I propagate it to the other capabilities or pages.

## What I will NOT do in this pass

- No changes to `/for-professionals` hero, section H2s, or section structure — only the in-block H3 size.
- No changes to other pillar pages' content (shop-front, ai, operations, coaching, growth).
- No new image assets generated — reuse `hero-visibility-bg`.
- No backend/data, no animations beyond the existing 80/160/240ms stagger already in use.
- No new radii, no new colors, no new shadow tokens.

## Files touched

- **Create** `src/components/marketing/BlockHeading.tsx`
- **Create** `src/components/marketing/TrainerToPlatformComposite.tsx`
- **Delete** `src/components/marketing/CinematicCardStack.tsx`
- **Edit** `src/components/features/PillarPage.tsx` (swap import, swap heading)
- **Edit** `src/components/marketing/ProductBlock.tsx` (swap heading)
- **Edit** `src/components/features/FeaturePageLayout.tsx` (swap heading)
- **Edit** `src/routes/features.shop-front.tsx` (3 headings)
- **Edit** `src/routes/features.ai.tsx` (2 headings)
- **Edit** `src/routes/features.visibility.tsx` (Cap 1 → new composite)
- **Edit** `mem://index.md`, **rename** `mem://design/cinematic-card-stack` → `mem://design/trainer-to-platform-composite`
