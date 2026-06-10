## What went wrong

The A/B/C images I just generated washed warm amber across the entire frame — face, tee, pavement, walls all golden. The actual lookbook (Independence + Professionals, re-attached by you) is the opposite:

- **Foreground is cool / neutral grey** — concrete, raw steel, charcoal, dark cladding. Subject's face and tee read NEUTRAL, not orange.
- **Warm sun is back-light only** — a narrow band on the far horizon, a rim through a doorway, a glint on a hairline. It never bathes the subject.
- **Overall grade is muted, slightly cool, almost desaturated**, with a single small zone of warm amber as accent. Not "golden hour wash".
- **35mm grain, shallow DoF, no overlays** — same as before.

That's why A/B/C looked "tangoed" and Professionals/Independence look like the same photographer.

## Memory rule to save first

Add a new core memory `mem://design/lookbook-grading` so this never happens again:

> All `/about` and brand editorial photography follows the same grade as `about-independence` + `about-professionals`: **cool neutral grey foreground (concrete, steel, charcoal), warm amber light ONLY as backlight / rim / distant horizon — never as overall wash**. Subject's face and tee must read neutral. Charcoal heather REPS tee. Pure-white REPS left-chest embroidery. Shallow DoF, soft 35mm grain. No graphic overlays. Reject any frame where the face or tee is amber-tinted.

Add this both as a memory file and a one-line reference in `mem://index.md` Core.

## Three fresh options (correct grade)

All four constants:
- Cool neutral-grey foreground; subject's face + tee read NEUTRAL.
- Warm sun appears ONLY as backlight (doorway, distant horizon, slim rim).
- Charcoal heather REPS tee with blank chest first, then real `logo.svg` composited as small pure-white left-chest embroidery.
- 4:5 portrait, shallow DoF, soft 35mm grain, no overlays/text/extra logos.
- Different subject from the About hero, so the page doesn't repeat one face.

**Option D — Doorway** *(closest sibling to Professionals)*
Male coach mid-30s, leaning in the concrete-frame doorway of a raw warehouse studio. Cool grey concrete walls dominate. A narrow band of warm sun comes through the open doorway behind him, lighting the far back of the gym amber. Face and tee neutral. Quiet listening posture, no client visible.

**Option E — Pavement at dawn** *(direct sibling to Independence)*
Female coach early 30s, walking toward camera on a cool grey concrete pavement past dark cladding + steel-frame glass. Sun is a thin warm strip on the far horizon only. Face and tee neutral grey. Hair tied back, calm composed expression. Kit bag over shoulder.

**Option F — Concrete steps consultation**
Male coach mid-30s, standing at the base of concrete steps outside a modern studio, talking to a client who is OUT OF FRAME (only a blurred client shoulder/hand at the edge). Cool grey concrete + dark glass dominate. Slim warm rim on shoulder/hair from low sun behind-left. Face and tee neutral. Holding a folded paper or phone, mid-explanation.

## Process

1. Save the lookbook memory rule (`mem://design/lookbook-grading`) + update Core in `mem://index.md`.
2. Generate three base 4:5 portraits (D / E / F) with the corrected grade — explicit "cool neutral grey foreground", "warm light only as backlight/rim/horizon", "subject's face and tee must read neutral, NOT amber".
3. Composite the real `logo.svg` onto each as small pure-white left-chest embroidery.
4. Render the three side by side for you to pick.
5. On pick, upload via `lovable-assets create` and overwrite `src/assets/about/about-heritage.jpg.asset.json`.

## Out of scope

- No layout, copy, or other-asset changes to `/about`.
- No re-grading of Independence, Professionals, or the About hero.
