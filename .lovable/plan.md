## Goal

Prototype **one** circular CSCS-style credential seal — "Level 3 Personal Trainer / REPs Registered Professional / Est. 2002" — as a reusable, on-brand SVG component. Not wired into any locked page yet; just a preview route so you can review it in isolation.

## What I'll build

### 1. New component: `src/components/brand/RepsCredentialSeal.tsx`

A self-contained inline-SVG seal (no raster, no asset upload, no external font dependency at runtime — text on the curved paths uses Inter, which is already loaded site-wide).

**Anatomy (mirroring the CSCS reference):**

```text
   ┌─ outer ring (thin stroke)
   │     ┌─ curved text top arc: "LEVEL 3 PERSONAL TRAINER"
   │     │     · star separator left   star separator right ·
   │     │           ┌─ inner solid disc
   │     │           │      REPs        ← reuses RepsWordmark paths
   │     │           │     ──────       ← short hairline divider
   │     │           │    Est. 2002
   │     │           │       ®
   │     │     curved text bottom arc: "REGISTER OF EXERCISE PROFESSIONALS"
   │     └─ inner ring (thin stroke)
   └─ outer ring closes
```

**Props (typed, all optional except `qualification`):**

```ts
type Props = {
  qualification: string;          // top arc, auto-uppercased
  established?: number;           // defaults to 2002
  variant?: "dark" | "inverse";   // dark = ink on ivory (default), inverse = ivory on ink
  size?: number;                  // px, defaults to 240; viewBox stays fixed so it scales cleanly
  className?: string;
};
```

**Design rules followed:**
- All colours via existing tokens (`--reps-ink`, `--reps-ivory`, `--reps-text`, `--reps-border-soft`) — no hex in the component.
- Wordmark in the centre reuses the path data from `RepsWordmark.tsx` (single source of truth — if you ever tweak the master wordmark, the seal updates with it).
- Bottom arc text: **"REGISTER OF EXERCISE PROFESSIONALS"** — the institutional long-form, matching the CSCS pattern of using the full registering body's name. This is the credential's authority statement.
- Curved text via SVG `<textPath>` on hidden circular paths; tracking ≈ 0.18em for that engraved-seal feel.
- Tiny ® mark beside the wordmark, like CSCS.

### 2. Preview route: `src/routes/seal-preview.tsx`

A throwaway visual sandbox (not added to nav, `noindex`). Renders the seal at three sizes (96px favicon-ish, 160px badge, 320px hero) on both light and dark backgrounds so you can judge:
- Legibility of the curved text at small sizes
- Contrast in both variants
- How the centre stack balances with the ring

That's it — no other files touched, nothing added to nav, no locked pages disturbed.

## Out of scope (deliberately)

- The full qualification family (L2/L3/L4/Nutrition/etc.) — only L3 PT for sign-off
- Placement on `/specialisms`, `/pro/$slug`, or any locked page
- Tier-coloured "Pro" / "Studio" accent variants
- Raster export / PNG generation
- Logo replacement (separate conversation)

## Verification

After build I'll visit `/seal-preview` and screenshot all three sizes on both backgrounds to confirm: curved text reads cleanly at 96px, ring weights stay proportional, centre stack stays centred, no hex slipped into the component, no banned radii (it's all circles anyway).

Once you approve the L3 PT example, the same component handles every other qualification by changing one prop — so the follow-up plan to generate the full family is trivial.