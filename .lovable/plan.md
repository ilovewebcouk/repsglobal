## Unify 6-pillar taxonomy on `/for-professionals` (Option A)

**Goal.** Make the grid and the deep-dive sections tell the same story. One taxonomy, six pillars, customer-journey order. Every grid card has a matching deep-dive with the same name and number.

**Locked order (1 → 6):**
1. **Visibility** — verified register (the moat). Stays first.
2. **Shop-front** — `/c/your-name`. The conversion beat.
3. **Operations** — leads CRM + bookings + payments, merged.
4. **Coaching** — programmes, check-ins, client portal, merged.
5. **REPs AI** — the layer across all of it.
6. **Growth** — content, reviews, reporting. New section.

### Changes to `src/routes/for-professionals.tsx`

**1. Grid (lines 241–268).** Reorder array so the cards render Visibility → Shop-front → Operations → Coaching → REPs AI → Growth. Keep the orange accent on Shop-front. Headline "Six pillars. One operating system." stays.

**2. New `PILLAR 1 · VISIBILITY` deep-dive section** (inserted just after the grid, before the existing Shop-front section). `ProductBlock` with:
- Eyebrow: `Pillar 1 · Visibility`
- Title: "Found on the register the public already searches."
- Body: REPs is the verified directory clients land on. Your profile is your front door.
- Bullets: Verified profile with credentials/specialisms; ranked in city + profession search; reviews from real verified clients; profile preview link you can share.
- CTA: `Explore Visibility` → `/features/visibility`
- Mockup: laptop frame showing `/in/london` or `/find-a-professional` (use an existing route slug that renders).

**3. Existing Shop-front section (lines 272–300).** Eyebrow becomes `Pillar 2 · Shop-front`. Everything else unchanged.

**4. Merge Leads CRM (302–321) + Bookings & payments (345–365) into one `PILLAR 3 · OPERATIONS` section.** One `ProductBlock`:
- Eyebrow: `Pillar 3 · Operations`
- Title: "One pipeline. One calendar. One ledger."
- Body: Combine the leads and bookings narratives — every enquiry, booking, invoice and payment in one place.
- Bullets (merged, ~5): Lead pipeline with source, value, priority; AI scores intent and drafts the first reply; calendar with availability and session types; card payments and subscriptions — REPs takes no cut of what your clients pay you; per-client invoice + payment history.
- CTA: `Explore Operations` → `/features/operations`
- Mockup: keep the existing leads or calendar mock — pick one (preference: calendar, since it visually carries both).
- Delete the standalone Bookings & payments section (345–365).

**5. Merge Coaching (323–336, PillarTabs) + Client portal (367–386) into one `PILLAR 4 · COACHING` section.**
- Eyebrow: `Pillar 4 · Coaching`
- Title: "Programmes, check-ins and the full client record — plus the portal clients use."
- Keep `<PillarTabs />` as the primary visual.
- Add a smaller secondary block below the tabs with a phone-mockup of the client portal (current "Client portal" content collapsed into 2–3 lines + 3 bullets + small mockup), CTA `Explore Client Portal` → `/features/coaching`.
- Delete the standalone Client portal section (367–386).

**6. Existing REPs AI section (440–486).** Eyebrow stays `Pillar 5 · REPs AI Operating System`. No other change.

**7. New `PILLAR 6 · GROWTH` section** (inserted between the REPs AI section and the "Week with REPs" section). `ProductBlock` with:
- Eyebrow: `Pillar 6 · Growth`
- Title: "Compound your reputation week after week."
- Body: Reviews, content and reporting that build a flywheel — every happy client makes the next one easier to win.
- Bullets: Automated review collection from real clients; lead-magnet builder and content scheduler; weekly business report — revenue, retention, leads, reviews; benchmarks vs comparable pros.
- CTA: `Explore Growth` → `/features/growth`
- Mockup: laptop frame, can reuse an existing dashboard route (e.g. `/dashboard/reports` if it exists, else `/dashboard/reviews`).

### Final section order in Act 2
P1 Visibility → P2 Shop-front → P3 Operations → Feature Testimonial → P4 Coaching → Comparison → Replaced Stack + Triad → Use Cases → P5 REPs AI → P6 Growth → Week with REPs → FAQ → Final CTA.

### Out of scope
- No changes to Act 1 hero, RegisterProof, ComparisonStrip, ReplacedStackBoard, TestimonialTriad, UseCaseTriad, WeekWithReps, ForProsFaq, final CTA, footer, head/meta.
- No copy rewrites beyond the eyebrow renumber and the merged Operations + Coaching bullets and the two new section bodies.
- No new components — P1 Visibility and P6 Growth reuse the existing `ProductBlock`.
- No edits to the six `/features/*` pages — those are the user's next job, audited against the depth bar separately.
- Compliance pass after the edits: brand orange tokens only, radii from the 9-step scale, no banned hex, no banned mock-up filenames.