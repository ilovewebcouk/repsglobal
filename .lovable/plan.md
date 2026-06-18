# Featured card v3 — mirror the directory result card

Goal: The Featured rail card should read as a card-shaped version of the horizontal directory listing the user screenshotted. Same data shape, same pills, same icons, same orange CTA — just stacked into a portrait card.

## Visual spec (matches directory result card)

```
┌────────────────────────────┐
│  [4:5 headshot]    [Save]  │  ← Save = white circle, charcoal bookmark,
│                            │     hover→orange border+icon (same as directory)
├────────────────────────────┤
│ Hannah Thompson            │  18px display bold
│ [REPS VERIFIED] [PRO]      │  same pills as directory (green + orange)
│ Personal Trainer           │  12.5px muted (role only)
│ 📍 Clerkenwell  ★ 4.9 (128)│  12.5px row, MapPin + Star(orange)
│ 💻 In-person & Online      │  Laptop icon + mode
│ Support for every stage…   │  13px clamp-2 blurb (valueProp)
│ [Pre/post-natal] [Rehab]   │  ivory chips, max 2 + "+N"
│ ┌────────────────────────┐ │
│ │      View profile      │ │  SOLID orange button (rounded-[10px])
│ └────────────────────────┘ │
└────────────────────────────┘
```

## Changes to `src/components/public/FeaturedProCard.tsx`

**Remove**
- `fromPrice` / `priceCurrency` rendering (data props stay on the type so callers don't break, but nothing renders).
- Photo overlay scrims, overlaid Verified pill, glass rating pill (these don't exist on the directory card).
- Ghost/white CTA. Drop the `ChevronRight` import.

**Add / change**
- Save button: move off the photo into top-right of the photo area but restyle to match directory exactly — `rounded-full border border-reps-stone bg-white p-2 text-reps-muted-light hover:border-reps-orange hover:text-reps-orange`. No black glass, no orange fill.
- Below the photo, replicate the directory body block in order:
  1. Name (18px bold) + `VerificationPill` (REPS Verified) + tier pill (Pro/Studio) — import `VerificationPill` from `@/components/directory/VerificationPill` so it's pixel-identical.
  2. Role line (12.5px muted) — always the generic role ("Personal Trainer"), not the value prop, to match directory.
  3. Meta row (12.5px, flex-wrap, gap-x-3.5): `MapPin city`, `Star(orange) rating (reviews)` or `years experience` fallback when reviews=0, `Laptop mode`.
  4. Blurb: `valueProp` clamped to 2 lines at 13px (the directory's `pro.blurb`).
  5. Tag chips: ivory pills `rounded-full border border-reps-stone bg-reps-ivory px-2 py-0.5 text-[11px]` (directory style), max 2 + "+N".
- CTA: solid orange, same classes as directory desktop CTA — `rounded-[10px] bg-reps-orange px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-reps-orange-dark`, `mt-auto w-full` for equal heights.

**Props**
- Add optional `tier?: "verified" | "pro" | "studio" | null` so the Pro/Studio pill can render. Default `"verified"`.
- Add optional `identityStatus` / `verification` if `VerificationPill` requires them — match the directory call site.

## Data wiring

`fetchFeaturedPool` already selects tier, verification, identity_status — verify and pass them through `FeaturedProRow` → mappers in `src/routes/in.$location.tsx` and `src/routes/professions.$profession.tsx`. No DB migration; price columns stay but are unused by this card.

## Eligibility (unchanged from v2)

Keep current gates — avatar, identity_approved, quality≥60, headline, ≥1 specialism, avatar de-dup, value_prop required under quality 75. Don't tighten further this pass; Katie Gibbs will just get her `value_prop` filled in by a separate backfill if she's still missing one.

## Out of scope

- Database migration.
- Homepage rail (locked).
- Save/bookmark wiring (visual only, as today).
- Directory page changes.

## Verification

- Open `/professions/personal-trainer` and `/in/london` — featured cards should look like portrait clones of the result rows below: same pills, same icons, same orange button, no price anywhere.
- 4 cards equal height.
- Audit script exits 0.
