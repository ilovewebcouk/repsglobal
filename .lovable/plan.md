## Hero QA pass — findings

Screenshots taken at 4 breakpoints:

| Viewport | Result |
|---|---|
| **1920 desktop** | World-class. Subject perfectly framed on the right, copy column clean on the left, faint "REPS" wall texture adds editorial depth. ✅ |
| **1440 desktop** | World-class. Same composition holds; gradient wash keeps headline + search panel fully legible. ✅ |
| **820 tablet (iPad Air portrait)** | **Issue.** Hero is pure black with copy on the left and a large empty void on the right — feels underwhelming vs. desktop. Image is gated behind `lg:` (≥1024px). |
| **390 mobile (iPhone)** | World-class for mobile. Solid black is correct here — copy stacks cleanly, search panel stacks vertically, trust row reads well. ✅ |

## What to change

**`src/routes/index.tsx`** — hero image wrapper (line 138):

- Change `hidden lg:block` → `hidden md:block` so the image appears from 768px upward.
- Tighten `object-position` at the md range so the subject still sits clear of the copy column on narrower tablets. Use a responsive utility: `object-[88%_30%] lg:object-[78%_30%]` (pushes subject further right on tablet where the copy column is proportionally wider).
- Keep the gradient overlay unchanged — it already fades from 78% black on the left to transparent at 65%, which works at both breakpoints.

Mobile (<768px) stays solid black — confirmed correct.

## Out of scope
No changes to copy, search panel, trust row, header, or the press marquee below the hero. Desktop and mobile are untouched.

## Result
Hero reads as a premium photograph from 768px and up, with no dead black space on iPad portrait, while mobile retains its clean editorial black treatment.
