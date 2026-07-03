# SEO Audit & Remediation Plan

Three parallel specialist sub-agents audited: (1) route head metadata, (2) robots/sitemap/noindex, (3) on-page + JSON-LD. Consolidated below.

## Overall verdict

**Foundation: strong.** robots.txt is well-configured, sitemap is a live server route with 700+ URLs (resources, help, city×profession, coach profiles), most public routes have `head()` with title + description + canonical. Root emits Organization + WebSite JSON-LD.

**But there are ~12 real bugs and ~30 gaps holding the site back from "world-class 10/10". Grouped and prioritised below.**

---

## P0 — Broken / immediately harmful (fix first)

1. **Relative `canonical` and `og:url` on 6 crawlable pages** — `find-a-professional`, `how-it-works`, `contact`, `reviews`, `professions/$profession`, `signup`. Crawlers reject relative canonicals; Google picks its own URL. Change to absolute `https://repsuk.org/...`.
2. **Brand miscap "REPs" (should be "REPS")** in `auth`, `forgot-password`, `reset-password` titles/og.
3. **`coming-soon.tsx` has "Launching 26 June 2026" hard-coded in `<title>` and `og:title`.** Site is live — this metadata is stale. Neutralise the copy.
4. **`$.tsx` (catch-all 404) has no `head()`** — no title, no `noindex,nofollow`. Add both.
5. **`gyms/$slug` serves "Gym pages are coming soon."** with a full `<head>`, no `noindex`, no canonical, no `og:url`. Add `noindex,nofollow` until real content lands.
6. **`__root.tsx` WebSite `SearchAction` target points at `/find-a-trainer`** — route doesn't exist. Fix to `/find-a-professional`.
7. **`/professions/$profession` canonical is relative** (also caught in P0-1) — this is duplicated on purpose because it also breaks the JSON-LD self-reference.

## P1 — Missing / material SEO drag

8. **Sitemap missing 90 real pages:**
   - `/professions/$profession` (7 canonical landing pages)
   - `/in/$location` (83 city-only pages)
9. **`og:image` absent on primary acquisition pages:** `/`, `/for-professionals`, `/pricing`, `/find-a-professional`, `/in/$location`, `/resources`, `/features/operations`, `/compare`, `/about`, `/comparison-methodology`. Link previews render blank.
10. **`og:type` missing on ~30 routes.** Default is "website" for most; "article" for `/resources/$slug` (already correct).
11. **`twitter:` tags absent/incomplete on ~40 routes.** Add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` where OG exists.
12. **17 admin routes have no `head()`** → no `noindex,nofollow`. Auth guard is defence #1, but robots meta is defence #2.
13. **`dashboard-demo.tsx` publicly indexable, self-canonical, not in sitemap** — will surface as thin/misleading content. Add `noindex`.
14. **`signup.tsx` not noindexed** (transactional page).
15. **`verify-email`, `forgot-password`, `reset-password` missing canonical entirely.**
16. **`c.$slug` (coach shop-front) missing `og:url`.**
17. **`pro.$slug` `og:image` is conditional** — profiles without avatars inherit nothing (root has no fallback). Add a brand default fallback.

## P1 — Structured data gaps (rich-result eligibility)

18. **FAQPage JSON-LD missing where FAQ blocks already render:** `/for-professionals`, `/c/$slug`, `/specialisms`, `/professions/$profession`. Data exists — just not wired into `head().scripts`.
19. **BreadcrumbList missing on deep routes:** `/pro/$slug`, `/c/$slug`, `/professions/$profession`, `/in/$location/$profession`, `/resources/$slug`.
20. **SoftwareApplication schema missing on comparison pages** (`/compare/reps-vs-*`) — highest-CTR schema for "[competitor] alternative" queries.
21. **`/compare/reps-vs-*` `og:image` uses a bundled JS import** — likely resolves to a relative path in prod. Switch to absolute CDN URL.
22. **`/pricing` missing Product/Offer schema** for the three tiers.
23. **`/resources/` index missing CollectionPage / ItemList schema.**

## P2 — Polish

24. **Description length issues:** `/pricing` desc 28ch (too short), `/features/ai` 193ch, `/features/coaching` 215ch (both truncated in SERP). Aim 130–160ch.
25. **`for-professionals.tsx` og:title weaker than `<title>`.**
26. **Legal pages (`terms`, `privacy`, `cookies`) indexed — burn crawl budget on boilerplate.** Add `noindex,follow`.
27. **`__root.tsx` no fallback `og:description` / `og:url`** — safety net if a leaf omits them.
28. **robots.txt defence-in-depth:** explicit `Disallow: /admin`, `/portal`, `/dashboard`, `/_authenticated`.
29. **Homepage `<img alt="">` on hero LCP.** Empty alt is defensible (decorative), but a real alt helps accessibility + image SEO. Same for `/for-professionals` gym hero.
30. **`/c/$slug` and `/resources` index have no cross-links to directory/city pages** — missed internal-linking equity.

---

## Execution plan (build order)

I'd execute in these batches, each a discrete build turn so you can QA between:

**Batch 1 — P0 fixes + Search Console cleanup (small, safe):** absolute canonicals, brand caps, `$.tsx` head, `gyms/$slug` noindex, SearchAction URL, coming-soon neutralised.

**Batch 2 — Sitemap completeness:** add `/professions/$profession` and `/in/$location` entries; submit fresh sitemap to Search Console.

**Batch 3 — OG/Twitter completeness:** default `og:image` fallback (brand card), sweep every public route to add `og:type` + full twitter tags. Introduce a shared helper `buildSocialMeta({title, description, url, image, type})` in `src/lib/seo/social-meta.ts` so every route uses the same 8-tag block.

**Batch 4 — Robots hygiene:** noindex admin/portal/signup/legal/demo routes; expand robots.txt disallow.

**Batch 5 — Structured data:** FAQPage on the 4 pages with existing FAQ data; BreadcrumbList on deep routes; SoftwareApplication on compare pages; Product/Offer on pricing; CollectionPage on resources index.

**Batch 6 — Copy polish:** description length fixes, weak og:titles, `og:image` CDN URLs for compare pages, alt text on hero LCP images.

**Batch 7 — Search Console verification pass:** URL-inspect ~15 representative URLs via the Search Console connector, capture any residual issues, submit sitemap, trigger a fresh SEO scan and mark fixed findings.

---

## Deliverables

- All fixes shipped and typechecked.
- Fresh `seo_chat--trigger_scan` after Batch 6.
- Summary report of before/after counts (routes with full OG, routes with JSON-LD, sitemap size, canonicals-fixed).

## Approval

Confirm **"go batch 1"** to start with the P0 bug fixes only, or **"go all batches"** to plough through 1→7 sequentially.
