# Hero search upgrade — `/professions/$profession` + `/in/$location`

Goal: make both hero search boxes actually work (taxonomy combobox + Google Places + geolocate + correct submit URL), without changing the visual frame of either locked page.

## Approach

Extract a small reusable controller from `HomeHeroSearch` and render it inside each page's existing form shell. The shell (border, radius, padding, background, button position) stays exactly as-is — only the two input controls and the submit button's behaviour change.

### New shared component

`src/components/search/InlineHeroSearch.tsx`

Props:
- `variant: "light" | "dark"` — controls trigger text/icon colors (city page is light/ivory; profession page may differ — verified per page).
- `lockedProfession?: ProfessionSlug` — when set, the "What" field is pre-selected to that profession and the popover hides the Professions group (specialisms/mode only).
- `defaultCity?: string` — when set, the "Where" field shows that city as a pre-filled `mode: "city"` selection; user can clear or replace via Places/geolocate.
- `className?: string` — passed to the outer `<form>` so each page keeps its own grid/radius/background.

Internals: lifts the `WhatField` + `WhereField` logic out of `HomeHeroSearch.tsx` so all three call sites share one implementation. `HomeHeroSearch` becomes a thin wrapper that renders `InlineHeroSearch` with the homepage's dark glass shell and no locks.

Submit behaviour matches `HomeHeroSearch` today:
- profession (locked or picked) → `?profession=<slug>`
- specialism/mode → `?specialism=<slug>`
- free text fallback → `?q=<text>`
- resolved origin → `?sort=nearest`; else city label → `?city=<text>`
- navigates to `/find-a-professional`

### Page wiring

**`src/routes/professions/$profession.tsx`** — replace the existing two-input form body (`<input>` + `<input>` + submit) with `<InlineHeroSearch variant=... lockedProfession={profession.slug} />`. Keep the form's outer wrapper classes untouched so the visual frame is identical.

**`src/routes/in.$location.tsx` (lines 339–362)** — replace the form body the same way: `<InlineHeroSearch variant="light" defaultCity={loc.name} />`. Keep the `rounded-[18px] border border-reps-stone bg-reps-warm-white` shell. The current bug (a `<Link>` that ignores typed input) is fixed because `InlineHeroSearch` owns its own real submit handler.

### Light variant (city page)

The popover content already uses the light theme (`bg-reps-warm-white`, charcoal text), so it works on the city page out of the box. The triggers need:
- icon color: `text-reps-muted-light` instead of `text-white/60`
- placeholder color: `text-reps-muted-light` instead of `text-white/50`
- selected label: `text-reps-charcoal` instead of `text-white`
- hover bg: `hover:bg-reps-ivory` instead of `hover:bg-white/5`

These are gated on `variant`. No other style changes.

## Out of scope (explicit)

- No visual change to either locked page's hero (radius, padding, border, background, grid stay the same).
- Homepage `HomeHeroSearch` keeps identical look and behaviour — only its internals move into the shared component.
- No taxonomy/synonym/Places library changes.
- No new routes, no new search params beyond what `HomeHeroSearch` already emits.

## Verification

- Build passes.
- `/` hero unchanged visually and functionally.
- `/professions/personal-trainer`: "What" combobox opens with specialisms/mode only (profession is locked); picking "Fat Loss" + a Places result → navigates to `/find-a-professional?profession=personal-trainer&specialism=fat-loss&sort=nearest`.
- `/in/london`: "Where" shows "London" pre-filled; typing "Pilates" in "What" and submitting → `/find-a-professional?specialism=pilates&city=London` (or `sort=nearest` if user re-resolves the location).
