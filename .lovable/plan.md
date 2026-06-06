## Unshoehorn: one 50/50 per feature, 6 pillar chapters on `/for-professionals`

**Goal.** Replace the merged Operations + Coaching blocks with one `ProductBlock` per feature. Keep the 6-pillar grid and story by introducing lightweight **pillar chapter dividers** between feature groups. Every feature CTA still points to the relevant `/features/*` pillar page.

### Final Act 2 order

```text
Six-pillar grid (unchanged)

— Chapter divider —  Pillar 1 · Visibility
  1. Verified profile & reviews                  → /features/visibility

— Chapter divider —  Pillar 2 · Shop-front
  2. Personalised shop-front (/c/your-name)      → /features/shop-front

— Chapter divider —  Pillar 3 · Operations
  3. Lead pipeline                                → /features/operations
  4. Bookings & calendar                          → /features/operations
  5. Payments & subscriptions                     → /features/operations
  6. Clients CRM                                  → /features/operations
  7. Client messaging                             → /features/operations

(Feature testimonial — existing, kept as rhythm-breaker)

— Chapter divider —  Pillar 4 · Coaching
  8. Programmes                                   → /features/coaching
  9. Check-ins & progress                         → /features/coaching
 10. Client portal                                → /features/coaching

(Comparison + Replaced Stack + Triad + Use Cases — existing, untouched)

— Chapter divider —  Pillar 5 · REPs AI
 11. REPs AI Operating System block               → /features/ai     (unchanged)

— Chapter divider —  Pillar 6 · Growth
 12. Growth block                                  → /features/growth (unchanged)

A Week with REPs → FAQ → Final CTA  (unchanged)
```

### Component changes

**New tiny component: `PillarChapter`** (in `src/components/marketing/PillarChapter.tsx`)
- Renders a chapter heading row: small orange eyebrow `Pillar N`, big pillar name (e.g. "Operations"), one-line pillar promise, thin `border-t border-reps-border` rule above.
- No mockup, no CTA — purely a visual divider so the page reads as 6 chapters, not 12 random sections.
- Compact: `py-10 lg:py-12`, max-w narrow, left-aligned to match `ProductBlock` rhythm.

**Retire `PillarTabs`** on this page.
- Each of its 3 tabs (Programmes, Check-ins, Client record) becomes its own `ProductBlock` in the Coaching chapter.
- Leave the `PillarTabs.tsx` component file in place (it may be used elsewhere or revived later) — just stop importing it on `/for-professionals`.

**Each new `ProductBlock`:**
- Eyebrow: feature name in caps (e.g. `LEAD PIPELINE`) — NOT "Pillar N · …" anymore (the chapter divider above carries the pillar).
- Title, body, 3–4 bullets, mockup, CTA "Explore {Pillar}" → `/features/{pillar}`.
- Alternate `reverse` on every other block so the mockup flips left/right and the page doesn't feel monotonous.
- Pull copy from existing `FEATURES` array in `src/components/features/feature-config.ts` where possible (oneLiner → body seed, tag → eyebrow); expand bullets per feature.

### Mockup routes (all use existing `DeviceMockup` + dashboard route as iframe src)

| # | Feature | Device | Mockup src |
|---|---|---|---|
| 1 | Verified profile & reviews | laptop | `/find-a-professional` |
| 2 | Shop-front | laptop | `/c/{demo-slug}` (whichever the page currently uses) |
| 3 | Lead pipeline | laptop | `/dashboard/leads` |
| 4 | Bookings & calendar | laptop | `/dashboard/calendar` |
| 5 | Payments & subscriptions | laptop | `/dashboard/payments` |
| 6 | Clients CRM | laptop | `/dashboard/clients` |
| 7 | Messaging | phone | `/dashboard/messages` |
| 8 | Programmes | laptop | `/dashboard/programs` |
| 9 | Check-ins | laptop | `/dashboard/check-ins` |
| 10 | Client portal | phone | `/portal/today` |
| 11 | REPs AI | unchanged | unchanged |
| 12 | Growth | unchanged | unchanged |

Mixing 2 phone mockups (Messaging, Client portal) into a laptop-dominant scroll gives natural visual rhythm alongside the alternating `reverse`.

### Edits to `src/routes/for-professionals.tsx`

1. Remove the merged P3 Operations `ProductBlock` (the one with 5 bullets + calendar mockup).
2. Remove the merged P4 Coaching block (PillarTabs + nested Client portal `ProductBlock`).
3. Drop the `PillarTabs` import.
4. Insert: `PillarChapter` (P1) → 1 ProductBlock → `PillarChapter` (P2) → 1 ProductBlock → `PillarChapter` (P3) → 5 ProductBlocks (reverse alternating) → existing TestimonialFeature → `PillarChapter` (P4) → 3 ProductBlocks → existing Comparison/ReplacedStack/Triad/UseCases → `PillarChapter` (P5) → existing AI block → `PillarChapter` (P6) → existing Growth block → existing Week / FAQ / CTA.
5. Renumber any "Pillar N · …" eyebrows that are now redundant (chapter divider carries the number; ProductBlock eyebrows become the feature name).

### Out of scope

- No changes to the 6-card pillar grid, hero, RegisterProof, ComparisonStrip, ReplacedStackBoard, TestimonialTriad, UseCaseTriad, WeekWithReps, ForProsFaq, final CTA, footer, head/meta.
- No edits to `/features/*` pages (your next pass).
- No new pages or routes.
- No edits to `feature-config.ts` data — only read from it.
- No copy beyond per-feature body + 3–4 bullets each. Aim for plain, punchy lines; no banned phrases (no "15%", "Stripe surcharge", "flat plan", UK qualifiers).
- Compliance pass after edits: brand orange tokens only, radii from the 9-step scale, no `rounded-xl/2xl/3xl`.

### Risks / honest call-outs

- **Page length grows.** With 10 feature blocks + 6 chapter dividers + existing rhythm-breakers, Act 2 gets noticeably longer. Mitigated by the alternating mockup sides, 2 phone mockups, and the existing TestimonialFeature / Comparison / Triad interrupts already spaced through it.
- **Messaging is the weakest standalone block.** If on review it feels thin next to Leads/Bookings/Payments/CRM, the easiest fix later is to fold it back into the CRM block — but we won't pre-empt that; ship all 10 and judge in situ.
- **Chapter dividers must stay subtle.** If they read as section headers they'll fight the ProductBlock titles. Spec is: small orange eyebrow + medium pillar name + thin top rule — quieter than a ProductBlock title.
