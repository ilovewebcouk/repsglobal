
# Training-provider variant of `/c/$slug`

Reuse the entire coach-website shell (dark theme, REPs orange, Space Grotesk/DM Sans, sticky sub-nav, radius map, hero overlay, verified card pattern, section rhythm) but swap the sections that don't apply to a training organisation. Individual coach page stays completely untouched.

## The move

At the top of `src/routes/c.$slug.index.tsx`, branch on `account_type`:

```text
loader → getPublicProfileBySlug({ slug })
component:
  if profile.account_type === 'organisation'  → <CoachWebsiteOrg data={...} />
  else                                        → existing CoachWebsite (unchanged)
```

Two components, one route, one loader, one URL space, one SEO surface. The locked individual mock stays byte-for-byte identical.

## Section map — org variant

Same full-width band rhythm as the coach page. Sticky sub-nav labels change.

```text
1. Hero              — Org logo (square, not circular) + name + "Training provider" chip
                       + city + awarding-body chips + staff count + Verified card
                       Primary CTA: "See upcoming courses"  Secondary: "Talk to us"
                       Voice: "We train the next generation of coaches in Manchester."
2. Sub-nav (sticky)  — Courses · Accreditation · Tutors · Outcomes · About · FAQ
3. Courses           — Grid of course cards from `services` where service_kind='course'.
                       Each card: qualification level chip, title, awarding body, next
                       cohort date, seats left, price, "Enquire" CTA → /c/$slug/enquire
                       ?course=<id>. "Most enrolled" glow badge on flagship course
                       (mirrors "Most popular" treatment on coach services).
4. Accreditation     — Awarding-body row (logos or name chips from `awarding_bodies[]`)
                       + Ofqual-regulated line + company reg number + "Verified by REPS"
                       trust panel (same visual as coach's verified card, org-worded).
                       NEVER name CIMSPA — per mem://content/banned-orgs.
5. How we teach      — Org replacement for "The Foundation Method". 3-column: delivery
                       format (in-person / blended / online), assessment approach,
                       tutor-to-learner ratio. Institutional voice.
6. Tutors            — Staff strip. Named principal tutors with headshots + credentials.
                       (Phase 2 wires real data; Phase 1 pulls from `staff_count` +
                       placeholder tutor list until we add a `professional_members`
                       table.)
7. Outcomes          — Replaces "Real numbers from real people". Alumni pass rate,
                       total qualified, cohorts run, employer partners. Neutral stats,
                       no first-person testimonial voice.
8. Alumni voices     — Replaces "In their words". Third-person quote treatment
                       ("Ella J., Level 3 PT, class of 2025") — same card shape as
                       coach testimonials, different attribution style.
9. Verified by REPS  — Existing verified trust band, org-worded.
10. FAQ              — Org-specific questions (funding, entry requirements, tutor
                        contact time, assessment schedule). Reuses `MarketingFaq`.
11. FinalCta         — "Ready to qualify?" → primary "See next cohort", secondary
                        "Talk to admissions".
```

## What we drop from the coach page

- "I take 20 clients. I write 20 programmes." personal-throughput block
- "Coaching reach" (online + in-person split panel)
- "In-person venues" (gyms list) — replaced by campus/venue if org has one
- First-person "About me" — replaced by institutional "About the academy"
- Any language that presumes a single practitioner ("my method", "my journey")

## What we ADD to the schema surface only

No new tables. All copy comes from fields already extended on `professionals`:
- `account_type`, `legal_entity_name`, `company_registration`, `staff_count`,
  `awarding_bodies[]`
- `services.service_kind`, `starts_at`, `seats_total`, `seats_taken`,
  `qualification_level`, `awarding_body`

If a field is missing on the demo orgs, seed it in a follow-up migration. Do **not** add real course dates / seats now — Phase 2.1 will wire booking.

## Enquire flow

Reuse `/c/$slug/enquire` unchanged. Add a single optional query param `?course=<id>`
that pre-selects a course in the form's "What are you enquiring about?" field. If
`account_type === 'organisation'`, the form's copy swaps: "Ask about a course /
book a cohort call / enquire about bespoke training." Same shadcn primitives,
same radius map, same submit path.

## SEO / head

- `<title>`: `{legal_entity_name || display_name} — Level 2–4 training in {city} | REPS`
  (drop the "personal-trainer" fallback which is currently showing on Northline)
- Description: `"Ofqual-regulated fitness qualifications delivered by {name} in {city}. Awarding bodies: {awarding_bodies.join(', ')}. Verified on REPS."`
- `og:image`: same coach-page OG treatment, org logo composited instead of headshot
- JSON-LD: `EducationalOrganization` schema (not `Person`)

## Files touched

```text
src/routes/c.$slug.index.tsx                              — add account_type branch
src/components/pro-v2/CoachWebsiteOrg.tsx                 — new, org variant shell
src/components/pro-v2/org/OrgHero.tsx                     — new
src/components/pro-v2/org/CourseGrid.tsx                  — new
src/components/pro-v2/org/AccreditationBand.tsx           — new
src/components/pro-v2/org/HowWeTeach.tsx                  — new
src/components/pro-v2/org/TutorsStrip.tsx                 — new
src/components/pro-v2/org/OutcomesStats.tsx               — new
src/components/pro-v2/org/AlumniVoices.tsx                — new
src/components/pro-v2/org/OrgFaq.tsx                      — thin wrapper on MarketingFaq
src/lib/profile/public-profile.functions.ts               — select account_type,
                                                             legal_entity_name,
                                                             company_registration,
                                                             staff_count,
                                                             awarding_bodies, and
                                                             services.service_kind etc
src/routes/c.$slug.enquire.tsx                            — read ?course= param,
                                                             swap org-mode copy when
                                                             account_type='organisation'
supabase/migrations/<ts>_seed_org_courses.sql             — flesh out demo orgs with
                                                             realistic course rows
                                                             (dates, seats, awarding
                                                             body, price) so the
                                                             template has real data
                                                             to render against
```

## Locked constraints applied

- Dark shell + REPs orange only (no navy variant, no secondary accent hue)
- Space Grotesk display / DM Sans body — same as coach page
- Radius map: pill / 22 / 18 / 16 / 12 / 10 — never `rounded-xl/2xl/3xl`
- Emerald only for status semantics (verified, seats-remaining chip if we add one)
- Institutional "we" voice throughout — no "I"
- No booking commission language, no "flat plan", no CIMSPA name
- HeroOverlay primitive for hero wash — not hand-rolled

## Out of scope (this pass)

- Real seat management / booking (Phase 2.1)
- Multi-user org logins / tutor-authored pages (`professional_members`)
- OG image composite generator for orgs (use existing coach OG for now, fix in polish pass)
- Editorial serif or academy-navy variants — rejected in taste pin

## Fallback if the variant reads wrong

If, after seeing it built, the org variant feels like it's diverged too far from the register's visual family, the escape hatch is to fold `CoachWebsiteOrg` back into the individual template as an `account_type`-aware branch inside a single file. Keeping it as a sibling component now makes that reversal a 20-line diff, not a rebuild.
