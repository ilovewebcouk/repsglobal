## Goal

Make `/for-professionals` and `/features/visibility` use the same vertical rhythm so they line up when flicked side-by-side, and codify the rule so future marketing pages inherit it.

## Shared marketing rhythm (new standard)

| Slot | Mobile | Desktop |
| --- | --- | --- |
| Hero | `pt-24 pb-20` | `lg:pt-28 lg:pb-24` |
| Standard section | `py-20` | `lg:py-28` |
| Tight "proof strip" right under hero (optional) | `pt-10 pb-16` | `lg:pt-12 lg:pb-20` |
| Final CTA | `py-20` | `lg:py-28` |

Rules:
- One tight proof strip allowed immediately after hero. Every other section uses the standard slot.
- No more `py-24 lg:py-28`, no more `py-20 lg:py-24` — those are the two off-by-one rhythms causing the drift.
- Hero anchoring memory (`lg:pt-24`–`lg:pt-28`) stays valid; we're locking the upper bound (`lg:pt-28`) as the standard.

## Changes

**`src/routes/for-professionals.tsx`**
- Hero (line 122): `pb-20 pt-20 lg:pb-20 lg:pt-24` → `pt-24 pb-20 lg:pt-28 lg:pb-24`.
- RegisterProof strip (line 210): keep tight, normalise to `pt-10 pb-16 lg:pt-12 lg:pb-20`.
- First ProductBlock (line 231): `pt-16 pb-24 lg:pt-20 lg:pb-28` → `py-20 lg:py-28`.
- ProductBlocks at lines 252 / 274 / 295: `py-24 lg:py-28` → `py-20 lg:py-28`.
- TestimonialFeature (line 318): `py-20 lg:py-24` → `py-20 lg:py-28`.
- Hero-style closer panel (line 329): leave as-is (it's a second hero/CTA panel, not a section — flag if you want it normalised too).
- Next block (line 381): `pt-20 pb-24 lg:pt-20 lg:pb-28` → `py-20 lg:py-28`.
- Lines 404 / 477 / 492 / 511 (`py-20 lg:py-24` and `py-24 lg:py-28`): all → `py-20 lg:py-28`.

**`src/routes/features.visibility.tsx`**
- Hero (line 258): already `pt-24 pb-20 lg:pt-28 lg:pb-24` ✅ — no change.
- Problem section (line 329): `py-20 lg:py-24` → `py-20 lg:py-28`.
- All other sections: already `py-20 lg:py-28` ✅.

## Verification

1. Run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` — must exit 0.
2. Screenshot both pages at 390 / 820 / 1280 and confirm the hero-to-first-section gap and section-to-section gaps line up when toggling between the two pages.

## Memory updates

- Update `mem://design/marketing-section-primitives` with the locked rhythm table above.
- Add a one-liner to Core: "Marketing rhythm: hero `pt-24 pb-20 lg:pt-28 lg:pb-24`; sections `py-20 lg:py-28`; one optional `pt-10 pb-16 lg:pt-12 lg:pb-20` proof strip under hero. No other paddings."
- Note the change in the `mem://design/locked-for-professionals` and `mem://design/locked-visibility` entries so the locks reflect the new rhythm.

## Out of scope

- `/specialisms`, `/cpd`, `/pricing`, other `/features/*` — flagged for a future sweep, not touched in this pass.
- Copy, imagery, component structure — unchanged.
- Re-adding PressMarquee — still banked.
