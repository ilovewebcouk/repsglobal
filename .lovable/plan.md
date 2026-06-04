
# REPs Resources — Read-only Audit

## 1. Routes found

| Route | File | Status |
|---|---|---|
| `/resources` | `src/routes/resources.index.tsx` | Live, real content, URL-synced filters (`?q`, `?category`, `?sort`) |
| `/resources/$slug` | `src/routes/resources.$slug.tsx` | Live, 70 real articles, full JSON-LD + breadcrumb |
| `/sitemap.xml` | `src/routes/sitemap[.]xml.ts` | Includes `/resources` and every article (one entry per slug, `lastmod` from `date`) |
| `/standards`, `/verify`, `/help` | own route files | Live, linked from Resources dropdown via `RESOURCE_QUICK_LINKS` |
| `/cpd`, `/specialisms`, `/faq` | own route files | Live but **NOT linked from the Resources dropdown** (potential orphans from a Resources-discovery perspective) |

**No** dedicated `/resources/category/*` routes exist. Category navigation is done via `/resources?category=...` (single filter page). That is a deliberate choice — flagging it as a Phase-2 SEO opportunity, not a bug.

## 2. Files inspected

- `src/lib/resources.ts` (3050 lines, 70 articles, 6 categories, 5 author personas, 6 featured)
- `src/routes/resources.index.tsx` (library page + filters)
- `src/routes/resources.$slug.tsx` (article page, JSON-LD Article + BreadcrumbList, OG/Twitter, canonical)
- `src/routes/sitemap[.]xml.ts`
- `src/components/public/PublicHeader.tsx` (desktop `ResourcesMenu` ~L534, mobile accordion ~L1039)
- `src/components/public/nav-config.ts` (`RESOURCE_TOPICS`, `RESOURCE_QUICK_LINKS`)
- `docs/08_resources_editorial.md`
- `public/robots.txt`

## 3. Current Resources dropdown structure

**Desktop (960px panel, 3 columns):**

```text
┌─ Browse by topic ───┬─ Featured (3) ──┬─ Latest (3) ──┐
│ Find a Professional │ thumb + title   │ thumb + title │
│ Verification & Std. │ category·read   │ category·read │
│ Coaching & Clients  │ …               │ …             │
│ Fitness Business    │                 │               │
│ CPD & Education     │                 │               │
│ Platform Updates    │                 │               │
│                     │                 │               │
│ REPs explained      │                 │               │
│  · Our Standards    │                 │               │
│  · How verification │                 │               │
│  · Help Centre      │                 │               │
└─────────────────────┴─────────────────┴───────────────┘
       "70 guides · updated weekly"        "All articles →"
```

All links resolve. Featured comes from `getFeaturedArticles(3)` (6 flagged → top 3 by `featuredOrder` then date). Latest comes from `getLatestArticles(3)` (newest by `date`, ignores `featured`).

**Mobile:** Resources appears as an Accordion item in the drawer (L1039) listing the 6 topic links and the 3 quick links. No Featured/Latest thumbnails on mobile.

**Keyboard / a11y:** Uses Radix `NavigationMenu.Link asChild` → focus outline + `focus:bg-reps-warm-white` on items. Trigger is a Radix `NavigationMenu.Trigger` (keyboard accessible by default).

## 4. Current Resources data structure

- `RESOURCE_CATEGORIES` — 6 fixed strings (const tuple → `ResourceCategory` type)
- `RESOURCE_ARTICLES` — 70 articles, each with: `slug`, `title`, `excerpt`, `category`, author trio (5 personas), `date` (ISO) + `dateLabel` (display), `readTime`, `cover` (imported JPG), optional `featured`, optional `featuredOrder`, structured `body` blocks (`p` / `h2` / `ul` / `quote`)
- Helpers: `getArticle`, `getRelated`, `getFeaturedArticles`, `getLatestArticles`, `getHeroFeatured`, comparators `byDateDesc` / `byFeaturedPriority`
- `nav-config.ts` exports `RESOURCE_TOPICS` (all 6 categories) and `RESOURCE_QUICK_LINKS` (Standards / Verify / Help)

**Article-count distribution by category** is not enforced — currently heavily weighted to "Coaching & Client Management" and "Fitness Business". Not a bug, but it affects the dropdown's perceived balance.

