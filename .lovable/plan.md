# /features/ai — four targeted fixes

Scope: `src/routes/features.ai.tsx` only. No new components, no copy rewrites elsewhere, no memory changes.

## 1. Hero — drop the laptop mock-up

Match the other marketing pillar heroes (`/features/operations`, `/features/visibility`, `/features/shop-front`), which are copy-only over the hero photo.

- Remove the right-hand `<LaptopFrame><AiCommandCentreMock /></LaptopFrame>` column.
- Switch the hero grid back to a single copy column: same `max-w-[680px]` block, same eyebrow + H1 + lede + CTA row + trust-chip row, same staggered fade-up.
- Keep `HeroOverlay copySide="left"`, the hero image, and the locked vertical rhythm (`pt-24 pb-20 lg:pt-28 lg:pb-24`).
- Drop the now-unused `LaptopFrame` import. `AiCommandCentreMock` stays — still used in the AI Command Centre section further down the page.

## 2. "Across the whole workspace" — rebuild the 10-stage strip

The current `grid-cols-10` row produces ten cramped cards that don't read. Replace with a denser two-row layout that holds the same ten stages but actually scans.

- Swap the 10-column overflow scroller for a responsive grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (two rows on desktop, five up / five down).
- Increase per-card padding back to `p-5`, stage label `text-[11px]`, title `text-[15px]`, body `text-[13px]`.
- Keep the same 10 `WORKFLOW_STAGES` data and the same orange numeric eyebrow.
- Keep section background `bg-reps-panel/15` and the existing `SectionHeader`.

## 3. Nutrition — remove the standalone safety callout

Drop the orange `AlertTriangle` panel ("AI suggests. The professional decides. … not a substitute for a registered dietitian…") that sits under the nutrition `ProductBlock`.

- Removes one full sub-block from `NutritionSection`; the `ProductBlock` itself (with its "Drafts. Trainer reviews. Trainer approves." body and bullets) stays as the section's only content.
- The same "AI suggests, professional decides" message is already covered in the Control & Boundaries section and the FAQ, so nothing is lost.
- If `AlertTriangle` becomes unused after this edit, remove it from the lucide import list.

## 4. Human Control & Boundaries — shrink tile typography

The 2×2 tile grid currently uses `BlockHeading` (28 → 36px), which is the locked 50/50 in-block H3 scale and is too large for a 4-up tile.

- Replace `<BlockHeading className="mt-4">{title}</BlockHeading>` in each tile with `<p className="mt-4 font-display text-[17px] font-bold text-white lg:text-[18px]">{title}</p>`.
- Body text stays at `text-[14.5px] text-white/75`.
- Tile padding stays `p-7`, radius stays `rounded-[22px]`, icon chip unchanged.
- Leave the closing summary panel ("An operating layer, not an autopilot.") untouched — it's a full-width panel where `BlockHeading` is correct.

## Out of scope

- No changes to other sections (Problem split, AnnotatedMock, ProductBlocks for check-ins / programmes / ops / profile, AI Command Centre, Use cases, Tier comparison, FAQ, FinalCta).
- No content rewrites.
- No new shared components.
- No memory file updates — the page is still pre-lock.
