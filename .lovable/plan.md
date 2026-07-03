# Migration Plan — one URL, one page, every member

**North star:** every REPs member has a single public URL — `repsuk.org/c/<slug>` — and every member gets the *entire* one-page website. No tier gating on the page itself. What differs by tier is what plugs *into* the page (enquiries inbox, bookings, payments, analytics), not what the visitor sees.

---

## The decisions we're locking in

1. **Canonical URL:** `/c/$slug` (the existing 1768-line locked coach-shopfront becomes the universal member page).
2. **Sub-routes move too:** `/pro/$slug/enquire` → `/c/$slug/enquire`, `/pro/$slug/review` → `/c/$slug/review`.
3. **Old URLs 301-redirect** to the new URLs — no dead links, no lost SEO.
4. **Dashboard label:** "Shop-front" → "Website" everywhere the trainer sees it.
5. **No tier gate on the page.** The page renders the same for every published member. Missing data (no services, no proof cards, no reviews yet) is handled by the page's existing empty states — sections hide gracefully when there's nothing to show.
6. **`/pro-v2/$slug` sandbox stays private** for now (not linked, not indexed). Delete once we're happy nothing was worth pulling in.

---

## Step-by-step (in build order)

### 1. Kill the tier gate on `/c/$slug`
- Remove the Pro/Studio check in `src/routes/c.$slug.tsx` + `src/lib/shop-front/shop-front.functions.ts`.
- Publish criteria collapses to the standard public-visibility gate (`is_published = true`, `is_demo = false`, active paid subscription — Core included). No new logic; just widen who qualifies.
- Empty-state audit on every section (services, proof cards, testimonials, foundation method, gallery) — confirm each one hides or shows a soft placeholder when the underlying data is missing. Verified members with a sparse profile must still look clean.

### 2. Move sub-routes onto `/c`
- Create `src/routes/c.$slug.enquire.tsx` and `src/routes/c.$slug.review.tsx` — thin wrappers that re-export the existing components from the `pro.$slug.*` files (no visual change; enquire page stays locked per `mem://design/locked-enquire`).
- Update every internal `<Link to="/pro/$slug/enquire">` / `.../review` → `/c/$slug/...`. Same for `useNavigate`, email templates, help articles, JSON-LD.

### 3. 301 redirects (SEO-safe handover)
- Replace `src/routes/pro.$slug.tsx`, `pro.$slug.index.tsx`, `pro.$slug.enquire.tsx`, `pro.$slug.review.tsx` with `beforeLoad: () => redirect({ to: "/c/$slug[/...]", params, throw: true })` files. Legacy bookmarks + Google links keep working; Google will re-crawl and swap canonicals over a few weeks.
- Add absolute `<link rel="canonical">` pointing to `/c/$slug` on the new page (already there — verify).

### 4. Sitemap + robots
- `src/routes/sitemap[.]xml.ts` already emits `/c/$slug` entries. Remove any lingering `/pro/` entries. `robots.txt` untouched.

### 5. Rename "Shop-front" → "Website" (trainer-facing only)
- Dashboard nav label, page titles, empty states, tooltips.
- Marketing: `/features/shop-front` → keep the URL (SEO) but change on-page copy + H1 to "Your website". Add a redirect from any old internal links pointing at `/features/shop-front` if we later rename the route — for now leave the URL.
- Help articles that reference "shop-front".
- Pricing tier comparison rows.
- **Not renamed** (internal only, zero user impact): `src/lib/shop-front/`, DB tables, memory keys. Refactoring code paths is out of scope for this migration — do it in a later cleanup pass.

### 6. Memory refactor (small, targeted)
After the migration lands, update these memories in one batch:
- `mem://design/coach-shopfront` — drop "Pro+Studio only", note it's the universal member page now, rename label to "Website".
- `mem://design/locked-profile` — mark `/pro/$slug` as retired, point to `/c/$slug` as the canonical profile.
- `mem://design/locked-shop-front` — drop "Pro-only" claim.
- Core rules in `mem://index.md` — update the coach-shopfront core line to remove tier scope.
- **Not touched:** homepage, city pages, enquire page, radius system, trainer imagery, banned orgs, no-BD-migration, hero overlay system — all still current.

### 7. QA before shipping
- Manual: load `/c/<verified-member-slug>` — every section renders or hides cleanly. Then a Core member, then a Pro member, then a Studio member.
- Manual: hit each legacy URL (`/pro/james-wilson`, `/pro/james-wilson/enquire`, `/pro/james-wilson/review`) — confirm 301 to the `/c` equivalent.
- Sitemap: `curl /sitemap.xml | grep -c "/pro/"` → 0. `grep -c "/c/"` → matches published member count.
- Dashboard: sign in as a trainer, confirm the nav says "Website" and links to `/dashboard/website` (already the route).
- Search Console: submit the new sitemap after publish so Google re-crawls fast.

---

## What this plan deliberately does NOT do

- **No visual redesign** of `/c/$slug`. It's locked and it's the design we want.
- **No refactor of `src/lib/shop-front/`, DB tables, or memory keys** — internal-only rename creates churn without user value. Later cleanup pass.
- **No decision on `/pro-v2/$slug`** — leaves it dormant. Delete it in the next turn if you want; keeping it doesn't affect SEO (not linked, not in sitemap).
- **No pricing/tier changes.** Every member already at Core+ qualifies as a "paid, publicly visible" member under the existing gate — that's all we need.

---

## Risk / rollback

- Redirects are one-line route files — trivially reverted.
- Tier-gate removal is a one-line change in the visibility helper — trivially reverted.
- The page component itself doesn't change, so there's no visual regression risk on `/c/$slug`.
- **Real risk:** a Verified member with almost no data looks bare. Mitigation = the empty-state audit in step 1. If a section looks sad with no data, we hide it, not show a placeholder.

---

## Technical notes (skip if not needed)

- File moves: `src/routes/pro.$slug.tsx` and children become redirect stubs (kept, not deleted, so TanStack file-based routing still matches the URLs and issues 301s). Deleting would 404, which Google punishes.
- Visibility helper: `src/lib/visibility/public-gate.server.ts` already returns any published + paid member. No SQL change needed — just confirm the RPC `list_publicly_visible_pro_ids` includes Core-tier subs (it does per `mem://phase/2.0-verified-scope`).
- Shop-front data loader in `src/lib/shop-front/shop-front.functions.ts` may currently throw or 404 for non-Pro members. That's the one function to widen — remove the tier check, keep the publish/paid check.

Say go and I'll execute in the order above.
