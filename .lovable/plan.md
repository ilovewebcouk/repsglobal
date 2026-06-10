
# /about audit — is this 10/10?

**Short answer: no — it's about 8/10 right now.** The structure, copy and editorial rhythm are world-class. But there are concrete, fixable defects across breakpoints that stop it from matching the homepage. Below is a section-by-section dissection from the screenshots I just took at 1440 / 820 / 375, followed by the fixes needed to take it to 10/10.

---

## What's working (keep)

- Hero crop, statement H1, eyebrow, dual CTAs and `HeroOverlay` are on-brand and match homepage quality.
- Stat band reads beautifully on desktop (4 tiles, 40px display, tracked eyebrows).
- Manifesto moment lands — the 52px display type + orange "into one place." is the page's emotional peak. Don't touch.
- Heritage section: 4:5 portrait + orange glow is genuinely cinematic on desktop.
- Trust section with 3 real `FeaturedProCard`s is the smartest move on the page — it instantly cohabits with the homepage and directory.
- Horizon close + FinalCta finish strong.

## Defects found (must fix to reach 10/10)

### 1. Mobile has horizontal overflow (CRITICAL)
At 375px, the body scrolls horizontally — the REPS logo is flush-left, but the `London` chip and CTAs sit off-canvas to the right, and the eyebrow/heading are cut off on the left. Root cause: the heritage section's decorative glow uses `-inset-x-6 -bottom-6` which extends 24px past the container on a viewport with no horizontal padding budget, and nothing clips it.
**Fix:** add `overflow-x-clip` (or `overflow-hidden`) to the page-root `<div className="min-h-screen ...">`, AND constrain decorative glows to `inset-0` inside their relative parent rather than negative `-inset-x-6`.

### 2. Tablet stat band clips the 4th tile
At 820px, `md:grid-cols-4` kicks in but the tiles + 18px tracking on labels overflow — only 2.5 columns are visible without horizontal scroll. Same overflow chain as #1 once it's fixed, but the tile content itself is also tight.
**Fix:** keep `grid-cols-2` until `lg:grid-cols-4` (not `md:`), and reduce label tracking to `tracking-[0.14em]` at `<lg`.

### 3. Heritage + Independence images appear blank on first load
Both use `loading="lazy"` and on a fast-scroll capture they render as empty `bg-reps-panel` panels for several hundred ms — visually identical to "missing image". The homepage equivalents use `fetchPriority="high"` for hero-adjacent imagery and don't lazy-load above-the-fold-ish editorial shots.
**Fix:** remove `loading="lazy"` from the four editorial images, or swap to `loading="eager"` for hero+heritage and keep lazy only for the two further-down shots. Add a skeleton shimmer class or low-res `background-image` placeholder on the wrapper so the panel never reads as empty.

### 4. "More than a directory / More than software" section is the weakest beat
Two paragraphs in a 2-column grid, centered eyebrow, no visual. After the trust section (three rich cards) and before the system-behind-the-listing section (rich portrait + pillar list), this is the page's only flat moment. On desktop it reads like a slide filler.
**Fix:** turn it into a 2-column **split panel** with a subtle vertical hairline, a brand-orange "/" or numeric pairing (`01 — For the public`, `02 — For professionals`), and a soft `bg-reps-panel/30` block treatment so it feels deliberate. Optionally add one icon per side (`Users` / `Briefcase` from lucide) at 24px in `text-reps-orange`.

### 5. "Built for independence" image is competing, not supporting
The independence portrait at 3:4 fills the right column but the trainer is centered and front-lit identically to the heritage shot — at desktop they look like the same shoot twice. The page loses cinematic variety.
**Fix:** re-generate this single image as a wider, more atmospheric **environmental shot** (independent trainer walking out of a studio at dawn, kit bag over shoulder, REPS wordmark visible — landscape 4:5 OR full-bleed background with the editorial card overlaid). Different lens, different time of day, different framing.

### 6. Pillar list is correct but understated
The 6-row pillar list (`Visibility` … `Growth`) with `ArrowUpRight` is the same component pattern as the rest of the site, but on a brand/about page it deserves slightly more weight: labels could be `text-[22px]` on desktop, and the row should have a faint left-edge brand-orange tick on hover (4px wide, `bg-reps-orange/60`, fade in) to feel like the homepage's interactive moments.
**Fix:** label `lg:text-[22px]`, add `before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:bg-reps-orange before:opacity-0 group-hover:before:opacity-100` (with `relative pl-4` on the link).

## Nice-to-have polish (would push 9.5 → 10)

- **Stat band ticker:** count-up animation on first view (use existing `useInView` pattern if one exists, otherwise a tiny page-local hook). The homepage stat moments animate; this one doesn't.
- **Manifesto: stagger the four lines** with `animate-fade-in` and 0/120/240/360ms delays so it reads as a beat, not a paragraph.
- **Horizon close:** the radial glow is currently a single soft wash. Add a second narrower glow at 30% width to give the band depth — same technique as `/cpd` and `/features/visibility` hero overlays.

## Technical changes

| File | Change |
| --- | --- |
| `src/routes/about.tsx` | Add `overflow-x-clip` to root wrapper. Stat band: `grid-cols-2 lg:grid-cols-4` + reduced label tracking. Remove `loading="lazy"` from heritage image, keep on independence. Rebuild "More than a directory" block as a paneled split with numeric pairing + icons. Pillar rows: 22px labels, left-edge orange tick on hover. Manifesto: per-line staggered fade-in. Heritage/independence glows: replace `-inset-x-6 -bottom-6` with `inset-0 -z-10` inside `overflow-hidden` parent. |
| `src/assets/about/about-independence.jpg` | Regenerate via `imagegen` (premium) as a wider, dawn-lit environmental shot of an independent trainer leaving a studio — white REPS wordmark on tee, ALL CAPS. Replace the `.asset.json`. |
| (optional) `src/routes/about.tsx` | Tiny page-local count-up hook for stats, or import an existing one if present. |

## Out of scope

- No copy rewrites (your draft is the source of truth and is locked).
- No new sections — page stays at 10 sections.
- No changes to `FinalCta`, `HeroOverlay`, `SectionHeading`, `FeaturedProCard`, or any other shared marketing primitive.
- No second-pass changes to other marketing pages.

## Approval

Approve this and I'll ship all six fixes in one pass and re-screenshot 1440 / 820 / 375 to confirm 10/10 before handing back.
