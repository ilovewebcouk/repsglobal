You're right — most of the 59 are baseline noise, but there are real fixes hiding in there. Here's what the events actually contain and what I'd do.

## What's in the 59 warnings

Grouped by summary (from `seo_index_events` where `acknowledged_at IS NULL`):

| Count | Severity | Meaning |
|---|---|---|
| 17 | warn | First check: Crawled - currently not indexed |
| 11 | warn | First check: Discovered - currently not indexed |
| 11 | warn | **First check: Excluded by 'noindex' tag** |
| 9  | warn | First check: URL is unknown to Google |
| 4+3 | warn | Coverage churn: unknown ↔ discovered |
| 3  | warn | **Coverage changed → Soft 404** |
| 1  | warn | **First check: Not found (404)** |
| 3+1 | info | Now indexed (good news) |

The bulk (~40) are baseline "First check" snapshots + normal Google churn — not real bugs, just the scanner recording what Google shows. But 15 of them are actionable.

## Actionable — needs fixing

**1. Pages marked `noindex` that should be indexed (8 URLs)**
   - `/specialisms`, `/for-professionals`, `/cpd`, `/how-it-works`, `/find-a-professional`, `/help`, `/resources`, `/comparison-methodology`
   - These are LOCKED marketing pillar pages — they should be in Google. I'll audit each route's `head()` and remove the `noindex` meta / X-Robots tag.
   - `/privacy`, `/terms`, `/cookies` — noindex is defensible for legal pages; leave as-is unless you want them indexed.

**2. Broken URL (1)**
   - `/standards` returns 404. Either create the page or add a 301 redirect to the right destination (likely `/specialisms` or `/for-professionals`). I'll check what used to be there.

**3. Soft 404 city pages (3)**
   - `/in/newport`, `/in/leicester`, `/in/canterbury` — Google thinks these render an empty state. Likely no pros in those cities so the page reads as content-less. Options: (a) add fallback copy + nearby-cities section so there's real content, (b) return `noindex` when 0 pros, or (c) 301 to a regional hub. Preferred: (a) — improves UX and SEO.

## Noise — safe to auto-acknowledge

The remaining ~44 are:
- All "First check: *" baseline entries (once resolved via the actions above, or simply informational)
- Coverage state churn between "unknown ↔ discovered" (normal Google timing)
- All "info: Now indexed" (good news)

I'll bulk-acknowledge these in one SQL update so your queue reflects only real work.

## Re: "you have the GSC API"

I do — but GSC's URL Inspection API is **read-only** (it tells you Google's view). The Indexing API can *submit* URLs for re-crawl but is officially limited to JobPosting / BroadcastEvent schemas; using it for regular pages is against Google's ToS and they ignore it. The correct fix is: repair the pages, submit sitemaps (already automated), then let Google re-crawl. I can trigger a fresh URL Inspection scan afterwards to confirm the state flipped.

## Plan of work

1. Audit the 8 pillar pages and remove unwanted `noindex` (frontend head() only).
2. Handle `/standards` — check if it should exist; if not, add a redirect in `src/routes/`.
3. Fix soft-404 city pages — add empty-state content + nearby cities to `/in/$location`.
4. Bulk-ack the noise events with a SQL update stamping `acknowledged_at` for all rows matching the "First check", "unknown↔discovered", and "Now indexed" patterns.
5. Trigger a fresh GSC URL Inspection scan on the fixed URLs so the tab clears.

## Technical notes

- Files touched (frontend only, respecting locked pages — head() metadata isn't part of the visual lock):
  - `src/routes/specialisms.tsx`, `for-professionals.tsx`, `cpd.tsx`, `how-it-works.tsx`, `find-a-professional.tsx`, `help.tsx`, `resources.tsx`, `comparison-methodology.tsx` — remove `meta name="robots" content="noindex"` from `head()`.
  - `src/routes/in.$location.tsx` — add empty-state content block when `pros.length === 0`.
  - New `src/routes/standards.tsx` OR redirect entry (TBD after checking).
- One SQL statement via `supabase--insert` to acknowledge noise events.
- No backend/schema changes.

Want me to proceed with all of this, or just the noindex fixes first?
