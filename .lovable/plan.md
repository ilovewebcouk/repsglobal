## Fix: For-Pros CTA image crop across breakpoints

### What I confirmed

- Source image (`src/assets/cta-band.jpg`) is **1584×672** (2.36:1, ultra-wide). Empty gym fills the left third; the two trainers stand in the right two-thirds (woman ~x=48%, man ~x=85%).
- Current rule on the `<img>` (`index.tsx:489`):
  `aspect-[4/3] w-full object-cover object-center md:aspect-auto md:h-full md:object-top lg:object-center`
- **Mobile (390 verified):** 4:3 crop + `object-center` lands on the empty rack between trainers — woman centered, only the man's arm visible at the right edge. Matches what you saw.
- **Tablet (md, 768–1023):** image switches to absolute fill of the panel with `object-top`. The panel is wide enough that both trainers are visible, but the horizontal default of `object-top` is centered — should be re-verified once the preview iframe stops collapsing.
- **Desktop (lg, 1366 & 1920):** `object-center` with the panel ~1240px wide shows both trainers cleanly behind a left-to-right ink fade. No change needed.

### Fix

One-line change to the image className:

```
aspect-[4/3] w-full object-cover object-[72%_center]
  sm:object-[68%_center]
  md:aspect-auto md:h-full md:object-[60%_top]
  lg:object-center
```

- `object-[72%_center]` on mobile shifts the 4:3 crop right so both trainers sit inside the frame (woman left of centre, man right of centre, gym rack as backdrop).
- `sm:object-[68%_center]` softens the shift as the frame widens.
- `md:object-[60%_top]` keeps the top-anchor at tablet but biases right so neither trainer is clipped.
- Desktop unchanged — already correct.

### Verification

After the edit, re-screenshot at 390 (mobile) and 1366 (desktop) to confirm both trainers visible and the desktop ink-fade still reads. Tablet (768) can't be reliably captured through the preview iframe right now — I'll spot-check via the published URL after deploy if you want.

Want me to push it?
