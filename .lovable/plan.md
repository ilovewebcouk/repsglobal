## Goal

Replace the homepage H1 on `src/routes/index.tsx` with a plain, direct, client-facing line that leads with a defensible rank claim. Orange accent on `#1` only.

## New H1

> **The world's #1 register of verified fitness coaches.**

- `#1` in orange (`text-reps-orange`).
- Everything else pure white.
- One typographic size — drop the shrunken third line (`for Fitness Professionals`). The new line is self-contained and doesn't need a subtitle tacked underneath.

## Why this line (brutal version, for the record)

- **"#1 register"** is a real, defensible claim. There isn't a competing global register of verified fitness coaches. "#1 way to book" or "#1 platform" would not survive scrutiny — "register" does.
- **"Verified coaches"** puts the promise on the visitor's side (they get someone real), not on REPS' side (we're a standard).
- **Plain sentence, full stop.** No two-tier "The World's / Trusted Standard / for Fitness Professionals" split where the eye reads three different weights. One line, one thought, one full stop.
- **Matches the subhead.** Subhead already says "25,000+ verified fitness professionals. Real qualifications. Real reviews. Book in 30 seconds." H1 now sets up that promise instead of fighting it.

## Change (single file)

**`src/routes/index.tsx`** L240–L249 — replace the three-span H1 with a single-line H1:

```tsx
<h1
  className="animate-rise-in font-display font-bold leading-[0.98] tracking-[-0.035em] text-white text-balance text-[44px] sm:text-[60px] lg:text-[76px]"
  style={{ animationDelay: "120ms" }}
>
  The world&rsquo;s <span className="text-reps-orange">#1</span> register of verified fitness coaches.
</h1>
```

Notes:
- Drops `lg:text-[80px]` a hair to `76px` so a longer single sentence still fits on two lines at desktop without wrapping ugly. `text-balance` handles line breaks.
- Leaves the subhead, search, chips and trust row untouched.
- No changes to any other route, component, memory, or token.

## Out of scope

- No changes to the hero image, overlay, search, chips, trust strip, or "Newest coaches on REPS" grid.
- No copy changes on any other page.
- No SEO/meta changes (the route `<title>` is already generic REPS).

## Verification

- Visual check at 1440, 1280, 768, 390: H1 fits on two lines desktop / three lines mobile, orange `#1` sits inline, subhead still reads.
- `bunx tsgo --noEmit` clean.
