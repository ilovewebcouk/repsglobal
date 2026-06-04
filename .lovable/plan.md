# Fix the homepage hero image (composition, not style)

## Problem (verified from live screenshot at 1484px)

The current hero image is a good photograph but it was generated for a generic 3:2 frame, not for the left-aligned hero layout it's actually used in. On the live page:

- The "REPS" wall sign sits directly behind the headline → muddy text zone + double branding.
- The client's head and the coach's kettlebell-hand are clipping at the top-right and right edges of the viewport.
- Subjects' eye-line is in the top third; the bottom third is empty floor while the search bar floats over nothing.
- No real dark negative space on the left — the dark overlay has to do all the work, which flattens the photo.

## What to build

Regenerate ONE replacement image with composition rules tuned to the actual hero panel. No code/layout changes — only swap the asset.

### Image brief (premium tier, 16:9, 1920×1080)

- **Scene**: same world as the current hero — premium REPS-branded gym at golden hour, sunset cityscape through floor-to-ceiling windows behind a power rack. Moody, cinematic, dark.
- **Subjects (right 45–55% of frame only)**: female REPS coach actively cueing a male or female client mid-rep. Coach in a **black REPS polo with the REPS wordmark (ALL CAPS, small left-chest, embroidered)** clearly readable. Client in normal workout kit (visibly different from the coach — no athleisure-twins look).
- **Coaching gesture must read as expertise**: hand on hip cueing hinge, or tracing bar path — NOT a vague hand-near-shoulder hover.
- **Movement**: trainer's choice between a goblet squat cue, a Romanian deadlift hinge setup, or a kettlebell front-rack hold — whichever gives the strongest single image. Form must be textbook.
- **Framing rules (critical)**:
  - Subjects occupy the **right 45–55%** of the frame only.
  - Left 45–50% is **clean dark negative space** — gym floor, shadow, soft rim of warm light — **NO "REPS" wall sign**, no signage, no bright windows on the left.
  - Subjects' **eye-line in the lower-middle third** so the headline (top-left) and search bar (mid-left) don't fight the photo.
  - Safe margin of ~6% on the right edge — nothing critical (hands, kettlebell, face) within that margin so common viewport widths don't clip.
- **Lighting**: hard warm rim light from the sunset window behind subjects, soft fill from the left. More contrast than the current image — push it cinematic, not stock.
- **Wardrobe parity**: coach reads as a pro (polo + wordmark), client reads as a client (tank/tee + shorts or leggings). Not matching outfits.

### Implementation steps

1. Generate the new image (premium tier, 16:9, jpg) to `src/assets/home-hero-coaching-v2.jpg` via the agent-side image tool — bypasses asset CDN flow so we can iterate cheaply, then promote to `lovable-assets` once approved.
2. QA: open the generated file, verify (a) REPS wordmark on coach's polo is readable, (b) subjects are in right half, (c) left half is clean dark negative space with no signage, (d) nothing clips within 6% right margin, (e) eye-line is lower-middle.
3. If QA fails on any point, regenerate (max 2 retries) with sharpened brief — don't ship a "close enough" version.
4. Swap the import in `src/routes/index.tsx` to the new asset. Leave `home-hero-coaching.jpg.asset.json` and the legacy shim in place until you confirm the new image looks right live, then delete the old asset in a follow-up.
5. Take a live preview screenshot at 1484px (current viewport) AND at 1920px to confirm the composition holds at both widths.

### Out of scope

- No layout/overlay changes to the hero panel itself.
- No copy changes.
- No changes to any other page's hero or imagery.
- No changes to the pillars image — it's the reference standard, not a target.

## Files touched

- New: `src/assets/home-hero-coaching-v2.jpg` (then `.asset.json` after approval)
- Edited: `src/routes/index.tsx` (one import swap)
