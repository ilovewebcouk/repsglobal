# New bespoke hero image for /for-professionals

## What we're building

A new photographic hero image, generated specifically for this page — not a re-crop of the existing trainer photo. Subject: **wide premium gym interior, no people**. Mood: **moody, low-key, dramatic**. Used as a **full-bleed background** behind the hero copy and device cluster.

## Image direction (prompt brief for generation)

- Wide architectural shot of a premium private training gym interior, shot at eye level, slight wide-angle.
- No people in frame.
- Equipment as quiet supporting cast: a power rack on one side, a loaded barbell on rubber flooring, a row of kettlebells, plates stacked on a tree. Not cluttered — composed and intentional, like a Nike Training Club shoot or a Equinox brand still.
- Lighting: single warm light source from upper-left (window or pendant), deep shadows falling right. Low-key, high contrast, cinematic. Warm amber highlights, near-black shadows.
- Palette tuned to brand: black/charcoal base, warm amber/orange highlights echoing REPs orange (no neon — natural warm tungsten).
- Atmosphere: still, pre-session, "the floor before the work starts." Slight haze in the air to catch light.
- Composition note: leave the **center and right-of-center darker / negative space** so headline + device cluster sit cleanly on top with no clutter behind them. Light interest concentrated in upper-left third.
- Aspect ratio 16:9, generated at high resolution for hero use.

## How it's used in the hero

```
┌─────────────────────────────────────────────┐
│  [moody gym photo, full-bleed]              │
│   ╲ dark gradient overlay ╱                 │
│                                             │
│   Headline + subcopy        [laptop+phone]  │
│   CTAs                                      │
│                                             │
│  [floor seal → Act 1]                       │
└─────────────────────────────────────────────┘
```

Changes vs current hero:
1. Replace the current left-anchored trainer photo with the new full-bleed gym photo behind the entire hero.
2. Overlay tuned for legibility — darker behind the copy/device columns, lighter where the gym light naturally falls so the room is still readable as a real space (not a black rectangle).
3. Keep the existing orange radial glow (top-left) but reduce its intensity so it complements the in-photo warm light rather than competing with it.
4. Keep the existing `bottom-0` floor seal so the hero still resolves into Act 1's solid dark.
5. Devices get a subtle `ring-1 ring-white/10` + soft warm drop shadow so they read as floating on top of the room, not pasted on.
6. Remove the old trainer photo asset reference from the hero (keep the file on disk for now; we can prune later).

## Technical details

- New asset generated via image generation, saved to `src/assets/for-pros-hero-gym.jpg` (or `.png` if transparency ever matters — not needed here), then externalized via `lovable-assets` to a `.asset.json` pointer so the binary doesn't bloat the repo.
- Imported in `src/routes/for-professionals.tsx` and applied as a `background-image` on the hero `<section>` (or an absolutely-positioned `<img>` with `object-cover` + `object-position: center`).
- Gradient overlay: a layered `bg-gradient-to-r from-reps-ink via-reps-ink/70 to-reps-ink/85` + a vertical `from-transparent to-reps-ink` floor seal — both above the image, below content.
- No new design tokens needed. No changes to Act 1, proof band, or anything below the hero in this step.
- No copy changes. No route/data changes.

## Out of scope

- Proof band restructure (separate decision — still open).
- Any other page.
- Any second image (e.g. behind device cluster). We'll judge from this first.

## Verification

- Take a 1440px screenshot after wiring it up. Confirm: gym is clearly visible as a real room, headline + subcopy + CTAs are fully legible, devices pop, transition into Act 1 is seamless.
- Spot-check mobile (375px) and tablet (768px) — image should re-anchor so the lit area stays in frame and copy stays legible.
