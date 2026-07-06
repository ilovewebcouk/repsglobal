# Provider hero: cover image + logo badge

## What changes
On `/t/$slug` (`src/routes/t.$slug.index.tsx`), the square media slot next to the H1 becomes a **cover photo with the provider's logo overlaid as a badge** — instead of a lonely logo on a white square.

Ratio stays the same (aspect-square, `rounded-[18px]`, 280px column at md+) so the page layout doesn't shift.

## Visual spec

```text
┌──────────────────────┐
│                      │  ← cover image (object-cover, full bleed)
│                      │
│                      │
│  ┌──────┐            │  ← logo badge, bottom-left
│  │ LOGO │            │     56×56, white card, rounded-[12px],
│  └──────┘            │     border border-black/8, shadow-sm,
└──────────────────────┘     inner p-2, object-contain, m-3
```

- Cover: `object-cover`, subtle bottom-to-top black/20 → transparent gradient so the badge always reads.
- Logo badge: white rounded card, 56–64px, `object-contain` inside, `p-2`, bottom-left corner with `m-3`.
- Fallback (no cover): soft branded gradient panel (`bg-gradient-to-br from-reps-warm-white to-[#efece4]`) with the logo centred at ~35% size. No more bare `Building2` icon on a white square.
- Fallback (no logo either): keep the current `Building2` icon.

## Data source

Training providers don't have a dedicated `cover_image_url` field yet, and adding one is a separate scope. For the two demo providers, use a small `DEMO_PROVIDER_COVERS` map alongside the existing `DEMO_PROVIDER_LOGOS`:

- `northline-fitness-academy` → generate one cover image (training studio / classroom scene)
- `forge-strength-institute` → generate one cover image (strength gym / coaching floor)

Both generated at 1200×1200 (matches the square slot cleanly), saved to `src/assets/providers/` and externalised via `lovable-assets`.

Later, when a real `cover_image_url` column is added to `professionals`, the resolution order becomes: `sf.cover_image_url ?? DEMO_PROVIDER_COVERS[slug] ?? null`. Out of scope for this pass.

## Files touched
- `src/routes/t.$slug.index.tsx` — replace the media slot markup (lines ~196–209), add `DEMO_PROVIDER_COVERS` map.
- `src/assets/providers/northline-cover.jpg.asset.json` (new, via `lovable-assets`)
- `src/assets/providers/forge-cover.jpg.asset.json` (new, via `lovable-assets`)

## Not doing (explicit)
- No schema change / no new `cover_image_url` column.
- No changes to the coach profile (`/pro/$slug`).
- No editor UI for uploading a provider cover — that's a Verified-settings task.
- No change to the JSON-LD `logo` field (still `sf.avatar_url`).

## Verify
- Visit `/t/forge-strength-institute` and `/t/northline-fitness-academy`: cover fills the square, logo badge sits bottom-left, name/breadcrumb layout unchanged.
- Visit a provider slug with no demo cover: gradient fallback + centred logo, no layout shift.
- `bunx tsgo --noEmit` clean.
