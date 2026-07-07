## Goal
Make the sticky right-hand review rail on `/t/$slug` sit **dynamically** below the real header + sub-nav — never hidden under the nav bar, never crushed against its shadow.

## Brutal opinion
Yes, it's too tight. The header is `h-[72px]`, but the sub-nav row (`top-[64px]` — already 8px off from the real header height) adds ~48px more. The rail currently sticks at `lg:top-[116px]`, which is roughly flush with the bottom of the sub-nav. The nav's drop-shadow / backdrop-blur bleeds right into the top of the "What Learners Say" card, making the rail look like it's tucked *under* the chrome rather than sitting cleanly below it. It needs ~12–16px of breathing room, and the sub-nav offset itself needs to line up with the real 72px header, not 64px.

## Fix

**1. Correct the sub-nav offset**
`src/routes/t.$slug.index.tsx` line 727: change `sticky top-[64px]` → `sticky top-[var(--public-header-h,72px)]`.

**2. Measure the header + sub-nav at runtime**
Publish two CSS variables on `document.documentElement`:
- `--public-header-h` — real height of `PublicHeader`
- `--provider-subnav-h` — real height of the section sub-nav (`SectionNav` inside this route)

Use a small hook `useMeasuredHeight(ref, cssVar)` (ResizeObserver + `element.getBoundingClientRect().height`), wire it to the `<header>` in `PublicHeader.tsx` and to the sub-nav `<div>` in the route. Clean up on unmount. SSR-safe (guard `typeof window`).

**3. Dynamic sticky offset on the review rail**
`src/routes/t.$slug.index.tsx` line 554:
```
lg:sticky lg:top-[calc(var(--public-header-h,72px)+var(--provider-subnav-h,52px)+12px)]
```
The `+12px` is the breathing gap that stops the nav shadow from covering the card top. Fallback values (72 / 52) match today's measured chrome so SSR renders sanely before the observer fires.

**4. Scope**
- Frontend/presentation only — no data or server changes.
- Only touches `src/components/public/PublicHeader.tsx` (adds ref + hook call on the outer `<header>`) and `src/routes/t.$slug.index.tsx` (sub-nav ref, sub-nav top offset, rail top offset).
- New hook file: `src/hooks/use-measured-height.ts`.
- No visual change on any other route — the CSS vars are additive; existing components that don't use them are unaffected.

## Out of scope
- The generic `SectionNav` / coach-website sticky nav — they're on locked routes and aren't part of this complaint.
- Any redesign of the rail card itself.
