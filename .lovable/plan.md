# Plan: REPs Resources Hub (Phase 1)

A full blog architecture positioned as **Resources** — a professional fitness industry resource centre, not a casual blog. Static content only; CMS comes later.

## Routes

```text
/resources              -> hub / index with category filters + article grid
/resources/$slug        -> individual article page
```

Add **Resources** link to the public header nav (between "Find a professional" and "Pricing", or wherever it fits the existing nav order) and to the footer under a Resources column.

## Categories

Six fixed categories shown as filter pills on `/resources`:

1. Find a Professional
2. Verification & Standards
3. Fitness Business
4. Coaching & Client Management
5. CPD & Education
6. Platform Updates

Stored as a string union in `src/lib/resources.ts` (single source of truth) so cards, filters, and article pages all stay in sync.

## /resources (hub)

Layout follows the locked REPs public-page system:

- **Hero band** — H1 "Resources", short subtitle ("Guidance, standards and industry insight for fitness professionals and the people who hire them."), search input (visual only, no logic in Phase 1).
- **Category pills** — horizontal scroll on mobile, wrap on desktop. "All" + the six categories. Active pill uses brand orange.
- **Featured article** — full-width card (radius 18px) with cover image, category tag, title, excerpt, read time, author.
- **Article grid** — 3-column on desktop, 2 on tablet, 1 on mobile. Cards at radius 18px (result/featured card token). Each card: cover image, category tag, H3 title, 2-line excerpt, meta row (read time · date).
- **CTA strip** — orange band: "Looking for a verified professional?" → `/find-a-professional`.

## /resources/$slug (article)

- Breadcrumb: Resources › {Category} › {Title}
- Article header: category tag, H1, author + date + read time
- Hero image (radius 24px)
- Long-form body (prose styles, semantic tokens)
- Author bio card (radius 16px) at the foot
- "Related articles" — 3 cards from the same category
- Same CTA strip as the hub

Article bodies are hardcoded JSX in Phase 1 (rendered from a static `articles` array). No MDX, no CMS.

## Sample articles (3)

Pick one each from three different categories so the design shows variety:

1. **"How REPs verifies a fitness professional"** — Verification & Standards
2. **"Choosing the right personal trainer: what to look for"** — Find a Professional
3. **"5 ways to grow your PT business in 2026"** — Fitness Business

Each ~400–600 words of realistic placeholder copy (not lorem ipsum).

## SEO

- Per-route `head()` on `/resources` (title, description, og:*, canonical).
- Per-route `head()` on `/resources/$slug` derived from the loaded article (title, excerpt, og:image = hero image, og:type "article", Article JSON-LD with headline/image/datePublished/author).
- Add both routes to `src/routes/sitemap[.]xml.ts` — `/resources` static, plus one entry per article slug from the same source the route reads.

## Visual rules (REPs compliance)

- Brand orange via `bg-brand-orange` / `text-brand-orange` tokens only — no hex in components.
- Radii: cards 18px, hero image 24px, pills full, inputs 12px, buttons 10px (flat — no shadow).
- Stars / accents in brand orange, never gold.
- Reuse existing public-page header, footer, and section spacing from the locked mock-ups.

## Out of scope (Phase 2)

- CMS / Supabase-backed articles
- Real search & filtering logic
- Newsletter signup wiring
- Comments, reactions, view counts
- Author pages
