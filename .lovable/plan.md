## Problem

On the directory card the logo tile is **white** (`bg-white`) with `p-1.5` on the image — so a white-background logo blends seamlessly into the tile and the padding just gives the artwork breathing room.

On the dashboard banner I kept the tile dark (`bg-reps-panel-soft`) and added `p-1.5`. Result: a dark ring around the white logo — which is what you're seeing and (rightly) hate.

## Fix

Match the directory card exactly in `src/components/dashboard/organisation/ProviderWelcomeBanner.tsx`:

- Logo tile background → `bg-white` (was `bg-reps-panel-soft`)
- Keep `p-1.5` inner padding so wordmark logos have breathing room
- `AvatarImage` uses `object-contain` so non-square logos aren't cropped
- Fallback (initials) tile: keep dark panel bg + white initials only when there's no logo — swap via conditional so we don't get white-on-white monograms
- Keep the size (`size-20`), radius (`rounded-[16px]`), border, and shadow as they are — that part matches the directory

Nothing else on the banner changes.

## Files

- `src/components/dashboard/organisation/ProviderWelcomeBanner.tsx` — logo tile only (approx lines 244–255)
