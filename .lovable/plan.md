## Problem

At 390px, the For-Pros CTA image uses `aspect-[4/3]` + `object-[72%_center]`. The source `cta-band.jpg` (1584×672, 2.36:1) places the woman at ~59% horizontal and the man at ~87%, with the man's right shoulder reaching ~96% of the frame. Current crop clips the man's right arm and leaves the pair noticeably left-of-center.

## Fix

In `src/routes/index.tsx` (line ~489), change the CTA image classes:

- **Mobile**: widen the crop ratio from `aspect-[4/3]` to `aspect-[16/10]` so the framed window is wider and less aggressive vertically, then bias the crop right with `object-[78%_center]`. Net result: empty rack visible on the left, woman just left of centre, man fully in frame on the right — pair visually centred.
- **`sm` (640+)**: `sm:aspect-[2/1] sm:object-[72%_center]` — even wider window as the column grows, less right-bias needed.
- **`md` (768+)**: unchanged behaviour — `md:aspect-auto md:h-full md:object-[60%_top]` stays.
- **`lg` (1024+)**: unchanged — `lg:object-center` with the left-to-right ink fade.

Final class string:

```
aspect-[16/10] w-full object-cover object-[78%_center]
  sm:aspect-[2/1] sm:object-[72%_center]
  md:aspect-auto md:h-full md:object-[60%_top]
  lg:object-center
```

## Verification

After edit, re-screenshot at 390px and 768px and confirm:
- Both trainers fully in frame (no clipped arm/shoulder)
- Pair sits roughly centred horizontally
- Rack/background still readable on the left
- Desktop ink fade unchanged at 1366px+

No other files touched. Pure presentation change.
