## Problem

On `/in/london` (and every `/in/$location` page) the Where field shows the viewer's geo-located/picked city instead of "London". On submit it also routes to `/find-a-professional?sort=nearest` with no `city=` param, so the search doesn't honour the page context. That's confusing — landing on a city page should mean "search this city" by default.

## Fix

Introduce a `lockedCity` prop on `InlineHeroSearch` that mirrors how `lockedProfession` works today: it pins the Where field to the page's city and takes priority over viewer origin (but the user can still change it via the dropdown).

### `src/components/search/InlineHeroSearch.tsx`

- Add `lockedCity?: string` to `InlineHeroSearchProps` (alongside `defaultCity`).
- Initial `where` state: if `lockedCity` is set → `{ mode: "city", label: lockedCity }`; else origin; else `defaultCity`; else null.
- Update the origin-syncing `useEffect` to no-op when `lockedCity` is set (so geo doesn't overwrite the page's city after mount).
- In `handleSubmit`: change the order so an explicit `where.mode === "city"` always emits `search.city`. Origin-derived `sort = "nearest"` only applies when `where.mode === "origin"`. So if the user is on `/in/london` they search London; if they then change Where to their own town via the dropdown, that wins; if they clear Where, fall back to origin behaviour.

### `src/routes/in.$location.tsx`

- Replace `defaultCity={loc.name}` with `lockedCity={loc.name}` on the `InlineHeroSearch` at line 339.

## Out of scope

- `/professions/$profession` keeps its current behaviour (no city context to lock).
- `defaultCity` stays as the non-locking pre-fill for the homepage hero.
- No visual/chrome changes — same field, same placeholder, same shell.
