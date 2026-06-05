
# Coach shop-front landing page — `/c/$slug`

A static, world-class one-page site every REPs trainer gets for free, populated from their REPs profile. This replaces the need for a personal website. Phase 1: visuals only, mock data, no auth/DB/payments.

## 1. Route + relationship to existing surfaces

- **New file:** `src/routes/c.$slug.tsx` → URL `/c/$slug`
- **Distinct from** the locked `/pro/$slug` (REPs directory listing) and `/pro/$slug/enquire` (enquiry form). Both stay frozen.
- **Shareable link** trainers put in Insta bio, QR codes, business cards: `repsglobal.com/c/james-carter`.
- **Primary CTA** on the page deep-links to `/pro/$slug/enquire` (we already locked that flow — no duplication).
- **Secondary "Client login"** entry links to `/login` (existing).
- Mock-data source: reuse the `PROS` record from `src/routes/pro.$slug.index.tsx` (extract to `src/lib/pros.ts` in a follow-up — for now import directly to keep the diff small).
- `noindex` for now (Phase 1, mock data). SEO pass when real data lands.

## 2. Section list (top → bottom)

1. **Slim REPs chrome bar** — minimal top bar: REPs wordmark left, "Verified on REPs" pill, "Client login" link right. Not the full `PublicHeader` — this page reads as the trainer's site, not a REPs marketing page.
2. **Hero** — full-bleed coach photo (left or right), name + role + city, headline ("Helping busy professionals build strength…"), 5-star + review count + verified badge inline, two CTAs: **Enquire** (primary, → `/pro/$slug/enquire`) and **See services** (anchor scroll).
3. **Trust strip** — 4 stat tiles: years coaching · clients trained · REPs verified date · insurance valid. Sourced from profile.
4. **Services** — 3-column grid of bookable service cards (uses existing service shape from PROS). Each card: image, title, short desc, price, "Enquire" button → enquire page with service preselected (query param `?service=slug`).
5. **About** — 2-column: portrait + bio paragraphs + specialisms as pills.
6. **Where I train** — gym/venue logos strip + cities served (in-person + online badges).
7. **Results / transformations** — masonry of 3–6 before/after or training-moment images with short caption (mock data).
8. **Testimonials** — 3-card row, name + role + quote + star rating.
9. **Qualifications & insurance** — clean list of certs with issuer + REPs-verified tick (reuses profile data).
10. **FAQ** — shadcn `Accordion`, reuses profile FAQs.
11. **Social + contact** — outbound icon buttons (Instagram, TikTok, YouTube, X, website) opening in new tab. No API, no embeds. Plus "Send enquiry" button repeating the primary CTA.
12. **Sticky mobile enquire bar** — bottom of viewport on `<lg`: avatar + name + "Enquire" button.
13. **REPs footer mark** — small "Powered by REPs · Verified professional" with link to `/` and `/standards`. Not the full `PublicFooter`.

## 3. Light personalisation (locked in design tokens)

Trainer can influence (these are mock-data fields for now; later wired to profile):
- Hero photo + 1 logo (small, rendered next to their name in the chrome bar, optional)
- 1 **accent colour** — picked from a curated REPs-safe palette (orange [default], teal, indigo, plum, forest, slate). NOT free hex. Drives the primary CTA + accent strokes only. Body, headings, surfaces, radii, type all stay REPs-locked.
- Tagline, services, testimonials, transformations, FAQs, socials.

Always-locked REPs chrome:
- Typography (Inter Tight + Inter), spacing scale, radius scale (16/18/22/24/full/10/12), `--reps-orange` for verified pill, footer "Powered by REPs".

## 4. Social media — outbound links only (Phase 1)

Branded icon buttons for: Instagram, TikTok, YouTube, X, Website, Email. Open in new tab, `rel="noopener noreferrer"`. No oEmbed, no API, no per-user OAuth. Embedded feeds are a Phase 2 add-on if trainers ask for it (Instagram Graph API requires a Business account + Meta app review + token refresh — out of scope until validated demand).

## 5. Components to use (shadcn-first)

- `Button` (with `data-icon` on icons), `Badge`, `Card` (full composition), `Accordion`, `Avatar`, `Separator`, `Tooltip`, `AspectRatio` for image tiles.
- Reuse `FeaturedProCard` shape language for service tiles (consistent with city + profession pages).
- Reuse the verified pill + star rating treatment from the locked profile so the page feels unmistakably REPs.

## 6. Radius + token discipline

Apply the FINAL scale: hero panel 24px, service cards 18px, std cards 16px, buttons 10px, inputs 12px, badges/pills full, chrome small bits 6/8px. No `rounded-xl/2xl/3xl`. Accent colour comes from a new tokenised palette in `src/styles.css` (`--coach-accent-*` set of 6), never hardcoded hex in the component.

## 7. Out of scope (Phase 1 guardrail)

- Real bookings, payments, calendar integration
- Editing the page from the dashboard (mock data only)
- Social media API embeds
- Full white-label / custom font / custom hex
- Per-service deep-link logic on the enquire page (we'll just append `?service=` as a hint; enquire stays locked)
- SEO `<head>` JSON-LD + indexing (page renders `noindex` until real profile data is wired)
- Multi-language

## 8. QA before handing back

- Render at 1440 desktop, 1024 tablet, 390 mobile — no overflow, sticky mobile bar visible.
- All CTAs deep-link to `/pro/$slug/enquire` (the locked flow).
- `reps-build-compliance` audit must exit clean on the new file (same baseline as today — only the documented 14px exception remains).
- Test all 4 accent-colour swaps cleanly with no contrast regressions.
- Verify no edits to any locked file (`/`, `/in/$location`, `/professions/$profession`, `/pro/$slug`, `/pro/$slug/enquire`).

## 9. Files to touch

- **New:** `src/routes/c.$slug.tsx` (the page)
- **New:** `src/components/coach-site/` — small set: `CoachHero.tsx`, `CoachServicesGrid.tsx`, `CoachVenues.tsx`, `CoachTransformations.tsx`, `CoachTestimonials.tsx`, `CoachSocialRow.tsx`, `CoachStickyMobileBar.tsx`, `CoachChromeBar.tsx`, `CoachFooterMark.tsx`
- **Edit:** `src/styles.css` — add `--coach-accent-{orange|teal|indigo|plum|forest|slate}` token set (no component hex)
- **Edit:** `docs/07_phase1_build_status.md` — add `/c/$slug` row (Partial → Shipped after QA)
- **New memory:** `mem://design/coach-shopfront` — section order, accent palette, sticky bar rule, "links not embeds" social rule, deep-link-to-enquire rule

## 10. Open question I'll handle in the build

Where to surface this from the dashboard. Lightweight answer: add a single "Your REPs page" card on `/dashboard` with a copy-link button and a "Preview" button. I'll mock it as part of the build but won't modify the locked dashboard sections.
