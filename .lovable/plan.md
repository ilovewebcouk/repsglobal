## Goal

1. Kill "Shop-front" / "shop front" terminology everywhere user-facing — replace with **"Website"**.
2. Update the pricing compare table so **Core gets Website features** too, with **Custom domain** as the Pro/Studio differentiator.
3. Rename the dashboard route slug `/dashboard/shop-front` → `/dashboard/website` (with redirect).
4. Code-level cleanup of `shop-front` directories/symbols where safe (lib folders), without touching DB column names.

## Scope of changes

### A. Pricing compare table (`src/components/pricing/pricing-data.ts`)

Rewrite the "Your shop-front (/c/your-name)" group as **"Your website"**:

| Row | Core | Pro | Studio |
|---|---|---|---|
| Personalised website page (/c/your-name) | ✓ | ✓ | ✓ |
| Custom accent colour + hero photo | ✓ | ✓ | ✓ |
| Three-tier services with 'Most popular' highlight | ✓ | ✓ | ✓ |
| Methodology / signature method section | ✓ | ✓ | ✓ |
| Transformations & proof cards | ✓ | ✓ | ✓ |
| Sticky section nav + mobile CTA bar | ✓ | ✓ | ✓ |
| Deep-linked enquiry routing | ✓ | ✓ | ✓ |
| **Connect a custom domain** | — | ✓ | ✓ |
| Team / studio accent options | — | — | ✓ |

Also update the "Visibility & trust" row label "Public directory listing (/pro/your-name)" — leave as-is (directory is separate from website).

### B. Global copy sweep "Shop-front" → "Website"

Files to update (user-facing strings only — leave DB columns, migration files, and `.gen.ts` alone):

- `src/components/pricing/pricing-data.ts` (group title + features bullets)
- `src/routes/features.shop-front.tsx` → keep file path (SEO) but update H1/meta/copy to "Website". (Optional: add 301 later — out of scope this pass.)
- `src/components/features/feature-config.ts` + `feature-content.tsx` — label "Shop-front" → "Website"
- `src/components/public/PublicHeader.tsx` — nav label
- `src/components/dashboard/nav-data.ts` — sidebar "Shop-front" → "Website"
- `src/components/dashboard/hub/index.tsx` — hub tile copy
- `src/components/dashboard/HeroImageEditor.tsx`, `ServiceImageEditor.tsx` — UI copy
- `src/routes/_authenticated/_professional/dashboard.tsx`, `dashboard_.profile.tsx`, `dashboard_.services.tsx` — any visible copy
- `src/routes/c.$slug.tsx`, `pro.$slug.enquire.tsx`, `pro.$slug.review.tsx` — meta/copy
- `src/routes/for-professionals.tsx`, `features.visibility.tsx`, `features.operations.tsx`, `features.coaching.tsx`, `features.growth.tsx`, `features.ai.tsx`, `about.tsx`, `reviews.tsx`, `cpd.tsx`, `contact.tsx`, `coming-soon.tsx`
- `src/components/marketing/TierCard.tsx`, `ComparisonStrip.tsx`, `ReplacedStackBoard.tsx`
- `src/components/contact/ContactForm.tsx`
- `src/components/features/PillarPage.tsx`, `FeatureGroupLayout.tsx`
- `src/lib/email-templates/relaunch-announcement.tsx`
- `public/llms.txt`
- `tests/seo-snapshot.test.mjs` — update expected strings

### C. Dashboard route rename

- Create new route `src/routes/_authenticated/_professional/dashboard_.website.tsx` (move contents of `dashboard_.shop-front.tsx`).
- Replace `dashboard_.shop-front.tsx` with a redirect to `/dashboard/website` (preserves any old bookmarks/links).
- Update all internal `<Link to="/dashboard/shop-front">` → `/dashboard/website` (sidebar, hub, profile page, etc.).

### D. Lib folder rename (optional, low risk)

- Leave `src/lib/shop-front/*` paths intact this pass to avoid wide import churn. Only rename if quick (will assess at build time). DB column `shop_front_*` stays.

### E. Memory updates

- Update `mem://design/coach-shopfront` and `mem://design/locked-shop-front` headers/descriptions to say "Website" (content rules unchanged).
- Update Core memory line about "Shop-front is a Pro+Studio feature" → "Website is available on all tiers; custom domain is Pro+Studio."

### Out of scope (call out, not doing now)

- Actual custom-domain wiring (DNS / cert provisioning) — pricing claim only; build later.
- Renaming `lib/shop-front/` folder & `shop_front_*` DB columns — internal only, deferrable.
- 301 redirect for `/features/shop-front` → `/features/website` — can add in a follow-up.

## Verification

- `bun run build:dev` clean
- `bun run test:seo` passes (after updating expected strings)
- Manual: visit `/pricing`, `/dashboard/website`, `/features/shop-front`, `/c/james-wilson` — copy reads "Website" everywhere.
