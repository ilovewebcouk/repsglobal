## QA verdict

The library page itself is in good shape (search, URL-synced filters, sort, 68 articles, sitemap + canonicals). The **Resources mega-menu in the header is the weak link** and the **featured system is fake**. Two concrete problems:

1. **"Featured articles" in the dropdown ignores the `featured` flag.** `ResourcesMenu` in `src/components/public/PublicHeader.tsx:535` does `RESOURCE_ARTICLES.slice(0, 3)` — it just grabs the first three in array order. The `featured?: boolean` field on `ResourceArticle` exists but is only set on one article and isn't read anywhere.
2. **"Browse by topic" links all go to `/resources`** (no category filter), even though `/resources` now accepts `?category=...`. So clicking "Fitness Business" lands you on the unfiltered library.
3. Only **3 of 6 categories** are surfaced in the dropdown (`RESOURCE_TOPICS` in `nav-config.ts` lists Find a Professional / Fitness Business / Verification & Standards — missing Coaching & Client Management, CPD & Education, Platform Updates).
4. The featured article on `/resources/index` itself also doesn't honour the flag in a stable way — it picks `RESOURCE_ARTICLES.find(a => a.featured) ?? RESOURCE_ARTICLES[0]`, which works but means whoever edits the data file has to remember to set exactly one flag.

## Plan

### 1. Real featured system (single source of truth)

In `src/lib/resources.ts`:
- Keep the existing `featured?: boolean` field on `ResourceArticle`.
- Add a derived helper `getFeaturedArticles(limit?: number)` that:
  - returns every article with `featured: true`, sorted newest-first;
  - if fewer than `limit` are flagged, tops up with the newest non-featured articles so the UI never shows less than requested;
  - if `limit` is omitted, returns all flagged ones.
- Add a second helper `getHeroFeatured()` returning the single newest `featured: true` article (used by the `/resources` index hero), with a documented fallback to the newest overall.
- Tag **4–5 articles** as `featured: true` across different categories (currently only 1 is). Pick a mix: the existing one + one Fitness Business + one Coaching + one CPD + one Platform Updates piece so the dropdown stays varied.

That gives editors a clear contract: *toggle `featured: true` in `resources.ts` and the article shows up in the header dropdown and the homepage hero rotation.* No CMS needed for Phase 1.

### 2. Rewrite `ResourcesMenu` in `PublicHeader.tsx`

- Replace `RESOURCE_ARTICLES.slice(0, 3)` with `getFeaturedArticles(3)`.
- Make every "Browse by topic" link a real filtered URL: `<Link to="/resources" search={{ category: t.category }}>`. TanStack's typed search params already accept this because of the `validateSearch` schema we added.
- Expand `RESOURCE_TOPICS` in `src/components/public/nav-config.ts` to all 6 categories (with a sensible order: client-facing first, then pro-facing, then Platform Updates last).
- Add a small **"Latest" column** above (or instead of) one of the existing columns — newest 3 articles regardless of featured flag — so the dropdown surfaces fresh content automatically. Final layout: three columns instead of two — `Browse by topic` | `Featured` | `Latest`, with REPs-explained quick links collapsed under the topic column.
- Mirror the same category links into the **mobile accordion** (`accordion item="resources"` around line 1018) so mobile users also get filtered jumps.

### 3. Update `/resources` index to use the helpers

- `featured` in `resources.index.tsx` becomes `getHeroFeatured()` (same behaviour, but the fallback logic now lives in one place).
- No visual change.

### 4. Out of scope (flag for later)

- A real CMS / admin UI to toggle `featured` from the dashboard.
- Per-category landing pages at `/resources/category/$slug` (still worth doing but it's a separate task).
- Author landing pages.
- Editorial scheduling (`publishedAt` in the future).

## Files to edit

- `src/lib/resources.ts` — add `getFeaturedArticles` + `getHeroFeatured`; flip `featured: true` on 3–4 additional articles.
- `src/components/public/nav-config.ts` — expand `RESOURCE_TOPICS` to all 6 categories.
- `src/components/public/PublicHeader.tsx` — rewrite `ResourcesMenu` (3-column layout, real featured, category-filtered topic links, new "Latest" column) and mirror category links in the mobile accordion.
- `src/routes/resources.index.tsx` — swap the inline `featured` lookup for `getHeroFeatured()`.

## Answer to "are we world-class?"

Library page: **yes**, with the caveat that per-category landing pages would push SEO further. Header dropdown: **not yet** — after this change it will be (real featured curation, filtered topic jumps, all categories represented, auto-fresh "Latest" column, mobile parity).