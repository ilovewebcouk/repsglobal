
## QA verdict on Resources today

Filtering and library UX are already in a good state after the last pass: full-text search (title/excerpt/category/author), category pills with live counts, sort dropdown (Newest / Oldest / A–Z), result count, and a Clear-filters shortcut. The article template has breadcrumb, hero, structured body renderer, author bio, related-articles grid, and CTA strip. So nothing is broken — but there are real gaps to fix before Google can do its job.

## What's worth adding (UX)

1. **URL-synced filters.** Mirror `?q=…&category=…&sort=…` into the URL via TanStack search params. Makes filtered views shareable and bookmarkable, and gives Google distinct deep-link targets for category pages.
2. **Author filter chip** (optional, low effort). Sophie / James / Dr Priya / Mark — useful as the library grows past 68.
3. **Pagination / "Load more" at 24 per page.** 68 cards × 50 KB images = a heavy initial paint. Add `loading="lazy"` and `decoding="async"` on all cover `<img>` tags and chunk the grid.
4. **"/" keyboard shortcut** to focus the search input (matches the existing command palette pattern).
5. **Empty-state polish.** Replace the bare "No articles match this filter yet." with a small Empty component + "Clear filters" CTA.

## What's worth fixing (SEO — biggest impact)

This is where we're leaving the most on the table.

1. **No `sitemap.xml`.** Without it Google has to discover all 68 article URLs by crawling. Add `src/routes/sitemap[.]xml.ts` that emits every public route plus one `<url>` per article (derived from `RESOURCE_ARTICLES`).
2. **No `robots.txt`.** Add `public/robots.txt` with `User-agent: * / Allow: /` and a `Sitemap:` directive.
3. **Wrong canonical domain.** `resources.$slug.tsx` and `resources.index.tsx` hard-code `repsglobal.lovable.app`. Per project rules these should point at `https://staging.repsuk.org`. Wrong canonical actively suppresses ranking.
4. **`<img alt="">` is empty on every cover.** Use `article.title` as alt text on article hero and listing cards. Empty alts on meaningful imagery hurt both SEO and a11y.
5. **Add `BreadcrumbList` JSON-LD** on article pages (Resources › Category › Title). Enables breadcrumb rich results in Google.
6. **Strengthen `Article` schema:** add `mainEntityOfPage`, `publisher` (Organization), `dateModified`, `image` as array.
7. **Add `og:image` + canonical on `/resources` index** (currently missing og:image; canonical is on root which TanStack concatenates — move it leaf-only).
8. **`/resources` `head()` SEO copy.** Title is fine; tighten meta description to include "personal trainer", "fitness coach", "UK" keyphrases.
9. **Per-category landing pages** (Phase 2, but flag it): `/resources/category/$slug` would let each of the 6 categories rank on its own.

## Semrush pass

Once the canonical domain is fixed and the sitemap is live, run two read-only checks against `staging.repsuk.org`:

- `domain_analysis` — baseline: estimated traffic, total ranking keywords, top organic terms (UK database).
- `keyword_research` on 3–4 anchor terms surfaced in the library: *"personal trainer cost uk"*, *"how to find a personal trainer"*, *"reps verified"*, *"online personal trainer uk"*. Confirms the article slugs we've written line up with real search demand.

If the user wants ongoing rank tracking / weekly visibility deltas / paid-search insight wired into the dashboard, that's a connector job (Semrush OAuth) — out of scope for this turn, but worth flagging.

## Out of scope

- Building actual `/resources/category/$slug` routes (separate task).
- Wiring the Semrush connector for in-app tracking (separate task, needs user consent).
- Touching the article body content itself.

## Technical details

- **New file:** `src/routes/sitemap[.]xml.ts` — server route, iterates `RESOURCE_ARTICLES`, sets `BASE_URL = "https://staging.repsuk.org"`, includes top-level public routes (`/`, `/about`, `/standards`, `/verify`, `/find-a-professional`, `/resources`, `/compare`, `/pricing`, `/faq`, `/help`, etc.).
- **New file:** `public/robots.txt` with `Sitemap: https://staging.repsuk.org/sitemap.xml`.
- **Edit `src/routes/resources.$slug.tsx`:** swap `repsglobal.lovable.app` → `staging.repsuk.org`; add `BreadcrumbList` JSON-LD via `scripts[]`; expand `Article` schema; set `alt={article.title}` on hero `<img>`.
- **Edit `src/routes/resources.index.tsx`:** swap domain in og:url; move canonical here (it's currently fine on this route, just confirm `__root.tsx` has no canonical); sync `filter`/`query`/`sort` to search params with `validateSearch` + `zodValidator`; add `loading="lazy"` on grid `<img>`; replace empty-state with `Empty` (shadcn) component; add focus-on-"/" handler.
- **Edit `src/routes/__root.tsx`:** confirm no `<link rel="canonical">` is set (per `head-meta` rules canonical lives leaf-only because TanStack concatenates `links`).

## Order of work

1. SEO domain + sitemap + robots + image alts + breadcrumb JSON-LD  (the high-impact organic-search work)
2. URL-synced filters + lazy loading + pagination
3. Empty-state + "/" shortcut polish
4. Run the Semrush baseline + keyword check and report findings
