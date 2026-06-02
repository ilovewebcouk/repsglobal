# Mobile + Tablet Hero — Typography-Led, No Background Image

## Decision

Drop the background image on mobile and tablet. Keep desktop's full-bleed trainer hero exactly as it is now. Mobile and tablet get a solid `reps-black` hero where typography and the search card do the work.

## What changes

All edits in `src/routes/index.tsx`, hero section only (roughly lines 138–180). Nothing below the hero changes.

1. **Remove the mobile/tablet image block entirely** (current lines 142–152 — the `lg:hidden` div with `heroCoachingMobile`, the three scrim layers, and the flat `bg/20` wash).
2. **Keep the desktop image block** (`hidden lg:block`) unchanged — desktop hero stays exactly as-is.
3. **Add a subtle ambient layer for mobile/tablet only** so the solid black doesn't feel flat:
   - A soft orange radial glow anchored bottom-left behind the search card (`radial-gradient` using `reps-orange` at ~8% opacity, fading to transparent) — gives the search card a quiet halo without reading as decoration.
   - A faint top-to-bottom ink wash (`reps-ink` → `reps-black`) so the header chrome has a hair of separation.
   - Both are `lg:hidden` so desktop is untouched.
4. **Tighten hero vertical rhythm on mobile/tablet** — with no image to fill space, reduce `pb-16` slightly and let the headline breathe. Keep `pt-[140px]` to clear the fixed header.
5. **Remove now-unused imports**: `heroCoachingMobileAsset` import and the `heroCoachingMobile` const at the top of the file.
6. **Delete the mobile hero asset**: `src/assets/hero-coaching-mobile.jpg.asset.json` — no longer referenced anywhere. (The `lovable-assets delete` call also removes it from CDN.)

## What stays exactly the same

- Desktop hero (image, radial scrim, horizontal fade, positioning) — untouched.
- Headline copy, font, sizing, colour.
- Sub-headline.
- Search card markup, styling, radius, blur, orange button.
- Goal chips row.
- Trust row (avatars + "Trusted by 25,000+ clients worldwide" + rating).
- Header (`PublicHeader variant="transparent"`) — already works on solid black.
- Everything below the hero (stats, specialisms, featured pros, CTA band, footer).

## Why this is the right call

- The search card *is* the product on a marketplace — on a solid black surface it reads as the hero action, not decoration over a photo.
- Eliminates the mobile/tablet asset mismatch with desktop (different image, different framing).
- Faster mobile paint, no scrim-vs-subject fight, headline is unmissable.
- Consistent with how Whoop, Strava, and Nike Run Club treat mobile hero surfaces.

## Verification

After the edit I'll screenshot at:
- 390×844 (mobile) — confirm solid black hero, headline crisp, search card prominent, orange glow subtle behind it, smooth hand-off into stats section.
- 768×1024 (tablet) — same treatment scales cleanly, no awkward empty space.
- 1318×1019 (desktop) — confirm trainer hero is byte-for-byte unchanged.
