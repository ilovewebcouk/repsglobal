
## Quick answers first (no code yet)

1. **"Set location" placeholder in Sort** — confirmed gone in code. `ResultsSearchBar.tsx` only renders the `Nearest` `<SelectItem>` when `originAvailable` is true, and reflects stale `sort=nearest` URLs as `Recommended` in the trigger. I will still visually verify this in the live preview as part of QA below.

2. **China block** — yes, it is wired. `src/lib/bot-filter.ts` has `CN` in `HIGH_ABUSE_COUNTRIES` and rejects with a cacheable 403 on every non-exempt path. BUT: the 73,310 CN hits in your analytics window were almost entirely on **2026-06-16** (the day the block landed) and were recorded **before / at the moment of deploy** — the published build only starts serving the 403 after the next publish reaches the edge and Cloudflare's edge cache picks it up. Concretely: until you re-publish (or until the existing deploy has fully propagated and CF has cached the 403), `repsglobal.lovable.app` / `repsuk.org` may still serve to CN IPs. The current 749 live visitors number is real-time and will drop sharply once the published build is the one with `bot-filter.ts`. I will confirm with a curl from a CN-geo header during QA.

---

## Full QA Plan — `/find-a-professional`

Goal: prove the sticky bar, location, filters, sort and view system behave like a 10/10 directory across desktop / tablet / mobile.

### 1. Sticky bar — visual + interaction QA

For desktop (1440), tablet (820), mobile (390):
- Bar stays sticky under the 72px header, gains soft shadow on scroll, no double border.
- Row 1 chips wrap cleanly, never overflow horizontally, no layout shift when origin resolves.
- "What" chip: popular list, free-text fallback, clear button, keyboard nav (↑↓ + Enter + Esc).
- "Where" chip: Google Places suggestions, postcode path, "use my location", manual city, clear.
- Mode toggle on desktop / inside mobile sheet only.
- Filters popover (desktop) and Filters sheet (mobile): rating, radius, venue, mode parity.
- View toggle: list / split / map — split + map only render the map column at `lg+`, gracefully fall back to list below.
- Sort: shows exactly the right options for the current state.

### 2. Location setting — end-to-end

- Cold load with no saved origin → "Where" reads "Anywhere", Sort dropdown does NOT include Nearest, no hydration warning in console.
- Set location via postcode (e.g. `NR32`) → bar updates to town/postcode, sort auto-flips to Nearest, query refetches, results re-rank by raw distance.
- Set location via Geolocate → same behaviour, toast confirmation.
- Set location via city autocomplete → same behaviour.
- Clear location from "Where" chip → bar returns to "Anywhere", Sort silently reverts to Recommended, results re-rank.
- Reload page with origin in localStorage → first paint shows "Anywhere", then within one effect tick swaps to the saved town and refetches (no hydration mismatch, no flash of stale "nearest" order).
- URL with `?sort=nearest` but no origin → trigger displays "Recommended", results use Recommended ordering, no scary banner.

### 3. Filters — correctness

- `mode = in_person` → server filters `in_person_available = true`. Online-only pros disappear.
- `mode = online` → server filters `online_available = true`. In-person-only pros disappear.
- `mode = any` → both appear.
- `min_rating = 4` → client filter removes anything below 4.0; count updates; pagination collapses to the filtered set.
- `radius_mi = 5` with origin → only pros within 5 mi shown; auto-widen banner appears when <5 results, suggesting next tier with extras count; pagination uses visible total, not raw server total.
- `venue = puregym` → only pros with a matching gym pill. Clearing the chip restores list.
- Active-filter chips row appears only when something non-default is set; each chip clears independently.

### 4. Sort — correctness

- Recommended (default): server orders verified → quality → paid tier → recency.
- Nearest (origin set): server orders by raw haversine distance, ties broken by verified → quality → paid tier → recency. **Re-run the Lowestoft case: Katie Gibbs must be #1.**
- Rating: client sort by rating desc, ties by review_count desc.
- Most reviewed: client sort by review_count desc, ties by rating desc.
- Newest: client sort by created_at desc.
- Switching sort never breaks current filters or pagination state (page resets to 1).

### 5. View modes

- list: single column, max-w 1100, no map column.
- split (`lg+`): list left, sticky map right, hover on a card highlights its pin.
- map (`lg+`): map dominant, list hidden at lg+ via `hideListAtLg`, mobile falls back to list with floating "Open map" button.
- Switching view preserves all filters and page, only `view` param changes.

### 6. Edge cases

- Empty result set → friendly empty state, not a blank list.
- Pagination: range label correct (`1–24 of N`), prev/next disabled at bounds, scroll-to-results works in both overflow and normal flow.
- Back button after every filter change restores prior URL state exactly (URL is source of truth).
- No console errors / no React hydration warnings across the whole flow.

### 7. China block verification

- Curl the published URL with `cf-ipcountry: CN` against `/`, `/reviews`, `/coming-soon` → expect `403 Forbidden` with `x-bot-blocked: geo`.
- Curl with `cf-ipcountry: GB` → expect `200 OK`.
- If `403` is not yet served, the answer is "build is in deploy / cache window — publish again and recheck" rather than a code bug.

### 8. Deliverable

A single QA report back to you, structured as:
- ✅ / ❌ per item above
- Screenshots at desktop / tablet / mobile of the sticky bar in each meaningful state (no origin, origin set, filters active, mobile sheet open)
- For every ❌: the specific fix, applied in the same pass (no second round-trip)
- Final verdict line: "10/10 / not yet 10/10 — remaining gaps: X, Y, Z"

### Technical notes

- Use the `browser` tool to drive the live preview at 3 viewport sizes, with `observe` before each `act`.
- For the China block, use `curl -H 'cf-ipcountry: CN' https://repsglobal.lovable.app/reviews -I` from the sandbox.
- No visual redesign of the sticky bar in this pass — only fixes for behaviour bugs found during QA. Any visual change request becomes a separate plan.