## 5. Issues found

### Must-fix (real defects)

1. **Latest can collide with Featured.** `getLatestArticles(3)` and `getFeaturedArticles(3)` are computed independently; if a brand-new article is also flagged `featured: true` it appears in both columns. Today the top featured (`how-reps-verifies-…`, 2026-05-12) is the same as one of the newest, so duplicate-risk is real.
2. **Featured "top-up" can silently demote curation.** `getFeaturedArticles(3)` tops up with newest non-featured when fewer than 3 are flagged. Six are flagged today so it's inert, but if an editor unflags 4 the column quietly fills with whatever was most recent — opposite of editorial intent. Worth documenting as a hard cap or surfacing a dev warning.
3. **No audience segmentation in the dropdown.** Topics are mixed for clients (Find a Professional, Verification) and pros (Fitness Business, CPD, Coaching). The header should split "For clients" vs "For professionals" — currently a client looking to vet a trainer sees "Building a six-figure PT business" in Featured/Latest.
4. **No search affordance in the mega-menu.** `/resources` has search; the dropdown does not. Discoverability for 70 articles via a 6-link topic list is weak.
5. **`/cpd`, `/specialisms`, `/faq` are not reachable from the Resources dropdown** despite being natural resource destinations. (`/faq` should at minimum appear under "REPs explained".)

### Should-fix

6. **Topic links land on `/resources?category=…` with no per-category H1 or meta.** Good UX, weak SEO — Google indexes one page with shifting query params. Phase-2 work: synthesize a per-category `<title>`/`<h1>` from search params (no new routes required).
7. **No "For clients" vs "For professionals" pathway anywhere** (not in header, not on `/resources` hero, not as filter chips). Brand strategy says split these audiences.
8. **`/resources` page doesn't surface the editor's curated picks** beyond the single hero. The "Featured" column in the header is invisible on the library page.
9. **Article page lacks "Was this useful?" / related CTA variety.** Only one CTA strip (Find a professional). Pro-targeted articles should CTA to `/for-professionals` or `/pricing` instead. Currently it's the same CTA on every article regardless of audience.
10. **No FAQPage JSON-LD** anywhere despite many guide-style articles with implicit Q&A structure. Easy SEO win on the 5–10 most-trafficked guides.
11. **`og:image` on `/resources/index` is missing** (only og:title/desc/url/type). Article pages have it.
12. **Sitemap `changefreq: "monthly"` for articles** is generic. Featured/recent posts could be `weekly`.

### Nice-to-have

13. Reading-progress indicator on long articles.
14. "Recently viewed" / breadcrumb history.
15. Author landing pages (`/authors/sophie-marshall`) — flagged out of scope by current memory rules.
16. Per-category landing pages with custom hero copy.
17. RSS feed at `/resources/rss.xml`.
18. Article-level series/cluster tagging (e.g. "Hiring 101" series).

### Visual / system

- Spacing, typography, radius, orange usage all conform to the locked system (`rounded-[18px]` on cards, `rounded-[10px]` on CTAs, brand orange for "Read article", `bg-reps-panel`/`reps-border` surfaces).
- Hover states present (`hover:border-reps-orange` on cards, `hover:bg-reps-warm-white` on menu items).
- Thumbnails consistent: 16×10 covers in grid, 12×16 thumbs in menu — both `bg-cover bg-center`.
- One minor inconsistency: header dropdown uses a **light** surface (`bg-reps-warm-white` hover, `text-reps-charcoal`) while the rest of the public site uses dark `bg-reps-ink`. This is by design (light mega-menu over dark header) but worth confirming it still matches the locked mockups.

### SEO summary

| Check | Status |
|---|---|
| `/resources` title/description | ✅ keyword-rich, under limits |
| `/resources` canonical | ✅ leaf-only, absolute URL |
| `/resources` og:image | ❌ missing |
| `/resources/$slug` title/description | ✅ from article data |
| `/resources/$slug` canonical | ✅ |
| `/resources/$slug` OG + Twitter | ✅ including image |
| Article JSON-LD | ✅ `Article` + `BreadcrumbList` |
| FAQPage JSON-LD | ❌ not used |
| sitemap inclusion | ✅ all 70 + `/resources` |
| robots.txt | ✅ allow all, sitemap declared |
| Internal links → `/find-a-professional` | ✅ via CTA strip on every article |
| Internal links → `/for-professionals` | ⚠️ only via footer, not contextual on pro articles |
| Internal links → `/pricing` / `/compare` / `/signup` | ❌ no contextual cross-links from articles |

