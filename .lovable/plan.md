## Where we are

- ✅ Legacy redirect resolver shipped (`/admin/seo/legacy-redirects` + catch-all `src/routes/$.tsx`)
- ✅ BD-format CSV delivered (`repsuk-legacy-redirects-bd.csv`, 363 rows)
- ✅ Sitewide `noindex` removed, sitemap fixed, GSC verified

## What's still open from the SEO rescue plan

Three high-leverage items remain. I'd ship them in this order:

### 1. Organization JSON-LD with `alternateName` (small, ~20 min)
Add a single Organization schema block to `src/routes/__root.tsx` listing every brand variant Google might see: "REPs", "REPS UK", "REPs Register", "The Register of Exercise Professionals", "repsuk.org". This tells Google these are all the same entity and helps consolidate brand-search ranking signals.

### 2. Per-profile `<title>` + `<meta description>` formula (medium, ~1 hr)
Right now `/c/$slug` profile pages don't have unique, optimised meta tags — they fall back to defaults. With ~335 published pros, this is the biggest single source of "long-tail" SEO traffic we're leaving on the table.

Formula:
- **Title:** `{Name} — {Primary Profession} in {City} | REPs`
- **Description:** `Book {Name}, a verified {profession(s)} based in {city}. {Tagline or first 100 chars of bio}. Verified on the REPs register.`

Wired into the existing `head()` block in `src/routes/c.$slug.tsx`, driven by loader data. Same formula applied to `og:title` / `og:description` / `twitter:*` so social shares match.

### 3. Programmatic profession × city landing pages (larger, dedicated turn)
Routes like `/personal-trainer/manchester`, `/nutrition-coach/london`, etc. These are the pages that catch high-intent searches like "personal trainer manchester". Bigger build — needs a route, a city × profession matrix, a featured-pros list per page, and unique copy/meta per combination to avoid duplicate-content penalties. Worth scoping properly as its own turn rather than rolled in here.

## Proposal for this turn

Ship **(1) + (2) together** — they're small, they compound immediately with the redirect work that's already live, and they unblock the per-profile share previews you've been asking about.

Queue **(3)** as the next dedicated turn after we see the redirects + meta start moving in GSC (~1–2 weeks for first signal).

## Out of scope (not doing now)

- BD-side import — that's your action in BD admin, no code change
- Programmatic city pages (separate turn)
- Article/resource content rewrites (separate editorial pass)

---

**Confirm and I'll build (1) + (2), or tell me to reorder.**