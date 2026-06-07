## Verdict: 9.5/10 — one small polish remaining

I walked the page at 1440×900 (hero, Pillar 2, the testimonial feature, AI section, Pillar 6, pricing trio) and ran the compliance audit on radii, hex, UK qualifiers and `space-y-*` in the touched files.

### What's already at 10/10

- **Hero**: copy ladder, staggered fade-up, trust chips ("Verified credentials / 10-minute setup / Every feature included — no add-ons"), device cluster sizing — all on spec. "Explore features" now links to `/features/visibility` (no broken link).
- **Sticky CTA pill**: "See pricing" → `/pricing` ✓.
- **Pillar copy**: Pillar 3 bullet now reads "every payment goes to you, no REPs cut" (no banned phrase). Pillar 5 caption is "Plus risk flags across your full client list — included in every paid tier."
- **TestimonialFeature**: eyebrow correctly relabeled to "WHY COACHES SWITCH TO REPS"; quote names Trainerize; James Carter avatar renders.
- **Pricing trio**: locked 3-tier ladder (£99 / £59 Founding / £149), no banned "flat plan" language.
- **Final CTA**: "Compare platforms" + "See pricing", both correct.
- **Pillar 5 → 6 vertical band**: spacing tightened, no dead band.
- **Compliance audit**: no banned radii (`rounded-xl/2xl/3xl`, 14/20/28/32px), no banned orange hex (`#F28C38`, `#D87322`), no "UK"/"United Kingdom" tokens in this route or the components it owns. `ProductBlock` bullet list now uses `flex flex-col gap-2` (no `space-y-*`).
- **`imageLabel` dev placeholders**: cleaned to real captions on all five `ProductBlock` instances.

### The one remaining issue

**`TestimonialFeature` stat tiles word-break ugly at desktop.**

In the right-hand stats column, "£0 add-ons" wraps as "£0 add-" / "ons" — the hyphen sits at the line break and "ons" hangs on its own line. Cause: at `lg:grid-cols-1 xl:grid-cols-3`, each tile sits in a narrow column and the `dt` runs at 18–20px display bold, so the column can't hold "£0 add-ons" on one line. "+12 enquiries" and "Sundays back" wrap to two lines too, but they read fine; only "add-ons" looks broken because of the hyphenation.

### Fix (one file, two small edits)

**File:** `src/components/marketing/TestimonialFeature.tsx`

1. On the stats grid container, switch `xl:grid-cols-3` → `xl:grid-cols-1` so each tile gets the full sidebar width and the headline stays on one line. (Or alternatively keep 3-up at xl but drop the `dt` from `text-[18px]/[20px]` to `text-[15px]/[16px]` so each headline fits.)
2. Add `[word-break:keep-all] hyphens-none` (or simpler: a non-breaking hyphen "£0 add\u2011ons") on the affected `dt` so future similar terms ("add-ons", "drop-ins") never split mid-hyphen.

Preferred option: **(1)** — vertical stack at xl. It gives each stat room to breathe, matches the way the testimonial reads as a single vertical sidebar, and removes the wrap risk entirely without touching font sizes.

### Out of scope (not changing in this pass)

- Iframe contents inside the `ProductBlock` mock-ups (e.g. "London, Greater London" inside the `/c/james-wilson` shop-front preview) — those belong to the locked shop-front page, not `/for-professionals`.
- Hero device cluster, gradient stops, image crop.
- `RegisterProof`, `UseCaseTriad`, `TestimonialTriad`, `ForProsFaq` — already clean in prior passes.

Once that one fix lands, the page is a clean 10/10.