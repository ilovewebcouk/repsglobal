## Public Header QA — Polish Plan

Read-only audit of `src/components/public/PublicHeader.tsx`, `nav-config.ts`, and `scripts/check-nav-links.mjs` is complete. The IA, labels, route destinations, and grouping are correct and match the approved 4-journey structure. Mobile accordion order is correct: Find → For Pros → Resources → About. No broken links. No legacy Company block. No standalone About link remains.

Below are the only issues worth fixing in this pass — all visual/behavioural polish or dead code.

### Findings & fixes

**1. Active-state logic — redundant + dead branches** (`PublicHeader.tsx` 76–112)

- `active.pros` already includes `/features`, but trigger conditions use `active.pros || active.features` in two places (desktop L249/255, mobile L1014). Collapse to `active.pros`.
- `useActive()` returns three unused keys: `train`, `howItWorks`, `features`. Remove them.
- Confirmed correct per spec: `resources` (only `/resources`, `/resources/*`), `about` (10 routes listed), `find` (directory/search/city/profession + `/how-it-works` + `/pro/`), `pros` (all 6 routes the user listed plus `/for-professionals` overview).

**2. Mobile accordion chevron — low contrast on dark drawer** (`accordion.tsx` 26, used by drawer)

The shared `AccordionTrigger` renders `ChevronDown` with `text-muted-foreground`, which is near-invisible on the `bg-reps-ink` drawer. Override per-trigger by adding `[&>svg]:text-white/60` to the four mobile `AccordionTrigger` className strings (L950, L1012, L1090, L1126). No change to the shared shadcn primitive.

**3. Mobile sub-link tap targets below 44px** (`PublicHeader.tsx` 873)

`mobileSubLinkClass` uses `py-2` (~36px). Bump to `min-h-11 py-2.5` so every sub-link in all four accordion sections meets the 44×44 target.

**4. Featured-card focus state in Find mega-menu** (`PublicHeader.tsx` 520)

Uses `focus:border-reps-orange-border` without a ring — keyboard focus is barely visible. Replace with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/60` to match the rest of the header's focus treatment.

**5. Stale blank lines / unused import** (`PublicHeader.tsx` 11, 55, 190–196, 361)

Blank line inside the lucide import block (L11) and several stray blank lines. Cosmetic cleanup only — no behaviour change.

### Verification after fix

- Re-run `node scripts/check-nav-links.mjs` (expect: 0 broken; existing 2 orphans `/features` and `/sitemap[/]xml` are pre-existing and not in scope — `/features` is intentionally surfaced only via the For Pros mega-menu's pillar cards which deep-link to `/features/<slug>`; `/sitemap[/]xml` is the XML route).
- Visual check at 1280, 1024, 390 widths: confirm About mega-menu aligns right-edge without overflow, right cluster (Log in / Join REPs / hamburger) stays stable, mobile drawer accordion chevrons visible.
- Keyboard sweep: Tab through 4 triggers → arrow keys to open → Tab through menu links → Esc to close. Radix `NavigationMenu` already handles `aria-expanded` / `aria-controls` correctly; no markup change needed.

### Out of scope (not changing)

- IA, labels, routes, grouping, ordering.
- Resources dropdown content rebuild (still parked).
- Footer, command palette, location pin, user menu.
- Orphan routes `/features` and `/sitemap[/]xml` (intentional).
- Any new routes or backend work.

### Files touched

- `src/components/public/PublicHeader.tsx` (active-state cleanup, mobile chevron color, tap-target sizing, focus ring, blank-line cleanup)

No other files change.
