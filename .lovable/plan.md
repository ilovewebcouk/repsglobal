# Pre-fill locked profession in hero search

## Goal
Make the profession landing page hero search show the current profession as the pre-filled "What" value, matching the way city pages pre-fill the "Where" field.

## User decision
Pre-filled and locked — the profession label appears in the input and cannot be cleared, because the page itself is scoped to that profession.

## Changes

### `src/components/search/InlineHeroSearch.tsx`
- When `lockedProfession` matches a profession entry in `SEARCH_ENTRIES`, initialise the `what` state to that entry so the trigger displays the profession label (e.g. "Personal Trainer" / "Pilates Instructor").
- When the selected value equals the locked profession, hide the clear (×) button so the user cannot remove the page context.
- Keep the combobox behaviour unchanged: the Professions group is still hidden when `lockedProfession` is set, so the user picks a goal/specialism or mode on top of the locked profession.
- Keep submit behaviour unchanged: `lockedProfession` always emits `?profession=<slug>` on submit.
- If `lockedProfession` does not match any taxonomy entry (e.g. stale slug), fall back to the current placeholder behaviour.

### `src/routes/professions.$profession.tsx`
- No wiring change required — it already passes `lockedProfession={meta.slug}` to `InlineHeroSearch`.
- The visual frame, placeholder and radius stay locked per `mem://design/locked-professions`.

### `src/routes/in.$location.tsx`
- No change required — city pre-fill already works via `defaultCity`.

## Out of scope
- No new specialism landing pages or routes.
- No changes to the homepage hero search.
- No changes to the search results page or URL params.
- No visual changes to the locked profession/city page shells.

## Verification
- Build passes.
- `/professions/personal-trainer`: the "What" field shows "Personal Trainer" selected with no clear button; clicking the field opens specialisms/modes only.
- `/professions/pilates-instructor`: the "What" field shows "Pilates Instructor" selected with no clear button.
- Submit with no other selections still navigates to `/find-a-professional?profession=personal-trainer`.
- Submit after picking a specialism (e.g. "Fat Loss") navigates to `/find-a-professional?profession=personal-trainer&specialism=fat-loss`.
- `/in/london` remains unchanged: "Where" shows "London" and is clearable.