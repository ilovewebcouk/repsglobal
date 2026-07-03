
# /pro/$slug below-the-fold — brutal audit + rebuild plan

## What's actually wrong (honest)

The hero is fine. Everything under the sub-nav is a **bento wall** — every block is the same 22px card on the same ivory background, sitting in two different grid rhythms back-to-back. It reads as "stuff in boxes" instead of a profile you scan.

Concretely, the mess comes from six things:

1. **Two clashing grids stacked.** Row A is `1fr / 1.4fr / 1fr` (About | Services | right stack). Row B is `1.6fr / 1fr` (Quals | Trust). The column edges don't line up between rows, so the eye keeps re-anchoring.
2. **A ragged right column.** Specialisms + Location + Trains-at are stacked inside the third column. Their natural heights don't match the About / Services cards next to them, so the row bottom is jagged.
3. **Cards inside cards.** About has three orange stat tiles inside it. Services has three dark panels inside a light card. Every "card" contains more cards — that's what makes it feel bento.
4. **Two chip lists back-to-back.** Specialisms and Trains-at are visually identical (pill chips in a card). They read as the same section twice.
5. **Theme jump on Services.** Dark reps-panel service tiles sit inside a warm-white card on an ivory page. Three colour temperatures in one glance.
6. **Sub-nav lies.** It links to "Availability" but no Availability section exists, and every anchor is the same colour except the active one — looks decorative, not navigational.

Trust & Assurance duplicates the trust strip already shown up in the hero block. Quals + Trust as a 2-col also creates a second lonely sidebar that echoes the first.

## The fix — one reading spine, not a mosaic

Collapse the whole below-fold into a **single 2-column layout** used consistently for the entire page:

```text
┌──────────────────────────────┬────────────────────┐
│  MAIN COLUMN (≈ 1.7fr)       │  STICKY SIDEBAR    │
│                              │  (≈ 1fr)           │
│  About Jordon                │  ┌──────────────┐  │
│    bio + inline stat row     │  │ Enquire /    │  │
│    (stats as a thin strip,   │  │ Book CTA     │  │
│     not tiled cards)         │  │ + price from │  │
│                              │  │ + modes      │  │
│  Services & Pricing          │  └──────────────┘  │
│    3 light service rows,     │                    │
│    same theme as page        │  Location          │
│                              │    small map +     │
│  Specialisms                 │    town / region   │
│    chips only, no card       │                    │
│                              │  Trains at         │
│  Qualifications              │    chips           │
│    clean list, verified tick │                    │
│                              │  Trust & Assurance │
│  What clients say            │    4 compact lines │
│    review cards              │  (this replaces    │
│                              │   the duplicate    │
│  FAQ                         │   hero trust grid  │
│                              │   or vice-versa)   │
└──────────────────────────────┴────────────────────┘
                Ready to work with Jordon (full-width CTA band)
```

Rules the new layout must obey:

- **One grid, one rhythm.** Same 2-col template from About down to FAQ. No second grid appearing halfway down.
- **Cards only where a card earns it.** Wrap Services, Qualifications, Reviews, Trust, Location in cards. About, Specialisms, and FAQ sit directly on the page (heading + content, no border).
- **No cards inside cards.** About stats become a thin inline row (`8+ years · 100+ clients · Verified since 2023`) under the bio, not three orange tiles.
- **Services match the page theme** (light card, dark text). Kill the reps-panel dark tiles here — dark stays for the coach shop-front `/c/$slug`, not the public profile.
- **Merge duplicates.** Trust & Assurance moves into the sidebar as a compact checklist and the hero's 4-tile trust strip stays as the top summary — or vice versa. Not both.
- **Sub-nav tells the truth.** Drop "Availability", add an underline on hover for all items (not just active), and make it sticky on scroll so it earns its space.

## Scope guardrail

- No hero changes.
- No copy rewrites beyond what's needed to remove "Availability" from the sub-nav.
- No data model changes — every field consumed today keeps being consumed.
- Locked pages (`/c/$slug`, `/pro/$slug/enquire`, homepage, professions, cities) are **not** touched.
- Radii stay on the 6/8/10/12/16/18/22/24/full scale. Card = 22, service row = 18, chips = full, map = 12.

## Technical notes

- File: `src/routes/pro.$slug.index.tsx` (single route, ~1372 lines). Sections to restructure are lines ~788–1230 (About/Services/right-stack, then Quals/Trust). Reviews, FAQ, and CTA stay as-is structurally but slot into the new spine's main column.
- `SUB_NAV` array: drop `"Availability"`, keep the six real anchors.
- Sidebar becomes `sticky top-[88px]` on `lg:` and up; stacks under main on mobile.
- Delete the standalone "Trust & Assurance" card OR the hero's 4-tile trust grid — decide one in build. Recommend keeping hero strip (first-impression trust) and moving detailed CPD/insurance rows into the sidebar list.

## Deliverable

One PR editing `src/routes/pro.$slug.index.tsx` only. Screenshot before/after at 1280 and 375. No new components unless a `<ProfileSidebar>` extraction naturally falls out.
