## Goal

Make `/find-a-training-provider` cards feel like real brands — matching the visual weight of the coach cards — by wiring each provider's existing hero image and logo into the card top, with a strong fallback so cards without a hero still look intentional.

## What changes

**One file:** `src/routes/find-a-training-provider.tsx` (`ProviderCardTile` component) + a small extension to the server function that already feeds it.

### 1. New card anatomy

Replace the current cream tile + centred icon with:

- **Top:** 16:9 media panel
  - If provider has `hero_image_url` → full-bleed `<img>` with `object-cover`
  - Else → deterministic branded gradient (hash of provider name → hue, kept within the REPS warm palette so it never clashes)
  - Bottom-to-top dark gradient wash (0 → 45% opacity) so the logo chip and any future overlay copy always stay legible
- **Logo chip:** 44×44, `rounded-[12px]`, white background, soft shadow, positioned bottom-left of the hero and overlapping the divider by ~12px
  - If `avatar_url` → `<img object-contain>`
  - Else → monogram (first letter of name) in REPS charcoal on white — no more generic Building2 icon
- **Body (unchanged structure, tightened spacing):** REPS Verified pill, provider name, tagline, city + delivery mode

### 2. Data

`listPublicProviders` currently returns `avatar_url` but not the hero. Extend `ProviderCard` with `hero_image_url: string | null` and pull it from `professional_websites` in the same query batch that already fetches profiles (single extra `.in('professional_id', ids)` select — no N+1). Providers with no website row simply get `null`.

### 3. Empty / loading states

- Skeleton height bumped from 200px → ~280px to match the new card so grids don't jump on load.
- `EmptyState` unchanged.

## Technical notes

- Hero uses `aspect-[16/9]` + `object-cover object-center` and `loading="lazy"` — same lazy pattern as `NewestCoachCard`.
- Gradient fallback: `#hash(name) % 30 + 20` → hue rotate within an orange→amber→sand band. Deterministic per provider so the same provider always renders the same fallback across visits.
- Logo chip uses `ring-1 ring-black/5` + `shadow-[0_6px_16px_-8px_rgba(0,0,0,0.25)]` to sit cleanly on either a photo or gradient.
- Radius: card stays 18px (locked), logo chip 12px, hero image inherits card top corners — no new radii introduced.
- No new dependencies.
- No changes to `/t/$slug`, admin, or the schema — we're only reading a column that already exists.

## Out of scope

- Editing the provider hero image (that lives in the provider's website editor already).
- Redesigning the `/t/$slug` provider page.
- Any change to coach cards.

## Acceptance

- Provider with a `hero_image_url` renders with real cover image + logo chip overlapping.
- Provider with no hero renders with a branded gradient + logo chip (or monogram) — never looks like a broken/empty card.
- Card feels visually equivalent in weight to the coach card grid on `/`.
- No layout jump between skeleton and loaded state.