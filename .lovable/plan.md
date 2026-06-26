
# Help Center — Stripe Docs-tier

The goal: the best help center in the fitness-platform space. Public-first (SEO + pre-signup trust), authenticated-aware (deep-links into the real dashboard), and anchored by a flagship **Verification** page that doubles as a sales asset.

## Information architecture

Public URL: `/help` (footer-linked, also linked from `/standards`, `/pricing`, `/for-professionals`, `/verification` badges).

```
/help                              Landing: search, top tasks, categories, status
/help/verification                 FLAGSHIP long-form (anchor of the whole hub)
/help/$category                    Category index (e.g. /help/getting-started)
/help/$category/$slug              Article
```

Categories (Verified-tier scope only; Pro/Studio deferred):

1. **Getting started** — sign up, choose Verified, complete profile, go live
2. **Verification** — identity, qualifications, insurance, renewals, what fails and why
3. **Your public profile** — slug, photo, services, locations, in-person vs online
4. **Enquiries & reviews** — receiving enquiries, replying, review requests, replies, removals
5. **Account & billing** — Stripe billing, change plan, cancel, invoices, GDPR
6. **Trust & safety** — code of conduct, complaints, removal grounds (mirrors `/standards`)
7. **Troubleshooting** — sign-in, email delivery, photo uploads, QR upload, badge not showing

