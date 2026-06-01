## Goal

Make every nav link in `PublicHeader` and `PublicFooter` actually navigate, and replace the three header `<button>` items with full mega-menu dropdowns on hover/focus. Phase 1 visuals only — no new routes, no backend.

## 1. Confirmed nav inventory (Q&A result)

**Header (left → right)**
- Logo → `/`
- Find a Professional ▾ (mega-menu)
- How REPs Works → `/how-it-works`
- For Professionals → `/for-professionals`
- Resources ▾ (mega-menu)
- About REPs ▾ (mega-menu)
- Log in → `/login` *(currently points at `/signup` — fix)*
- Join REPs → `/signup`

**Footer columns** — current targets are correct, just confirming:
- For Members: `/find-a-professional`, `/how-it-works`, `/specialisms`, `/reviews`, `/help`
- For Professionals: `/for-professionals`, `/pricing`, `/dashboard`, `/cpd`, `/business-tools`
- Company: `/about`, `/standards`, `/verify`, `/resources`, `/careers`, `/press`
- Legal: `/terms`, `/privacy`, `/cookies`, `/complaints`, `/contact`

All footer destinations already exist as routes — only fix is the header "Log in" bug.

## 2. Mega-menu structure

### Find a Professional ▾ (Browse by profession + location)
Two-column panel + footer CTA.
- **Column 1 — Top professions** (links to `/professions/$profession`):
  Personal Trainer, Pilates Instructor, Yoga Teacher, Nutritionist, Strength Coach, Online Coach
- **Column 2 — Top locations** (links to `/in/$location`):
  London, Manchester, Birmingham, Edinburgh, Glasgow, Bristol
- Footer row: "Browse all professionals →" → `/find-a-professional`

### About REPs ▾ (Trust & standards focus)
Single column of links with short subtitles:
- About REPs → `/about`
- Our Standards → `/standards`
- Verification → `/verify`
- Reviews → `/reviews`
- Complaints → `/complaints`

### Resources ▾ (Hub + categories)
Two-column panel.
- **Column 1 — Browse by topic** (filtered hub links, e.g. `/resources?category=find-a-professional`):
  Find a Professional, Fitness Business, Verification & Standards
- **Column 2 — Featured articles** (3 latest from `src/lib/resources.ts`, each → `/resources/$slug`)
- Footer row: "All articles →" → `/resources`

Note: category filter on `/resources` will read `?category=` via search params; if the hub doesn't yet support it, links degrade gracefully to the hub. (No new logic required for Phase 1 — the dropdown link still navigates.)

## 3. Component changes

### `src/components/public/PublicHeader.tsx`
- Replace the static `navItems` array with typed nav config including dropdown contents.
- Replace `<button>` placeholders with a `NavDropdown` subcomponent:
  - Trigger: same chrome as today (white/85 text, chevron, hover → white).
  - Panel: absolutely positioned under the header, centered to trigger, opens on hover + focus, closes on mouse-leave + Escape + blur outside.
  - Built with `@radix-ui/react-navigation-menu` (already pulled in by `src/components/ui/navigation-menu.tsx`) so we get keyboard + a11y for free; styled with REPs tokens.
- Panel styling: `bg-white text-reps-charcoal rounded-[18px]` (card radius), `border border-reps-stone`, no shadow drama — flat per token rules. Width ~640px for two-column panels, ~320px for the single-column About panel.
- Fix `Log in` `to="/signup"` → `to="/login"`.
- Top-level direct links (How REPs Works, For Professionals) become real `<Link>` with the same hover treatment.

### `src/components/public/PublicFooter.tsx`
- No structural changes — all `<Link>`s already point to live routes. Audit pass only: confirm every `to` resolves, no edits expected.

### New file: `src/components/public/nav-config.ts`
Single source of truth for top professions, top locations, and About/Resources panel link lists. Header imports from here so future edits are one-touch.

## 4. Out of scope (Phase 1 guardrail)
- No new routes, no auth wiring, no real category-filter logic on `/resources`.
- No mobile drawer redesign in this pass (current header is `hidden lg:flex` for nav; mobile will keep the existing CTA-only state, tracked as visual debt in `docs/07_phase1_build_status.md`).
- No design-system token changes.

## 5. Verification
- Click every header link + dropdown item → lands on the expected route.
- Hover + keyboard (Tab/Enter/Escape) open and close each mega-menu.
- Click every footer link → lands on the expected route.
- Run `reps-build-compliance` audit (no banned hex, no banned radii, no button shadows).

## 6. Doc update
- Append a one-liner to `docs/07_phase1_build_status.md` "Known visual debt" noting the mobile mega-menu is deferred.
