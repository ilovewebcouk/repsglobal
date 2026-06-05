# Lock the homepage

The homepage (`/`) is approved. Lock it so future work doesn't drift.

## What "locked" means here

1. **Memory rule** — Add a new project memory `mem://design/locked-homepage` capturing the locked state of `src/routes/index.tsx`:
   - CTA image composition: mobile `aspect-[5/4]` + `object-[100%_center]` (pair centred, rack cropped out), tablet `md:object-[100%_top]`, desktop `lg:object-center`.
   - CTA gradient stops: `linear-gradient(to bottom, transparent 0%, transparent 18%, rgba(11,13,16,0.38) 42%, rgba(11,13,16,0.72) 65%, #0B0D10 88%)`.
   - Hero pattern: top-anchored copy, staggered fade-up, 3 universal trust chips, PressMarquee — already covered by `mem://design/marketing-hero-template` and `mem://design/hero-anchoring`; the new memory cross-references them as the homepage's contract.
   - Rule: do not redesign `/` sections (hero, CTA band, featured pros, specialisms, stats, why-REPs) without an explicit user request naming the section.

2. **Index update** — Add the new memory under `## Memories` in `mem://index.md` and add one Core line: `Homepage / is LOCKED — see mem://design/locked-homepage. Do not restructure sections without explicit request.`

3. **Build-status doc** — Append a short "Homepage: LOCKED (Phase 1 approved)" line with today's date to `docs/07_phase1_build_status.md` so the lock is visible in the repo, not only in memory.

## Out of scope

- No visual changes to `src/routes/index.tsx`.
- No changes to other routes, components, or tokens.
- No re-screenshotting or re-QA — the previous mobile/tablet/desktop pass stands.

## Files touched

- `mem://design/locked-homepage` (new)
- `mem://index.md` (edit — preserve existing content)
- `docs/07_phase1_build_status.md` (append one line)