Pro/Studio-only articles are written but tagged `tier: pro` and hidden from nav until launch (so we don't double the work later).

## The flagship: `/help/verification`

This is the page nobody else has. It does the heavy lifting for SEO, sales, and support deflection.

Sections:
1. **Hero** — "How REPs verifies professionals" + live SLA pill ("avg verification time, last 30 days: 18h" — pulled from `identity_verifications` / `qualifications` timestamps via a server fn).
2. **The three checks** — Identity, Qualifications, Insurance. Each with: what we check, what we accept, what we reject, how long it takes, how often it's re-checked, the badge it unlocks.
3. **Accepted awarding bodies matrix** — table by profession (PT, Group Ex, S&C, Nutritionist, Yoga, Pilates) × level (L2/L3/L4) with Ofqual status. Replaces the vague language on `/standards`.
4. **What a good vs rejected document looks like** — annotated screenshot pairs (real dashboard, redacted).
5. **The reviewer's checklist** — actual admin checklist published transparently. This is the Stripe-docs move nobody else makes.
6. **Renewals & expiry** — insurance auto-reminder cadence, qual re-verify triggers.
7. **Appeals** — how to challenge a rejection, SLA, who reviews.
8. **FAQ** (FAQPage JSON-LD).
9. **CTA strip** — "Start verification" (authed → `/dashboard/verification`) / "Create account" (unauthed → `/signup`).

## Article anatomy (every article)

- Breadcrumb + category chip
- Title (H1) + 1-line summary
- **Last reviewed** date + author byline ("Reviewed by Scott McKay")
- **Applies to** chip row (Verified / Pro / Studio)
- TOC (sticky on desktop)
- Body: MDX-style sections, callouts (`Note`, `Warning`, `Tip`), annotated screenshots
- **Deep-link action button** when applicable — e.g. an article about uploading insurance has a "Open insurance upload" button that, when signed in, navigates to `/dashboard/verification` and opens the dialog; when signed out, prompts sign-in then resumes
- "Was this helpful? 👍 / 👎" → writes to `help_article_feedback` (anon-allowed, rate-limited)
- "Still stuck? Contact support" → opens `/dashboard/support/new` (authed) or `/contact` (anon)
- Related articles (same category + tag overlap)
- JSON-LD: `Article` + `BreadcrumbList`; FAQ sections additionally emit `FAQPage`

## Cmd-K command palette (the differentiator)

Mount globally (public + dashboard). Trigger: `Cmd/Ctrl+K`, plus a search input on `/help`.

Two result types:
- **Articles** — fuzzy match on title, summary, tags, body
- **Actions** (authed only) — e.g. "Upload insurance", "Request a review", "Edit public profile", "Open my support tickets". Selecting routes to the page and triggers the dialog/action.

Built with `cmdk` + a tiny pre-built search index generated at build time from MDX frontmatter (no server search needed at launch; Algolia later if volume warrants).

## Search (non-palette)

`/help` page has a prominent search input that opens the palette. The palette also accepts `?q=` so links like `/help?q=insurance` are shareable.

## Authoring model

Articles live as **MDX files** in `src/content/help/$category/$slug.mdx` with typed frontmatter:

```yaml
title: How to upload your insurance certificate
summary: Accepted formats, file size, and what we check.
category: verification
tier: [verified, pro, studio]
lastReviewed: 2026-06-26
author: Scott McKay
tags: [insurance, upload, qr]
deepLink: { label: "Open insurance upload", to: "/dashboard/verification", action: "open-insurance-dialog" }
related: [verification/what-insurance-we-accept, troubleshooting/upload-fails]
```

A build-time loader (Vite `import.meta.glob`) produces a typed manifest used by routes, the palette index, and sitemap.

## Screenshots

I generate them by driving Playwright against the live dashboard at `localhost:8080`, capturing element shots (not full page), then annotating with a small `<Annotated>` MDX component (numbered pins + caption list). Stored under `src/content/help/_screenshots/`. The dashboard pages I'll capture for v1: `/dashboard/verification` (all 3 stages), upload-certificate dialog (file + QR tabs), insurance upload, public-profile editor, enquiries inbox, review-reply UI, support new-ticket form.

## SEO

- `head()` per route: title, description, og:title/description/url, canonical
- Article: `Article` + `BreadcrumbList` JSON-LD
- FAQ blocks: `FAQPage` JSON-LD
- `HowTo` JSON-LD on step-by-step articles (e.g. "How to verify your identity")
- Sitemap entries auto-added from the MDX manifest
- Footer link added; Standards page cross-links into `/help/verification`; `/for-professionals`, `/pricing`, `/signup` link to relevant articles

## Trust signals on every page

- "Last reviewed {date}" stamp (real, from frontmatter)
- Author byline
- Helpful-vote count once we have data (hidden until n≥10)
- Live SLA pill on the verification flagship

## Dashboard mirror

`/dashboard/help` is a thin shell that embeds the same MDX content but:
- Pre-fills user context (no "if you're signed in…" branches)
- Adds in-app "Open this in the dashboard" deep links inline
- Adds a footer "Contact support" that opens the ticket form pre-tagged with the article slug (so support knows what the user was reading)

## Phasing

**Phase A (this build, ~3 days):**
- Routing, layout, palette, MDX pipeline, search index, JSON-LD, sitemap, footer link
- Flagship `/help/verification` written + screenshotted
- 12 Verified-tier articles (Getting started ×3, Verification ×4, Public profile ×2, Enquiries/reviews ×2, Account ×1)
- Helpful-vote table + RPC
- Dashboard mirror at `/dashboard/help`

**Phase B (follow-up):**
- Remaining ~20 articles, plus Pro/Studio-tier articles authored-but-hidden
- Live SLA pill data wiring
- Algolia (only if search volume justifies)

## Files I'll create / change

- `src/routes/help.tsx` (layout)
- `src/routes/help.index.tsx` (landing)
- `src/routes/help.verification.tsx` (flagship — bespoke layout, not MDX)
- `src/routes/help.$category.index.tsx`
- `src/routes/help.$category.$slug.tsx`
- `src/routes/_authenticated/_professional/dashboard_.help.tsx` (+ children)
- `src/content/help/**/*.mdx` (articles)
- `src/content/help/_screenshots/**/*.png`
- `src/lib/help/manifest.ts` (build-time MDX loader + typed index)
- `src/components/help/` — `HelpLayout`, `ArticleLayout`, `HelpSearch`, `CommandPalette`, `Annotated`, `Callout`, `DeepLinkButton`, `HelpfulVote`, `TocSidebar`, `RelatedArticles`
- `src/components/marketing/PublicFooter.tsx` (add `/help` link)
- Migration: `help_article_feedback` table + RLS + GRANTs
- Server fns: `recordHelpfulVote`, `getVerificationSla` (flagship pill)
- Sitemap generator: include help routes
- Install: `cmdk`, `@mdx-js/rollup`, `@mdx-js/react`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`

## What I'm explicitly NOT doing in Phase A

- AI answer search (RAG over articles) — defer; static search is enough at our volume
- Algolia — defer; build-time index handles it
- Multi-language — defer
- Pro/Studio articles surfaced in nav — written but tier-gated
- Video walkthroughs — slots reserved in the flagship, content added post-launch

## Acceptance bar

- A new trainer can go from `/help` → understand verification → start the flow in under 60 seconds, signed out or in
- Every article ranks-eligible (unique title/description, JSON-LD, canonical, in sitemap)
- `Cmd+K` from any public or dashboard page jumps to article OR triggers a dashboard action
- Flagship `/help/verification` is good enough to link from `/pricing` as proof
