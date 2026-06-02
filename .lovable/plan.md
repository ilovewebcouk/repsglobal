# World-class header rebuild

Scope: a full visual rebuild of `PublicHeader` to match best-in-class two-sided fitness marketplaces (Airbnb, ClassPass, Thumbtack, Booking). Visual only — no new routes, no real auth, no real search logic. Mockup-lock override approved by user.

## What changes

### 1. New header anatomy (desktop ≥ lg)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [REPs]   [📍 London ▾] │ Train ▾  Find a Pro ▾  Resources ▾  │ ✓ Verified  │
│                                                                              │
│         ┌─────────────────────────────────────────────────────┐              │
│         │ 🔍 What do you want to train?  ·  Where?  ·  [Search]│  ♡  ⌘K  │ Become a Pro │ ⎵ Avatar │
│         └─────────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Two-row layout at rest on `/`, collapses to a single compact row (search becomes a pill button) once scrolled past 96px or on every non-home route.

### 2. New top-level IA (5 items, user-job-led)

| Old | New |
|---|---|
| Find a Professional ▾ | **Train ▾** (by goal: Weight loss, Strength, Mobility, Pre/post-natal, Rehab, Sport-specific) |
| How REPs Works | **Find a Pro ▾** (by profession + by city — current mega-menu, redesigned with featured pro card + city image) |
| For Professionals | **Resources ▾** (articles + Standards + Verification explainer) |
| Resources ▾ | (folded into above) |
| About REPs ▾ | **Footer-only** (About, Standards, Complaints move to footer) |

A small **✓ Verified** trust pill sits to the right of the nav, links to `/verify`.

### 3. Inline search (visual, no logic)

- Two-field pill: "What" combobox (profession + goals, static suggestions) + "Where" combobox (cities, "Use my location"). Submit → navigates to `/find-a-professional` with query params (no server-side filtering yet).
- ⌘K opens a shadcn `Command` palette over the page (recents, popular pros, popular cities, quick links). Visual only — items are static.

### 4. Location pin

- Left of the nav: `📍 London ▾` shadcn `Popover` with city list + "Detect location" button. Persists to `localStorage`. Affects label only in Phase 1.

### 5. Two-sided CTA split

- Far right cluster: `♡ Saved` (icon, links to `/find-a-professional` stub), `⌘K` button, **Become a Pro** (ghost link → `/for-professionals`), **Join / Log in** (primary).
- When `localStorage.repsMockUser` is set (dev toggle, not real auth), swap **Join/Log in** for `Avatar ▾` dropdown: Bookings, Saved, Messages, Settings, Sign out. Pure UI shell — no Supabase calls.

### 6. Mega-menu visuals

- **Train**: 6 goal tiles with icon + 1-line outcome ("Lose body fat", "Get stronger"…).
- **Find a Pro**: two columns (Top professions / Top cities) + a featured pro card (avatar, name, rating, "View profile") + a city hero image card.
- **Resources**: topics + 3 featured article cards with thumbnail.

All panels use REPs tokens (radius 18/22, brand-orange accents, `--reps-stone` borders, no banned radii).

### 7. Mobile (< lg)

- Sticky compact bar: REPs logo · `[🔍 Search professionals near London]` pill · hamburger.
- Tap pill → full-screen `Sheet` from top with search fields, recent searches, popular goals.
- Hamburger drawer: Account block (Join / Log in OR avatar), then Train / Find a Pro / Resources accordions, then Become a Pro, then footer links (About, Standards, Complaints, Help).

### 8. Scroll behaviour

- `/` only: two-row transparent → one-row solid (`bg-reps-ink/95` + blur) past 96px.
- All other routes: one-row solid from the top.
- Verified pill stays visible in solid state.

### 9. Accessibility

- Skip-to-content stays.
- All triggers labelled, Radix `NavigationMenu` / `Popover` / `Command` / `Sheet` for ARIA.
- ⌘K registered with `Cmd/Ctrl+K` global listener; respects `prefers-reduced-motion`.
- Focus-visible rings on every chrome element.

## Files touched

- `src/components/public/PublicHeader.tsx` — full rewrite
- `src/components/public/nav-config.ts` — add GOALS, refine RESOURCE_TOPICS, drop ABOUT_LINKS from header (kept for footer)
- `src/components/public/HeaderSearch.tsx` *(new)* — inline two-field search pill
- `src/components/public/HeaderCommandPalette.tsx` *(new)* — ⌘K Command dialog
- `src/components/public/HeaderLocationPin.tsx` *(new)* — city Popover
- `src/components/public/HeaderUserMenu.tsx` *(new)* — pre/post-auth right cluster (mock user via localStorage)
- `src/components/public/mega/TrainMenu.tsx`, `FindProMenu.tsx`, `ResourcesMenu.tsx` *(new, split out of PublicHeader)*
- `src/components/public/PublicFooter.tsx` — absorb About / Standards / Complaints links displaced from header
- `src/styles.css` — only if a missing token is needed (no new colors; reuse existing)

No new routes. No `__root.tsx` changes. No Supabase, no server functions, no migrations.

## Out of scope (explicitly not built this turn)

- Real auth, sessions, profile fetch
- Real search results / filters
- Real saved-pros persistence (icon links to find page only)
- Geolocation API beyond a stubbed "Detect location" button that just sets the label
- Footer redesign beyond adding the displaced About/Standards/Complaints links
- Updating `src/mockups/` images or the mockup-lock doc — I'll note in chat that the home mockup's header is now intentionally superseded; you decide later whether to re-shoot the mockup.

## Acceptance

- REPs Build Compliance audit passes (tokens, radii, no banned hex, no button shadows).
- Desktop screenshots at 1366 and 1920: two-row at rest on `/`, one-row solid scrolled and on `/for-professionals`.
- Mobile screenshot at 375: compact search pill + drawer.
- ⌘K opens/closes; Esc dismisses; focus returns to trigger.
- No hydration warnings in console.
- Lighthouse a11y on `/` ≥ 95.
