# Global positioning — strip UK from product copy

REPs is a global platform. The current copy mixes worldwide framing ("clients worldwide", "global register") with hard UK references ("built for UK PTs", "London, UK", "across the UK"), which reads as a contradiction. This pass removes the country mentions from product/marketing/dashboard copy without rewriting editorial articles.

## Rules for this pass

- **Strip every "UK" / "United Kingdom" / "across the UK" / "in the UK"** from product, marketing, comparison, dashboard, search-placeholder, and chrome copy.
- **Allowed neutral substitutions**: "global register", "clients worldwide", "in your city", "wherever you train", "personal trainers and coaches" — only where the sentence actually needs scope. Default is to just delete the country qualifier.
- **Keep £** as the displayed currency everywhere (no currency localisation in this pass).
- **Drop "REPs UK" everywhere**, including legacy/migration copy — overrides the old memory exception. The brand is just "REPs".
- **Do NOT touch** long-form editorial articles in `src/lib/resources.ts` (cost guides, DBS guide, running coach, nutritionist, safeguarding). Those have ~55 UK references baked into UK-specific facts and need a separate editorial pass.

## Files in scope (product/marketing copy)

- `src/data/competitor-data.ts` — comparison FAQ answers, audience lines ("built for UK PTs", "UK-built alternative")
- `src/data/competitor-editorial.ts` — comparison editorial blurbs
- `src/routes/index.tsx`, `src/routes/home-legacy.tsx`
- `src/routes/find-a-professional.tsx` — "London, UK" placeholder → "Your city"
- `src/routes/in.$location.tsx`, `src/routes/professions.$profession.tsx`
- `src/routes/for-professionals.tsx`, `src/routes/how-it-works.tsx`, `src/routes/about.tsx`, `src/routes/careers.tsx`, `src/routes/contact.tsx`, `src/routes/press.tsx`, `src/routes/reviews.tsx`, `src/routes/privacy.tsx`
- `src/routes/compare.tsx`, `src/routes/compare_.reps-vs-trainerize.tsx`, `src/routes/compare_.reps-vs-mypthub.tsx`, `src/routes/compare_.reps-vs-pt-distinction.tsx`
- `src/routes/pro.$slug.index.tsx`, `src/routes/resources.index.tsx`
- `src/routes/dashboard_.profile.tsx`, `src/routes/dashboard_.leads.tsx`, `src/routes/dashboard_.clients.$slug.tsx`, `src/routes/dashboard_.settings.tsx`
- `src/routes/admin.tsx`, `src/routes/admin_.settings.tsx`, `src/routes/admin_.cpd.tsx`
- `src/components/marketing/HeadToHead.tsx`
- Author bios in `src/lib/resources.ts` (Sophie, Priya, etc.) — only the bio sentences, not article bodies

## Files explicitly NOT in scope

- Article bodies in `src/lib/resources.ts` (everything inside `sections: [...]`) — left alone
- Anything outside `src/` (configs, package files)

## Memory updates

1. Edit Core rule in `mem://index.md`:
   - Replace `Always say "REPs" (not "REPs UK" except legacy/migration contexts).` with `REPs is a global platform. Never put "UK" / "United Kingdom" / "across the UK" in product, marketing, dashboard, or comparison copy. Default: drop the country qualifier. Where scope is needed, use "global register" / "clients worldwide" / "in your city". Brand is always "REPs" — never "REPs UK". Keep £ pricing for now. Long-form articles in src/lib/resources.ts are out of scope for this rule until a dedicated editorial pass.`
2. No new sub-memory file needed — the Core line is the rule.

## Method

1. Update memory first so the rule is durable.
2. Walk each in-scope file, replace UK phrases with the neutral substitutions above (delete by default).
3. Update `find-a-professional` search placeholder + any other location placeholders to `"Your city"`.
4. Skim resources.ts only for author bios + index/list copy; do not touch article section bodies.
5. Visual smoke check: home, find-a-professional, /compare, one /compare/* page, /for-professionals, one dashboard page.

## Out of scope

- Editorial article rewrite (separate pass)
- Currency localisation
- Adding country/region selectors
- i18n / translation
- SEO meta rewrites for country-targeted pages
