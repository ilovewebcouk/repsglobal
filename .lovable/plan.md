## Goal

Make `/for-professionals` echo the six-pillar story cleanly: grid up top as the TOC, then six 50/50 `ProductBlock` sections in the same order, each one teasing a pillar and linking to its `/features/<pillar>` deep-dive.

Today the page mixes 5 numbered "pillars" with extras (Verified profile sits unnumbered before the grid; Bookings and Client portal are really sub-features of Operations/Coaching but presented as their own pillars; Growth is missing entirely). It also numbers them in the wrong order vs the grid.

## New section order

1. Hero (unchanged)
2. PressMarquee (unchanged)
3. Act 1 — Register + `RegisterProof` (unchanged)
4. **Act 2 intro + six-pillar grid** (moved up to act as TOC; copy nudged so it reads as "here are the six, each one below")
5. **Pillar 1 · Visibility** — 50/50, links to `/features/visibility` (replaces the current "Verified profile" block, re-eyebrowed and renumbered)
6. **Pillar 2 · Shop-front** — 50/50 with live `/c/james-wilson` mockup, links to `/features/shop-front` (existing block, renumbered from "Pillar ·" to "Pillar 2 ·")
7. **Pillar 3 · Operations** — 50/50 covering leads + bookings + payments in one block, links to `/features/operations`. Merges today's "Pillar 1 · Leads CRM" and "Pillar 3 · Bookings & payments" into one teaser (4 bullets: leads pipeline, calendar, payments, revenue). Deep-dive lives on `/features/operations`.
8. **Pillar 4 · Coaching** — keep the `PillarTabs` section but renumber to Pillar 4. Drop the standalone "Pillar 4 · Client portal" block — fold it into the Coaching tabs / `/features/coaching` deep-dive instead (one bullet here).
9. **TestimonialFeature** (unchanged, acts as breather between Coaching and AI)
10. **Pillar 5 · REPs AI** — keep existing hero moment + 6 capability cards, renumber stays at Pillar 5. Links to `/features/ai`.
11. **Pillar 6 · Growth** — NEW 50/50 `ProductBlock`. Bullets: content drafted on-brand, review requests on autopilot, reporting that compounds, Next Move every Monday. Links to `/features/growth`. Uses an existing dashboard mockup route (e.g. `/dashboard/growth` if it exists, otherwise reuse a generic mockup — confirm during build).
12. Comparison strip (unchanged)
13. ReplacedStackBoard + TestimonialTriad (unchanged)
14. UseCaseTriad (unchanged — "who it's for")
15. WeekWithReps (unchanged)
16. FAQ (unchanged)
17. Final CTA (unchanged)

Net effect: 5 numbered "pillars" + 1 unnumbered Verified-profile block → **6 numbered pillars in grid order**, no duplicates, no missing pillar.

## Edits

Single file: `src/routes/for-professionals.tsx`

- Move the "Act 2 · Six pillars" grid section to sit immediately after Act 1.
- Adjust the grid intro copy: "Here are the six. Each one has its own deep-dive below — tap a card to jump straight to the feature page."
- Rename eyebrows:
  - "Verified profile" → "Pillar 1 · Visibility"
  - "Pillar · Shop-front" → "Pillar 2 · Shop-front"
  - Merge "Pillar 1 · Leads CRM" + "Pillar 3 · Bookings & payments" into a single "Pillar 3 · Operations" block (new title e.g. "Leads, bookings and payments — one tool.")
  - "Pillar 2 · Coaching" → "Pillar 4 · Coaching"
  - Delete "Pillar 4 · Client portal" section (fold its best bullet into Coaching)
  - "Pillar 5 · REPs AI Operating System" stays
  - Add new "Pillar 6 · Growth" `ProductBlock` after the AI section
- Every pillar section keeps `ctaHref` pointing at its `/features/<pillar>` deep-dive so the user has a clear path from teaser → deep dive.
- Alternate `reverse` so the 50/50 image side zig-zags down the page (Visibility left, Shop-front right, Operations left, Coaching tabs full-width, AI right, Growth left).

## Out of scope

- No changes to `/features/*` deep-dive pages themselves.
- No copy rewrites beyond eyebrows/titles needed to renumber.
- No design-token, header/footer, or component-API changes.
- No new images generated in this pass — Growth section reuses an existing mockup route; if none fits, we'll flag and pick one during build.
