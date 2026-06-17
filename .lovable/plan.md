# Wire the profession-page hero search

Today the search form on `/professions/$profession` is decorative: two uncontrolled inputs and a `<Link>` that drops you on `/find-a-professional` with no filters. We'll turn it into a real, controlled form that submits to the directory with the right search params — mirroring how `HomeHeroSearch` does it, but scoped to the current profession.

## Behaviour

- The profession itself is **fixed** to the current route (`personal-trainer`, `pilates-instructor`, etc.) — you're already on that page, so it doesn't need to be a field. It will always be sent as `?profession=<slug>`.
- **Specialism / service input** — free text. Starts empty (the current pre-filled "Personal Trainer" string is misleading because it's the profession, not a specialism). Placeholder: `e.g. Strength training, Fat loss`.
- **Location input** — free text city / town / postcode. Placeholder unchanged. Pre-filled with the viewer's origin town if `useViewerOrigin()` returns one (same hook `HomeHeroSearch` uses).
- **Submit** (button or Enter):
  - Always sends `profession=<slug>`.
  - Specialism text → `q=<text>` (matches what the directory does for free text from the home hero's "free" branch).
  - Location text → `city=<text>`. If left blank and a viewer origin exists, omit `city` and set `sort=nearest`; otherwise `sort=recommended`.
  - Navigates with `useNavigate()` to `/find-a-professional` — no full page reload.

## Files

- `src/routes/professions.$profession.tsx` — replace the static `<form>` (~lines 421–445) with a controlled form. Add `useState` for specialism + city, `useNavigate()`, and an `onSubmit` that builds the search object and calls `navigate({ to: "/find-a-professional", search })`. Swap the `<Link>` for a `<button type="submit">` with the same classes. Import `useNavigate` from `@tanstack/react-router` and `useViewerOrigin` from wherever `HomeHeroSearch` imports it.

No new components, no schema changes, no other routes touched. The `validateSearch` on `/find-a-professional` already accepts `profession`, `q`, `city`, `sort`, so the directory will filter correctly on landing.

## Out of scope (say if you want any of these next)

- Specialism typeahead / combobox like the home hero — current ask is just "wire it up", so plain text input is the minimum.
- Postcode geocoding from this form (the directory's own postcode chip already handles that).
- Touching the "At a glance" aside, related professions, or anything else on the page.
