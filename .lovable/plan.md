# Right-size the REPs wordmark on /compare

The current `<RepsWordmark>` sizing on `/compare` uses the height of the competitor *lockups* (icon + wordmark). But competitor logos are icon-heavy: the actual wordmark glyph inside "TRAINERIZE", "mypthub", "PTDistinction" only occupies roughly 60% of that height. The icon takes the rest. REPs is a pure wordmark with no icon, so at the same pixel height it reads ~50–70% larger than the competitor wordmarks beside it.

Fix is to scale REPs to match competitor *wordmark glyph* cap-height, not lockup height.

## Changes

### 1. `src/components/marketing/PlansLimitsSummary.tsx` (line 45)
REPs Pro row inside "Plans & limits at a glance":
- Was: `<RepsTierWordmark tier="pro" className="h-[18px] text-white" />`
- New: `<RepsTierWordmark tier="pro" className="h-[13px] text-white" />`

Matches the visible cap-height of the "mypthub" / "PTDistinction" wordmark glyphs in the competitor rows below (logoHeight 20–24 lockups → ~13px wordmark text).

### 2. `src/components/marketing/CompetitorCompare.tsx` (line 93)
Feature-by-feature table REPS column header:
- Was: `<RepsWordmark className="h-[22px] text-reps-orange lg:text-reps-orange" />`
- New: `<RepsWordmark className="h-[15px] text-reps-orange lg:text-reps-orange" />`

The column header row sets competitor logos at h=20–24; the actual wordmark text inside those is ~14–15px. 15px aligns REPS with that.

### 3. `src/components/marketing/HeadToHead.tsx` (line 235)
Same component used on each `/compare/reps-vs-*` page header — applies the same correction:
- Was: `<RepsWordmark className="h-[22px] text-reps-orange" />`
- New: `<RepsWordmark className="h-[15px] text-reps-orange" />`

## Verification
After the edit I'll re-screenshot `/compare` and zoom into both the Plans & limits row and the Feature-by-feature header so we can confirm REPs visually balances against TRAINERIZE / mypthub / PTDistinction wordmark text — not their lockup height.

## Out of scope
- Header / footer / auth wordmark sizes (correct as-is — those don't sit beside competitor lockups).
- Pricing-page Pro card or other Verified/Studio wordmark placements.
- Replacing competitor `<img>` logos.
