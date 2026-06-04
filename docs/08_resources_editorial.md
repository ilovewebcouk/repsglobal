# Resources — Editorial Guide

How editors control what appears in the Resources mega-menu (header dropdown)
and on the `/resources` library page.

> All content lives in **`src/lib/resources.ts`**. There is no CMS in Phase 1.
> Edit the file, commit, and the site updates on the next deploy.

---

## 1. What lives where

| Surface | Source | Rule |
| --- | --- | --- |
| Header dropdown → **Featured** column (3 slots) | `getFeaturedArticles(3)` | Articles with `featured: true`, ordered by `featuredOrder` then `date` |
| Header dropdown → **Latest** column (3 slots) | `getLatestArticles(3)` | Newest 3 by `date` regardless of `featured` |
| Header dropdown → **Browse by topic** | `RESOURCE_TOPICS` in `nav-config.ts` | Static list of categories — each links to `/resources?category=...` |
| `/resources` hero card | `getHeroFeatured()` | Single highest-priority featured article (then newest fallback) |
| `/resources` grid | All articles | Filterable by category + free-text search, sortable |

---

## 2. The three fields editors care about

Every article in `RESOURCE_ARTICLES` has these knobs:

```ts
{
  slug: "...",
  date: "2026-05-19",      // ISO date — drives recency everywhere
  featured: true,          // include in Featured column + hero eligibility
  featuredOrder: 1,        // optional pin order (lower = higher priority)
  // ...title, excerpt, body, etc.
}
```

### `date` (required)
ISO `YYYY-MM-DD`. Newest first wherever ordering isn't otherwise specified.
Also drives the `dateLabel` shown to readers (set both — they aren't linked).

### `featured` (optional, default `false`)
Set to `true` to make an article eligible for:
- the **Featured** column in the header dropdown, and
- the **hero card** on `/resources`.

If nothing is flagged, the system falls back to newest-by-date so the UI
never breaks. There is no upper limit — flag as many as you like; only the
top N (currently 3 in the header, 1 in the hero) are shown.

### `featuredOrder` (optional)
Positive integer. **Lower wins** — `1` shows before `2`. Use this to pin a
specific article to the top of the Featured column or hero.

- Articles with `featuredOrder` always sort before those without.
- Articles without `featuredOrder` sort by `date` (newest first) underneath
  the pinned ones.
- Ties resolve by date desc.
- Only meaningful when `featured: true`.

---

## 3. Common editorial tasks

**Promote an article to the Featured column**
1. Find it in `src/lib/resources.ts`.
2. Add `featured: true,` to its object.

**Force a specific article to the top of Featured + hero**
1. Set `featured: true`.
2. Add `featuredOrder: 1` (use `2`, `3` for the next pins).

**Demote an article from Featured**
1. Remove (or set to `false`) the `featured` flag. Drop `featuredOrder` too.

**Refresh "Latest" with a new piece**
Just add the article with today's `date`. No flag needed.

**Add a new category to the dropdown**
Edit `RESOURCE_TOPICS` in `src/components/public/nav-config.ts`. The
category string must match one of `RESOURCE_CATEGORIES` in
`src/lib/resources.ts` exactly, or the filter link will land on an empty page.

---

## 4. Guard-rails

- Keep 3–6 articles flagged `featured: true` at any time. Fewer = the
  Featured column auto-tops-up with whatever's newest (acceptable, but you
  lose editorial control). More = fine; only the top N are rendered.
- Vary categories across featured picks so the dropdown doesn't look
  one-note.
- Reserve `featuredOrder: 1` for the single piece you want as the hero.
- Don't reuse `featuredOrder` values across two articles unless you don't
  care which one wins — ties fall back to `date`.

---

## 5. Where the code lives

| File | Responsibility |
| --- | --- |
| `src/lib/resources.ts` | Article data + `getFeaturedArticles` / `getLatestArticles` / `getHeroFeatured` helpers |
| `src/components/public/nav-config.ts` | `RESOURCE_TOPICS` (categories shown in dropdown) |
| `src/components/public/PublicHeader.tsx` | `ResourcesMenu` renders the dropdown |
| `src/routes/resources.index.tsx` | Library page (hero + filters + grid) |
| `src/routes/resources.$slug.tsx` | Individual article page |
