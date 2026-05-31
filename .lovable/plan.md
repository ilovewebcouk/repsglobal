## Revert large panels to p-6 (24px), keep strips and CTAs at p-4

### What
Restore 24px padding on all `rounded-[22px]` large panels across the three live pages. Strips (trust strip, search bar) and the profile CTA band stay at the current `p-4 / lg:p-5`.

### Files & exact edits

**`src/routes/pro.$slug.tsx`** — 8 large panels
- Lines 364, 386, 427, 441, 474, 507, 551, 624: `p-4` → `p-6` on every `rounded-[22px] border border-reps-stone bg-reps-warm-white` card (About, Services, Specialisms, Location, Qualifications, Trust & Assurance, Reviews, FAQ)
- Leave line 312 (trust strip — `rounded-[16px]`) untouched
- Leave line 662 (CTA band — `rounded-[18px]`, currently `p-4 / lg:p-5`) untouched

**`src/routes/find-a-professional.tsx`**
- Line 218 (filter sidebar, `rounded-[22px]`): `p-4` → `p-6`
- Leave line 174 (search bar `rounded-[22px] p-3`) untouched — already a strip
- Leave line 314 (stats band, `rounded-[18px]`, `p-4 / lg:p-5`) untouched

**`src/routes/index.tsx`**
- Line 283 (stats strip, `rounded-[22px]`, currently `p-4 / lg:p-5`): leave untouched — it's a horizontal strip, not a content panel
- Line 212 (hero aside, `rounded-[22px]`): `p-4 / lg:p-4` → `p-6 / lg:p-6` (this is a content panel, not a strip)
- Leave line 242 (search bar `rounded-[22px] p-3`) untouched
- Leave line 515 (testimonial-style card, `rounded-[18px]`) untouched

### Out of scope
- No radius, color, typography, or layout changes
- Service cards (`rounded-[18px]`) keep their inner `p-4`
- Sticky sub-nav, footer, hero unchanged
- No memory/doc updates

### Verify
- Preview `/`, `/find-a-professional`, `/pro/james-carter` and `/pro/sophie-taylor` at 1469px
- Confirm large panels feel like rooms again (24px breathing room around headings)
- Confirm strips and CTA band still feel tight and horizontal
- Spot-check 375px mobile