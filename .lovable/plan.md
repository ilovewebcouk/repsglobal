
## Goal

Show you exactly what the current homepage looks like recoloured in the old REPs palette — lilac `#a978b2`, deep purple `#5c2c82`, magenta `#e73c8e`, cool grey `#9c9c9b` — without touching the locked homepage layout, and without shipping the change to production.

The homepage (`src/routes/index.tsx`) is memory-locked; I will not restructure any section. This is a pure token swap under a scoped wrapper, exactly like the existing `[data-coach-theme="light"]` override in `src/styles.css`.

## Approach

### 1. Add a scoped legacy palette in `src/styles.css`

Append a `[data-palette="legacy-reps"]` block that redefines the same `--reps-*` and coach-accent tokens the homepage already consumes — so every `bg-reps-orange`, `text-reps-orange`, `border-reps-orange-border`, gradient stop, and CTA band auto-swaps without editing a single component.

Proposed mapping (open to your tweaks):

| Role | Current | Legacy |
|---|---|---|
| Primary CTA / brand accent (`--reps-orange`) | `#FF7A00` | `#5c2c82` (deep purple) |
| Primary hover (`--reps-orange-hover`) | `#E96F00` | `#4a2069` |
| Primary dark (`--reps-orange-dark`) | `#CC6200` | `#3a1854` |
| Soft tint (`--reps-orange-soft`) | orange 12% | `rgba(92,44,130,0.12)` |
| Border tint (`--reps-orange-border`) | orange 35% | `rgba(92,44,130,0.35)` |
| Solid tint (`--reps-orange-tint`) | `#1A130C` | `#160B1F` |
| Secondary accent (magenta pops — waitlist chips, "£34 was £99" strike, `--reps-red` in decorative spots only) | `#F05D5E` | `#e73c8e` |
| Trust / verified gold (`--reps-gold`) | `#D9B66F` | keep gold (magenta already covers pink) |
| Muted chrome (`--reps-muted`, sub-borders) | current greys | tuned toward `#9c9c9b` |
| Lilac supporting tint (hero glow, marquee wash) | orange soft | `#a978b2` at low opacity |

Dark surfaces (`--reps-ink`, `--reps-panel`, `--reps-midnight`) stay the same — the palette rides on top of the current dark hero and ivory sections, same as today's orange does. If you'd rather have a *lighter* purple-and-white treatment like the old exerciseregister.org site, we do that as a second variant.

### 2. Add a preview-only route `src/routes/preview.legacy-colors.tsx`

- Renders the existing `Home` component from `src/routes/index.tsx` (imported, not duplicated).
- Wraps it in `<div data-palette="legacy-reps">…</div>`.
- `noindex, nofollow` in `head()`.
- Not linked from anywhere — you visit `/preview/legacy-colors` to compare side-by-side with `/`.

Zero risk to the locked homepage; delete the route + the CSS block to revert.

### 3. What you'll see

Every orange surface (CTA band top strip, "Find your coach" button, category pills on hover, "REPS VERIFIED" text, hero highlight underline, focus rings, footer accents) becomes deep purple. The "£99 → £34" strike and any celebratory pops become magenta. Lilac appears as the soft hero wash / marquee gradient. Grey stays close to what's there.

### 4. Decision point after preview

Once you've seen it, we pick one:
- **Ship it** → promote the tokens from `[data-palette="legacy-reps"]` into `:root` in `src/styles.css`, delete the preview route, done. No component edits.
- **Tune it** → adjust which colour plays primary vs accent (e.g. lilac primary + purple accent) and reshoot.
- **Reject** → delete the CSS block + preview route.

## Out of scope

- Homepage layout, section order, or copy (locked per `mem://design/locked-homepage`).
- Other pages (profile, coach website, admin) — a full palette migration is a separate exercise once you've approved the direction on the homepage.
- Logo artwork changes — the current `logo-lockup.svg` reads fine on both palettes; a purple-native lockup is a follow-up.

## Files touched

- `src/styles.css` — append `[data-palette="legacy-reps"]` token overrides (~40 lines).
- `src/routes/preview.legacy-colors.tsx` — new, ~15 lines.
