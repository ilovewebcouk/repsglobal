## Goal

Keep `/cpd` as the **learner-first** Education Authority page (hero stays — you like it). Tighten the rest of the page around one job: helping a student / PT / yoga or Pilates teacher decide *"is this course actually any good?"*. Then, in a follow-up, build a dedicated `/training-providers` sales page modelled on the old REPs training-provider-membership page.

The old training-provider page reveals what providers buy from REPs: **course endorsement, the REPs badge on their marketing, directory listing, student reviews.** That's exactly what learners need to *recognise* — so we surface that signal from the learner side, without turning `/cpd` into a sales pitch.

## What's wrong today

- The page explains REPs' position (regulators → providers → REPs) well, but never names the *one signal a learner actually sees in the wild*: the **REPs Endorsed Course** badge on a provider's website / course page.
- `VerifiedProviders` reads slightly provider-pitchy ("dual benefit for students and providers"); on a learner-first page it should be 100% learner-framed.
- `JoinRepsCta` secondary button ("List your training organisation") currently sits with no destination — should send providers off to the dedicated page.

## Plan — edits to `src/routes/cpd.tsx` only

1. **Hero** — leave as-is (locked by your feedback). Sub-copy already reads learner-side. No changes.

2. **New section: `EndorsedBadge`** (insert between `RepsPosition` and `ProfileScreenshot`)
   - Heading: *"The one mark to look for on any course"*
   - Visual: a mock course-listing card on a provider's site with a "REPs Endorsed Course" badge top-right; arrow callouts to the badge + to a "Verified on the REPs register" line.
   - 3 short bullets explaining what the badge means: *reviewed against published criteria · re-checked annually · listed on the public register so you can verify it yourself*.
   - One subtle "Don't see the badge? Check the register" link to `#verified-providers`.
   - No new asset generation needed — render the mock card in JSX (same `BrowserFrame` pattern already used in `ProfileScreenshot`).

3. **`RepsPosition`** — keep, trim the third actor card's copy to land on the Pilates/yoga point in one sentence instead of two.

4. **`ProfileScreenshot`** — keep. Tweak heading from *"This is what verified CPD looks like to your clients"* → *"And here's how that course shows up on your REPs profile."* (Connects the badge story to the profile, learner-side narrative.)

5. **`Qualifications`** — keep as-is.

6. **`DodgyCourses`** — keep. Add one bullet to `GOOD_SIGNS`: *"Carries the REPs Endorsed Course badge (verify on the register)."* Add one to `RED_FLAGS`: *"Claims 'REPs approved' but isn't listed on the public register."*

7. **`VerifiedProviders`** — re-frame fully learner-side:
   - Heading: *"The verified training provider register"*
   - Lede: *"Every provider here has had their courses reviewed against REPs criteria, carries valid insurance, and is re-checked each year. Search by discipline, location or qualification."*
   - Remove the "and providers" / dual-benefit copy. Drop the "more profitable" angle.

8. **`JoinRepsCta`** — make the primary CTA the learner action ("Find a verified course") and the secondary CTA *"Are you a training provider? →"* linking to `/training-providers` (route stub to be created in the follow-up build; safe `<Link to="/training-providers">` will compile once that file exists — for this turn, use a plain `<a href="/training-providers">` to avoid the strict route check, then upgrade to a typed `Link` when the route is added next).

9. **FAQ** — add one Q: *"How do I check if a course is genuinely REPs-endorsed?"* → answer points to the register and the badge.

## Out of scope (next turn)

- New `/training-providers` route modelled on the old training-provider-membership page (Endorsed Training Provider hero, Meeting Industry Standards block, 6-benefit grid, single annual price card). Fresh copy in current REPs voice — not a copy-paste of the legacy page.
- No new image generation, no token changes, no other locked pages touched.

## Files

- `src/routes/cpd.tsx` — all of the above (one file).
