# Brutal-honest answer first

**Yes, agree on ranking.** "Nearest" should not mean "raw haversine sort". A 10/10 directory sort = **distance-bucketed quality**:

1. Bucket pros into distance tiers (≤5mi, ≤15mi, ≤30mi, ≤60mi, >60mi).
2. Inside each bucket, rank by: Verified status → profile completeness/quality score → rating → recency.
3. Output is nearest-AND-best, never "nearest-but-empty-shell-profile".

**Map looks odd because:**
- Map view fills only the left third of the screen; the rest is a cream void (split-layout container leaking into Map view).
- Bounds are still being fit to ~30 East-of-England pins instead of zooming around the viewer origin (Lowestoft is off-map entirely on your screenshot — that's a bug).
- No clustering at zoomed-out levels; pins overlap into orange blobs around Cambridge/London.
- No "search this area" button when the user pans.
- No price-pin → card hover sync visible because list is hidden in Map mode.

That's not 10/10. Here's the plan.

---

## Phase 1 — Map view, fixed properly (Find a Professional)

1. **Layout per view mode**
   - `view=list`: list owns full width, no map.
   - `view=split`: list (left, scrollable) + map (right, sticky, viewport-locked). Already done — keep.
   - `view=map`: **map owns full width**, list collapses to a floating left rail (Airbnb mobile-map pattern) OR hides entirely on desktop with a "Show list" toggle. Kill the cream void.

2. **Map behaviour**
   - **Origin-first centering**: if viewer origin exists, center on origin, zoom = sensible local (z=11), fit bounds only to pins inside current viewport radius.
   - **Clustering**: add `@googlemaps/markerclusterer` so 20 pins around London become one "20" bubble until zoomed in.
   - **"Search this area" button** appears after the user pans/zooms; re-runs the search bounded to the visible viewport.
   - **No origin set**: don't show the world. Show a premium empty state card centered over a muted UK map: "Set your location to see pros near you" with the inline location control.
   - **maxZoom 16, minZoom 5**, gestureHandling greedy, no Antarctica ever.

3. **Pin design**
   - Verified pros = pin with subtle ring/check glyph.
   - Hovered pin elevates + shows mini-card popover (name, rating, from-price, "View profile").
   - Click = navigate to `/pro/$slug` (already wired).

## Phase 2 — Sort: "Nearest" → quality-weighted nearest

Update `searchProfessionals` server fn:

- When `sort_by_nearest` AND viewer origin present:
  1. Fetch candidates (up to 1000) — already done.
  2. Compute distance — already done.
  3. **Apply tiered ranking**: `tier = floor(distance bucket)`, then secondary sort `verified DESC, quality_score DESC, rating DESC, reviews_count DESC`.
  4. Paginate result.
- Add a small "Sorted by nearest, verified pros first" helper line under the sort chip when origin is set, so the ranking is explicit.

## Phase 3 — Full QA sweep

Run an actual matrix, not a vibe-check. For BOTH `/` and `/find-a-professional`:

**Viewports tested**
- 360 (small mobile), 390 (iPhone), 768 (tablet), 1024 (small laptop), 1280, 1440, 1920.

**Find a Professional — test cases (screenshot every one)**
1. Cold load, no origin, no filters → counts, default sort, map empty state.
2. Set location via postcode → chip updates, sort label updates, cards show miles, map zooms local.
3. Set location via geolocate → same expectations.
4. Refresh with origin set → state persists, X clears it cleanly, reverts to Anywhere.
5. Toggle In-person / Online / Any → filter applies + URL updates + counts update.
6. Open Filters drawer → every filter (specialism, price, rating, radius, languages, gender, online) applies and clears.
7. Sort: Recommended / Nearest / Rating / Price asc / Price desc → all change order correctly.
8. Pagination → page 2 scroll-to-top, counts correct, URL updates.
9. List / Split / Map view toggle on all 3 view modes at every breakpoint.
10. Map: pan, zoom, "search this area", cluster click, pin hover sync with card, pin click → profile.
11. Hover a card in split view → corresponding pin highlights.
12. Empty result state (filter to zero) → premium empty state, not a broken grid.
13. Search bar autocomplete (name + specialism + city).
14. Keyboard nav: tab order through filters, escape closes drawer, Enter submits.
15. SEO: title, meta, canonical, h1 uniqueness.

**Homepage — test cases (screenshot every one)**
1. Hero load on every breakpoint: image crop, copy anchoring, no layout shift.
2. HeroSearch: profession + location + submit → lands on `/find-a-professional` with correct filters + origin set.
3. "Use my current location" inside hero → origin persists, jump-to results.
4. Every section renders + scrolls smoothly: register proof, featured pros, professions grid, how-it-works, trust, FAQ, CTA band, footer.
5. FeaturedProCard links resolve, images load, no broken slugs.
6. Press marquee animates without jank.
7. CTA buttons all route correctly (`/auth`, `/for-professionals`, `/pricing`, `/find-a-professional`).
8. Mobile sheet nav opens, closes, links work.
9. Lighthouse pass: perf, a11y, best practices, SEO ≥ 90.
10. Skip-link, focus rings, color contrast on cream backgrounds.

**Bug log format**: each issue gets severity (P0 blocks ship / P1 visible regression / P2 polish), screenshot ref, exact file:line fix.

## Phase 4 — Deliverables

1. Map view rebuilt (layout + clustering + "search this area" + empty state).
2. Sort rewritten as distance-bucketed quality ranking + explicit helper text.
3. QA report: matrix above, screenshots at each breakpoint, prioritised bug log.
4. Fix every P0 and P1 in the same pass; P2 listed for a follow-up.

## Out of scope (call out)

- Profile page deep redesign (locked).
- Homepage section restructure (locked — only fix bugs and verify behaviour).
- Auth/account flows.

## Open questions before I build

1. **Map clustering** — confirm OK to add `@googlemaps/markerclusterer` (tiny, no key change)?
2. **Map mode on desktop** — full-bleed map with floating list rail (Airbnb), or hide list entirely with a "Show list" toggle?
3. **Verified weighting strength** — should Verified always beat non-Verified within the same distance bucket, or only when they're within ~X miles of each other?
4. **QA depth** — do you want me to also fix every P2 polish issue I find, or list them and you decide?

Once you answer those (or say "you decide"), I'll switch to build and ship it.
