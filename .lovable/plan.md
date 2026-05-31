## Tighten card padding site-wide to p-4

### What
Reduce padding on card/panel containers from `p-6` → `p-4` (and matching `lg:p-7` → `lg:p-5`) across all three live pages. Apply only to cards/panels with a visible border or background; do not change page-level section padding (`py-8`, `px-6/lg:px-10`).

### Files & exact edits

**`src/routes/pro.$slug.tsx`** (9 panels)
- Lines 364, 386, 427, 441, 474, 507, 551, 624: `p-6` → `p-4` on the 8 large `rounded-[22px]` section cards
- Line 662 (CTA band): `p-6 ... lg:p-7` → `p-4 ... lg:p-5`
- Leave line 312 (trust strip already `p-4 lg:p-5`) and service inner `p-4` unchanged

**`src/routes/find-a-professional.tsx`** (2 panels)
- Line 218 (filter sidebar): `p-5` → `p-4`
- Line 314 (stats band): `p-6 ... lg:p-8` → `p-4 ... lg:p-5`
- Leave line 174 (search bar `p-3`) and result card line 500 (`p-4`) unchanged

**`src/routes/index.tsx`** (3 panels)
- Line 212 (hero search aside): `p-5 ... lg:p-5` → `p-4 ... lg:p-4`
- Line 283 (stats strip): `p-6 ... lg:p-7` → `p-4 ... lg:p-5`
- Line 515 (testimonial-style card): `p-6` → `p-4`
- Leave line 242 (search bar `p-3`) unchanged

### Out of scope
- No radius, color, typography, or layout changes
- No mockup files, docs, or memory updates
- Phase 1 scope respected: visuals only

### Verify
- Preview `/`, `/find-a-professional`, `/pro/sophie-taylor` at 1469px
- Confirm cards feel tighter but text isn't hugging borders
- Spot-check mobile (375px) on the same routes