## 6. Recommended improvement plan

### Phase 1A — Defects (small, low-risk)
- **R1** Deduplicate Latest vs Featured in `getLatestArticles` (exclude slugs already in Featured *when both render together*, or compute a single ordered set in `ResourcesMenu`).
- **R2** Add `/faq` to `RESOURCE_QUICK_LINKS` ("FAQ"); add `/cpd` ("CPD library") and `/specialisms` ("Specialisms explained") to a new third quick-link group in the dropdown.
- **R3** Add `og:image` to `/resources` head (reuse hero featured cover).
- **R4** Make the Featured top-up behaviour explicit in editorial doc (already half-done) and add a dev-time `console.warn` if fewer than 3 are flagged.

Files: `src/lib/resources.ts`, `src/components/public/nav-config.ts`, `src/components/public/PublicHeader.tsx`, `src/routes/resources.index.tsx`, `docs/08_resources_editorial.md`.

### Phase 1B — Audience segmentation (medium, no new routes)
- **R5** Restructure mega-menu into 4 columns: **For clients** (Find a Pro / Verification / Hiring guides), **For professionals** (Coaching / Business / CPD), **Featured** (curated), **Latest**.
- **R6** Add an `audience: "client" | "pro" | "both"` field to `ResourceArticle` (default `both`) so Featured/Latest can be filtered or labelled.
- **R7** On `/resources`, add a top-level "For clients / For professionals / All" toggle wired to a new `?audience=` search param.
- **R8** On article pages, swap the CTA strip based on `audience` (clients → Find a Professional, pros → For Professionals / Pricing).

Files: `src/lib/resources.ts` (schema), all 70 article entries (additive field, no breaking changes), `src/components/public/PublicHeader.tsx`, `src/routes/resources.index.tsx`, `src/routes/resources.$slug.tsx`.

### Phase 1C — Discoverability inside the dropdown
- **R9** Add a small search input at the top of the desktop mega-menu that links to `/resources?q=<term>` on submit (no client-side search logic — just a redirect — keeps backend rules intact).

Files: `src/components/public/PublicHeader.tsx`.

### Phase 2 — SEO uplift (defer, larger surface)
- **R10** Synthesize per-category H1, title, meta description and `og:title/description` from `?category=` on `/resources` (still one route).
- **R11** Add `FAQPage` JSON-LD to the 5–10 highest-intent guides by extending `ResourceArticle` with optional `faq?: { q: string; a: string }[]`.
- **R12** Bump sitemap `changefreq` to `weekly` for `featured: true` articles.
- **R13** Add contextual outbound links to `/for-professionals`, `/pricing`, `/compare`, `/signup` inside pro-targeted article bodies (manual editorial pass).

### Out of scope for Phase 1
- CMS / database for articles (memory: Phase 1 = static only).
- Real per-category routes (`/resources/category/...`) — current single filter page is sufficient.
- Author landing pages.
- Comment system, reactions, share counts.
- Personalisation / recommendation engine.
- AI-summarised TL;DRs.

## 7. Questions before build

1. **Audience split** — do you want the dropdown literally split into "For clients / For professionals" columns (R5), or keep a unified topic list and add audience filter chips on `/resources` only (R7)? My recommendation: both, but you might want one or the other.
2. **R6 audience tagging** — happy to add `audience` to all 70 articles? I'll classify them; you sign off.
3. **R9 search-in-menu** — desktop only, or also mobile drawer?
4. **R10 per-category SEO synth pages** — Phase 1 or defer to Phase 2? It's the single biggest organic-traffic lever but touches `/resources/index.tsx` substantially.
5. **R11 FAQ JSON-LD** — do you want me to draft the FAQ pairs for the top 10 hiring/standards articles, or will you provide them?
6. **R13 cross-link pass** — should I add inline `<Link>`s into the existing 70 article bodies, or wait until a new editorial pass?
7. **`repsuk.org` domain** — confirmed for launch; any work I do on canonical/OG URLs should stay on `staging.repsuk.org` for now and swap at launch via a single constant?
