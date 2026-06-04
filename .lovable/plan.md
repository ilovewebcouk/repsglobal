## Goal
Operations pillar hero should use the same layered style as `/for-professionals` but show a **different background image** so each pillar has its own visual identity.

## Changes

1. **`src/components/features/PillarPage.tsx`**
   - Add optional `heroImage?: { src: string; alt?: string }` prop.
   - Replace the hardcoded `heroGym.url` import with the prop value, falling back to the existing `for-pros-hero-gym.jpg` so other future pillars keep working.
   - Keep the entire overlay/gradient/vignette stack, eyebrow pill, two-line H1, dual CTAs, and `HeroDeviceCluster` exactly as-is.

2. **New asset: `src/assets/hero-operations-bg.jpg`**
   - Generate a moody, cinematic gym-operations image (same dark color grade and lens character as `for-pros-hero-gym.jpg`) — e.g. a trainer at a reception desk / tablet in a premium studio at dusk, warm rim light, low key, deep shadows. This visually says "running the business" rather than "training on the floor".
   - Upload via `lovable-assets` so it lives on the CDN like the existing hero.

3. **`src/routes/features.operations.tsx`**
   - Pass `heroImage={{ src: heroOperations.url, alt: "Trainer managing bookings on a tablet in a premium studio" }}` to `PillarPage`.
   - No other changes — copy, cluster routes, feature blocks, comparison strip, cross-links, and CTA stay identical.

## Out of scope
- Other pillar pages (Visibility / Coaching / AI / Growth) — they'll each get their own image in their own turn.
- Any changes to overlays, H1 structure, CTAs, or device cluster styling.
- No new design tokens.

## Files touched
- edit `src/components/features/PillarPage.tsx`
- create `src/assets/hero-operations-bg.jpg` (+ `.asset.json` pointer)
- edit `src/routes/features.operations.tsx`
