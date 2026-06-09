---
name: Hero overlay system
description: Locked 4-layer overlay primitive (HeroOverlay) used on every full-bleed marketing hero. Image-forward, copy-anchored, never re-implemented inline.
type: design
---

# Hero overlay system — LOCKED 2026-06-09

Single source: `src/components/marketing/HeroOverlay.tsx`. Every full-bleed
image hero on a marketing/pillar page uses this primitive. **Never re-implement
the layer stack inline in a route file** — change the primitive instead.

## Recipe (5 layers, top to bottom in DOM order)

1. **Mobile flat wash** — `bg-reps-ink/55 lg:hidden`. Copy spans the full
   width on small screens, so the whole frame needs even legibility.
2. **Desktop directional linear gradient** — copy side `0.72 → 0.55 → 0.20 → 0`
   across ~78%. Photo side stays fully clear. `hidden lg:block`.
3. **Soft radial darken** anchored behind the copy column at ~0.32 opacity for
   headline anchoring without crushing the photo. Mobile uses a centred
   variant at 0.55.
4. **Warm brand-orange glow** (≤0.12) in the top corner on the copy side.
   Atmospheric only — never used for emphasis.
5. **Bottom fade to `reps-ink`** — `h-32` mobile, `h-56` lg — for section handoff.

## API

```tsx
<HeroOverlay copySide="left" />            // default
<HeroOverlay copySide="right" />           // mirror for right-anchored copy
<HeroOverlay copySide="left" intensity="soft" />  // bright/low-contrast photos
```

- `copySide` ("left" | "right", default "left") — which side the headline sits on.
- `intensity` ("standard" | "soft", default "standard") — drop to soft only when
  the standard wash crushes detail on a particularly bright photo.

## Usage pattern in a route

```tsx
<section className="relative flex min-h-[640px] overflow-hidden lg:min-h-[780px]">
  <img src={heroImg.url} alt="..." className="absolute inset-0 h-full w-full object-cover object-center lg:object-right" />
  <HeroOverlay copySide="left" />
  <div className="relative mx-auto ...">{/* copy */}</div>
</section>
```

## Wired routes (audited at lock time)

- `/features/operations` (operations baseline — the look this recipe was tuned to)
- `/features/visibility`
- `/features/shop-front`
- `/cpd`
- `/specialisms`

## Intentional exception

`/for-professionals` does NOT use HeroOverlay. Its hero is a backdrop-plus-device-cluster
composition (copy left + interactive device cluster right), not a single subject
photo, so it keeps its own balanced overlay stack. If we ever swap that hero to a
single-subject photo, migrate it to HeroOverlay then.

## What this replaces

Five near-duplicate inline overlay stacks (each ~13 lines of arbitrary
linear/radial values). Any drift between them is now impossible — there is one
file to tune.
