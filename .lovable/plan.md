## Goal

Lift `/cpd` from a long wall of dark sections to a page with real rhythm and one earned hero-grade visual moment mid-page — while confirming the two original empty bands are now closed.

## A. Verify the empty bands are closed (no edit unless gap is found)

Navigate to `/cpd`, take a full-page screenshot, and inspect the full section stack:

1. Hero → 2. ProfileScreenshot (new) → 3. WhatCpdIs → 4. RepsCpdSystem → 5. Qualifications → 6. GeneralistVsSpecialist → 7. VerifiedProviders → 8. DodgyCourses → 9. RaiseTheStandard → 10. ProviderCtaBand → 11. RegistersBlock → 12. VerifyStrip → 13. FaqBlock → 14. JoinRepsCta.

- The upper gap (was VenueMarquee) is filled by ProfileScreenshot.
- The lower gap (was PressMarquee, likely between FaqBlock and JoinRepsCta) needs visual confirmation. If a dead band of >120px is visible, tighten the `py-*` on `JoinRepsCta` (currently `py-16 lg:py-20`) so the dark hand-off reads as one section, not two.

No code change unless the screenshot proves a gap.

## B. Section rhythm (light/dark cadence)

Page currently alternates `bg-reps-ink` ↔ `bg-reps-panel-soft/40`. The `/40` opacity makes the "lifted" sections barely distinguishable — the page reads as one slab. Fix by swapping the four panel-soft sections to `bg-reps-midnight` (the same step the coach shop-front uses for its alternation), and lifting their inner cards from `bg-reps-panel` → `bg-reps-panel-soft` so card contrast holds.

Sections to convert (`bg-reps-panel-soft/40` → `bg-reps-midnight`):

- `RepsCpdSystem` (line 783)
- `GeneralistVsSpecialist` (line 1017)
- `DodgyCourses` (line 1180)
- `RegistersBlock` (line 1353)

Inside each of those four sections, swap card `bg-reps-panel` → `bg-reps-panel-soft` so the cards don't disappear into the new midnight surface. Borders stay `border-reps-border`.

No light/ivory section — the page is editorially heavy and the dark palette is intentional. Midnight gives genuine cadence without breaking the visual register.

## C. One hero-grade visual moment mid-page

Add a new full-bleed photo band, `<TutorMoment />`, placed between `<DodgyCourses />` and `<RaiseTheStandard />` in `CpdPage()`. This is the structural midpoint and breaks ~6 card-grid sections in a row.

Layout: 60vh-ish band, full-bleed background image of a tutor teaching at a CPD workshop (small group, focused, REPS wordmark on the tutor's polo per project core rule). Dark gradient overlay bottom-left for legibility. Overlaid content:

- Small orange eyebrow: "Inside a verified CPD course"
- Large pulled quote (font-display, ~32-44px): "The honest providers are already here. The rest are running a print shop for certificates."
- Caption row: "REPs — verified training providers"

The blockquote currently buried in `VerifiedProviders` (line 1138-1142) is removed when this band lands, so the quote is not duplicated.

Image source: generate via `imagegen--generate_image` (standard quality, 1920x1080, jpg). Save to `src/assets/cpd-tutor-moment.jpg`, then upload via `lovable-assets create` and write the `.asset.json` pointer. Prompt enforces: tutor in a fitness studio teaching 3-4 students at whiteboard or with anatomy chart, ALL-CAPS white REPS wordmark on left chest of polo (real print, not overlay), warm rim light from window, editorial photography, no on-image text.

Section uses `bg-reps-ink`, `rounded-none`, full-width image with the same dark→orange micro-gradient overlay used in the hero so it reads as a continuation of brand atmosphere, not a stock-photo drop.

## Implementation order

1. Screenshot `/cpd` and confirm whether any visible gap remains. If yes, tighten the `JoinRepsCta` padding in the same edit batch as B.
2. Edit `src/routes/cpd.tsx` — swap four section backgrounds + their inner card backgrounds (B).
3. Generate tutor image, upload via `lovable-assets`, write `.asset.json`.
4. Add `TutorMoment` component, remove the duplicate blockquote from `VerifiedProviders`, mount between `DodgyCourses` and `RaiseTheStandard` (C).
5. Re-screenshot `/cpd` end-to-end to confirm: no dead bands, clear ink/midnight cadence, one cinematic moment mid-page.

## Notes / constraints

- All colours via semantic tokens (`bg-reps-ink`, `bg-reps-midnight`, `bg-reps-panel`, `bg-reps-panel-soft`, `border-reps-border`, `text-reps-orange`).
- Radius rules preserved — no new radii introduced.
- REPS wordmark rule enforced on the generated tutor image (white, ALL CAPS, left-chest embroidery).
- No content/copy changes outside the moved blockquote.
- No backend work.
