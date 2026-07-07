## Scope

Homepage `/` — "Newest coaches on REPS" section only. Every other section on the locked homepage stays untouched. Palette, fonts, radii and grid columns are locked to the direction the user picked.

## 1. Rebuild `src/components/public/NewestCoachCard.tsx`

Replace the current stripped tile with the chosen card composition. Same `NewestCoach` type — no data-shape change.

**Card structure (per pro):**
- Outer: `Link to="/c/$slug"`, `group`, flex column, no border, no card background. The photo is the card.
- **Photo well** (`relative aspect-[4/5] rounded-[18px] overflow-hidden bg-reps-stone/40 mb-3`):
  - `<img>` fills, `object-cover object-top`, `transition-transform duration-300 group-hover:scale-[1.02]`.
  - **Verified pill**, top-left, overlaid:
    `absolute top-3 left-3 rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-300 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider` — copy: `Verified`. (Memory-approved token triplet; legible against dark portrait + blur.) Shown on every card — every REPS pro is verified by definition (matches the "no exceptions" copy elsewhere on the page).
  - **Hover CTA layer**: `absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200`. Contents: a soft top-to-bottom dark gradient `bg-gradient-to-t from-reps-charcoal/45 via-transparent to-transparent` and a bottom-anchored orange button `w-full bg-reps-orange text-white py-2.5 rounded-[10px] text-[13px] font-semibold shadow-lg translate-y-1 group-hover:translate-y-0 transition-transform`. Label: `View profile →`. Focus-visible ring for keyboard users.
- **Below the photo** (`space-y-1.5`):
  - Row 1 (flex justify-between items-start gap-2):
    - `<h3>` — `font-display text-[15.5px] font-bold text-reps-charcoal leading-tight truncate`.
    - Star chip — only when `pro.rating != null`: `flex items-center gap-1 bg-reps-ivory px-1.5 py-0.5 rounded-[6px]` with orange filled star (`w-3 h-3 text-reps-orange`) + `text-[11px] font-bold text-reps-charcoal` rating value; screen-reader label includes review count.
  - Row 2 — role: `text-[12.5px] text-reps-muted-light truncate` (uses existing `role` from `rowToNewestCoach`, which already maps to real profession labels).
  - Row 3 — location + trust microline: `flex items-center gap-2 text-[11.5px] text-reps-muted-light`. City = first segment before the first comma or ampersand (`pro.city.split(/[,&]/)[0].trim()`) so long strings like "Johnstone North, Kilbarchan…" collapse to `Johnstone North`. Dot separator, then `Insured · CPD` in the same muted tone (no second chip — avoids emerald-on-ivory contrast issues and keeps chrome quiet).

**Radii:** photo well 18px, star chip 6px, hover button 10px, verified pill full. No 14/20/28.

**Motion:** whole card lifts `-translate-y-0.5` on hover, photo `scale-[1.02]`, CTA overlay fades in — all `duration-200` / `duration-300`. No ken-burns, no shimmer.

## 2. Section header — `src/routes/index.tsx` lines 300–314

Rework the header row to match the direction while keeping REPS type tokens:
- Wrap header in a bottom hairline: `border-b border-reps-charcoal/5 pb-6 mb-10`.
- Left side (unchanged eyebrow + H2, keep `font-display` — no Instrument Serif). Keep the existing `JUST JOINED` eyebrow + `Newest coaches on REPS` H2 sizing (`text-[30px] lg:text-[34px]`). Add a small supporting line under H2: `Verified in the last few weeks — every one qualified, insured and CPD-active.` at `text-[13.5px] text-reps-muted-light mt-2 max-w-[520px]`.
- Right side — replace plain "View all" with an orange arrow link: `text-[13px] font-semibold text-reps-orange hover:opacity-80 inline-flex items-center gap-1`, label `View all coaches →`. Route unchanged (`/find-a-professional`).

## 3. Grid spacing — same file, line 316

- Change gap from `gap-3 sm:gap-4` to `gap-x-5 gap-y-10 sm:gap-x-6` so portrait cards breathe vertically (matches direction).
- Column counts unchanged: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`.
- Card count unchanged (16). No pagination, no scroll.

## 4. Technical notes

- No new dependencies, no font install (`font-display` already resolves site-wide).
- No data-layer changes; `rowToNewestCoach` already exposes rating + reviews + real role labels.
- Emerald is used only on the Verified overlay pill (status semantics — memory-compliant). No decorative emerald elsewhere on the card.
- Mobile: 2-column grid, card CTA overlay switches to always-visible on `sm:` and below? — no: on touch the whole card is the link, hover overlay simply never fires; that's fine and matches the "quiet chrome" intent.
- No changes to `/find-a-professional` list cards (`FeaturedProCard` etc.) — this scope is homepage only.

## Out of scope

- The "unverified pill missing on /c/$slug" issue flagged earlier — separate follow-up.
- Any other homepage section — locked.
- Adding a live "N joined this week" counter — the direction didn't include one and it needs a backend query.

## Files touched

- `src/components/public/NewestCoachCard.tsx` — full rewrite (still ~60 lines).
- `src/routes/index.tsx` — header block (lines ~300–314) + grid gap (line 316) only.
