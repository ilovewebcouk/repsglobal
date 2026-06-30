Plan to fix the broken Google result and stop this class of SEO/redirect issue:

1. **Fix the exact Google 404 immediately**
   - Add a deterministic redirect for:
     `/reps/blog/the-register-of-exercise-professionals-reps-relaunched-to-support-fitness-professionals-to-grow-and-succeed`
   - Destination: a live, indexable REPS article/resource page rather than the homepage or a generic 404.
   - Use a true permanent redirect so Google transfers the old result instead of keeping a dead URL.

2. **Handle the whole legacy blog pattern**
   - Extend the legacy catch-all resolver so old `/reps/blog/*` and likely `/blog/*` URLs are treated as legacy content, not random misses.
   - Add a small curated mapping layer for high-value legacy articles first, then fallback unknown legacy blog posts to a clean `410 Gone` with `noindex,follow` rather than a soft/default 404.
   - Keep professional profile redirects separate so the existing `/c/{slug}` redirect logic is not disturbed.

3. **Repair current article SEO metadata**
   - Fix the current resource article route which is still generating canonical/OG URLs against `https://staging.repsuk.org` in source.
   - Change it to `https://repsuk.org` so crawlers see the correct canonical, OG URL, Article JSON-LD publisher URL, and breadcrumb URLs.

4. **Sitemap sanity check**
   - Confirm the sitemap only advertises canonical current URLs (`/resources/...`, `/c/...`, `/in/...`) and does **not** include dead legacy `/reps/blog/...` URLs.
   - Keep `https://repsuk.org/sitemap.xml` as the sitemap target.

5. **QA before claiming fixed**
   - Verify the exact URL from your screenshot returns a redirect, not a 404.
   - Verify the destination page returns `200`, self-referencing canonical, correct title/meta description, and Article JSON-LD.
   - Verify the sitemap still serves correctly.

Technical notes:
- Files likely touched: `src/lib/seo/legacy-redirects.functions.ts`, `src/routes/resources.$slug.tsx`, and possibly `src/lib/resources.ts` if the best destination article needs to be created rather than mapped to an existing one.
- I will not change the public design/UI for this; this is routing + SEO metadata only.