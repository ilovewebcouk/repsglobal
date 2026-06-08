# /cpd hero swap + professionalism pass

## 1. New hero (uses existing TutorMoment image + line)

Replace the current hero image and H1 with the existing TutorMoment asset (`cpd-tutor-moment.jpg`) and its quote line as the H1.

- **H1:** "The honest providers are already here. The rest are running a print shop for certificates."
  - Orange emphasis on "running a print shop for certificates."
- **Image:** `cpd-tutor-moment.jpg` (the in-classroom tutor shot) — replaces `cpd-hero-v5.jpg` as the hero LCP image, with preload + fetchpriority="high".
- Keep the rest of the hero scaffolding intact (eyebrow chip "CPD & Education", subhead, two CTAs, trust chips, regulator strip, staggered fade-up timings).
- Subhead unchanged in spirit, lightly tightened to flow under the new H1:
  > "REPs is the global standard for verified CPD. Every hour is logged quarterly, audited annually, and only counts when it's from a verified training provider."
- Delete the standalone `TutorMoment()` component and its render from `CpdPage`, since the line and image now lead the page.
- Delete the old `cpd-hero-v5.jpg.asset.json` after the swap (no other references).

## 2. Professionalism pass (cut the drift)

The user flagged the page is starting to read unprofessional. Concrete cuts:

1. **Remove the `GeneralistVsSpecialist` section entirely.**
   - The "GP / cardiologist / orthopaedic surgeon" analogy puts fitness next to surgery, which over-claims and lands as unserious. That logic already lives on `/specialisms`; CPD doesn't need it.
   - Removes the section render + the `<GeneralistVsSpecialist />` slot in `CpdPage`.

2. **De-slang the remaining body copy.** Targeted line edits only — no structural changes:
   - `RepsCpdSystem` → "No 'trust me bro'." → "Evidence attached to every entry."
   - `DodgyCourses` red flags → "a help-desk that ghosts you after the card clears" → "a help-desk that goes silent once payment clears."
   - `DodgyCourses` red flags → "Marketing is all 'earn £5k a month' income claims" → "Marketing leads with income claims instead of what you'll actually learn."
   - `RaiseTheStandard` → "Instagram 'online coaches' selling £400 PDFs" → "unqualified 'online coaches' selling generic PDFs as programmes."
   - `RaiseTheStandard` → "a chancer" → "an unverified one" (twice).
   - `RaiseTheStandard` final pull-quote → "Cheap coaching exists because nobody checks. REPs checks. Price accordingly." → "Standards are low because nobody checks. REPs checks. Verified professionals should price accordingly."

3. **Leave the H1 print-shop line alone** — it's editorial and on-brand for the hero, but we don't repeat that tone elsewhere on the page.

## 3. Out of scope (this pass)

- No layout changes to `ProfileScreenshot`, `WhatCpdIs`, `Qualifications`, `VerifiedProviders`, `DodgyCourses` structure, `RegistersBlock`, `VerifyStrip`, `FaqBlock`, `JoinRepsCta`, footer.
- No new images, no new sections, no design-token edits.
- FAQ copy untouched.

## Section order after this pass

```
Hero (new image + H1)
ProfileScreenshot
WhatCpdIs
RepsCpdSystem
Qualifications
VerifiedProviders
DodgyCourses
RaiseTheStandard
ProviderCtaBand
RegistersBlock
VerifyStrip
FaqBlock
JoinRepsCta
```

(removed: standalone `TutorMoment` + `GeneralistVsSpecialist`.)

## Technical notes

- Hero image swap: change `heroCpdAsset` import to point at `cpd-tutor-moment.jpg.asset.json`; update `og:image`, `twitter:image`, and `<link rel="preload">` automatically follow because they read `heroCpd`.
- After delete, run `rg "cpd-hero-v5"` to confirm no stale references before removing the asset pointer.
- `TutorMoment` is only used inside `cpd.tsx` — safe to delete the component definition along with its render.
