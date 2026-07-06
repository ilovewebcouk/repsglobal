## Goal

Replace the current dark provider-website template at `/t/$slug` with the locked light directory-profile layout shown in the screenshot (the same visual system as `/c/$slug` for coaches, but tailored to Training Providers). Retire the current template entirely — provider public pages become directory profiles.

## Reference layout (from screenshot)

Top → bottom, all on the light `bg-reps-cream` surface used by the professional profile:

1. Breadcrumbs: Home › Find a Professional › **Training Providers** › [Provider]
2. Hero row: square logo/photo (left) + name, tagline, location + rating pill, delivery chip ("In-person / Online / Blended"), 1-line quote, **Enquire Now** + **Save profile**
3. 4-tile trust strip: REPS Verified · Accreditations Checked · Professional Indemnity · CPD tracking (Coming soon)
4. Sticky in-page nav: About · Courses · Verified Pros · Reviews · Accreditations · Locations
5. Main grid (2/3 + 1/3):
   - Left: About (with quote block + long copy + 3 stat tiles: Years established / Learners trained / Verified since)
   - Middle: **Courses & Pricing** cards (title, one-line, price + format chip: In-person / Online / Blended)
   - Right column: **Verified Professionals Trained** (count + small avatar grid, link to filtered directory) + **Locations & Delivery** (primary centre with map + "View on map", secondary centres listed, "Also delivers online")
6. Row: **Accreditations & Recognition** (awarding bodies + Ofqual status chips) + **Trust & Assurance** (Identity Verified / Accreditations Approved / Professional Indemnity + "View full verification →")
7. Row: **What Learners Say** (5.0 summary + histogram + featured review) + **FAQs** (list, "View all FAQs →")
8. Full-width band: "Ready to train with [Provider]?" + Send Enquiry / Save
9. Global stats strip (25,000+ verified pros / 50,000+ reviews / 120+ countries / 1M+ sessions / 100% verified) — reuse existing component from `/c/$slug`
10. Standard footer

## Files

- **Rewrite** `src/routes/t.$slug.index.tsx` — new light directory-profile component. Model closely on `src/routes/c.$slug.index.tsx` for header, breadcrumbs, sticky nav, trust strip, review block, FAQ block, CTA band, stats strip, and footer — so a Training Provider profile reads as a sibling of a Coach profile, not a foreign template.
- **Keep** `src/routes/t.$slug.tsx` (layout Outlet) unchanged.
- **Keep** `src/routes/t.$slug.enquire.tsx` and `t.$slug.review.tsx` — their entry point (the CTAs) still lands here.
- **No new tables.** Provider data reads from existing `professionals` row where `account_type = 'organisation'`. Provider-specific fields (courses, verified pros linked, accreditations, secondary locations) render from tables that already exist (`courses`, `professional_locations`, `identity_documents` for accreditation files) — when a table is empty for that provider, show a graceful empty state (e.g. "No courses listed yet") rather than hiding the section.

## Section → data source

| Section | Source |
|---|---|
| Hero + trust strip | `professionals` + `verification_submissions` (existing) |
| Courses & Pricing | `courses` (title, price_pence, format, duration_weeks) |
| Verified Professionals Trained | count from `professionals` where linked provider = this org (fallback: 0-state "Verified pros trained will appear here once linked.") |
| Accreditations & Recognition | `course_accreditation_files` + hand-list of awarding bodies on the provider row (empty-state slot per banned-orgs memory) |
| Trust & Assurance | Existing `verification_submissions` panel from `/c/` |
| Locations & Delivery | `professional_locations` (primary + secondaries) + `delivery_mode` chips |
| Reviews | `reviews` via existing `listPublicReviewsBySlug` |
| FAQs | `website_faqs` (already exists) |

## Compliance (auto-enforced against the audit script)

- Light surfaces + `bg-reps-cream` backdrop, brand-orange CTAs only, emerald ONLY for verified/status chips.
- Radii: hero image 18px, cards 16px, panels 22px, pills full, buttons 10px, inputs 12px. No `rounded-xl/2xl/3xl`, no 14/20/28/32px.
- Uses shared marketing/coach primitives where available (`FeaturedProCard` for the "Verified pros trained" avatar tiles, existing stats strip component, existing trust panel, `MarketingFaq` or the `/c/` FAQ block).
- Head metadata per route: title `[Provider] — REPS Verified Training Provider`, description from tagline, canonical + og:url self-refer to `https://repsuk.org/t/{slug}`, `og:type: organization`, JSON-LD `EducationalOrganization`.
- No new copy that violates locked language rules (no "UK", no "shopfront", no CIMSPA, no BD-migration terms).

## Out of scope

- No schema changes.
- No changes to `/t/$slug/enquire`, `/t/$slug/review`, admin surfaces, or the Members admin split shipped last turn.
- No changes to `/c/$slug` (locked coach website).
- Long-form editorial copy is placeholder-safe; a real editorial pass is a separate task per the core memory.

## Post-flight

Run `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` and `tsgo --noEmit` before handing back; both must exit 0.
