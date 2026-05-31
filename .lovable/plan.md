## Problem

The "Why REPs?" card sits in the top-right ~40% of the hero, which is exactly where the trainers' heads/faces land in the generated image. So the card covers their faces.

In the mock-up the card sits over the trainers' **bodies** (mid-torso), with their faces visible **above** the card. The difference is vertical positioning in the source photo: the mock has lots of headroom above the people; my generated image has them starting at the very top of the frame.

## Fix — two coordinated changes

**1. Regenerate `src/assets/hero-trainer.jpg`** with the subjects pushed lower in frame and shifted a touch left:
- Heads start around the 15–20% vertical mark (not flush to the top), so faces sit above where the card begins.
- Subjects horizontally occupy roughly the 45–90% band (not 55–100%), giving the right edge breathing room so `object-cover` doesn't clip the male trainer's shoulder.
- Same composition otherwise: female client + male trainer in REPs tee, looking at a tablet, dark gym on the left.
- Aspect ratio stays 21:9.

**2. Tighten `object-position` on the hero image** in `src/routes/index.tsx`:
- Replace `object-center` with `lg:object-[60%_30%]` so on desktop the crop favours the upper-right where the faces are, keeping them visible above the card.
- Mobile/tablet keep `object-center`.

No overlay change needed — the desktop gradient already clears by 55%, which works for the new horizontal positioning.

## Out of scope

No card layout change, no token change, no other sections.
