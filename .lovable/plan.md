## Goal

Kill the hairline `border-b border-reps-border` divider that currently slices every marketing/feature page (and the navbar) into stacked panels. Replace with a softer separation: keep the alternating `bg-reps-panel/15`-style background tint that's already there for rhythm, and use a subtle drop-shadow on the sticky navbar/mobile menu chrome instead of a 1px line.

## Scope

In-scope (all dividers between full-bleed page sections):

- `src/routes/index.tsx` (home — locked, only the dividers are touched)
- `src/routes/features.coaching.tsx`
- `src/routes/features.visibility.tsx`
- `src/routes/features.shop-front.tsx`
- `src/routes/features.operations.tsx`
- `src/routes/for-professionals.tsx`
- `src/routes/specialisms.tsx`
- `src/routes/pricing.tsx`
- `src/routes/cpd.tsx`
- `src/routes/about.tsx`
- `src/routes/contact.tsx`
- `src/routes/careers.tsx`
- `src/routes/complaints.tsx`
- `src/routes/comparison-methodology.tsx`
- `src/routes/c.$slug.tsx` (sticky header + sticky sub-nav hairlines only)
- `src/components/marketing/HeadToHead.tsx`
- `src/components/marketing/VerifySteps.tsx`
- `src/components/marketing/MarketingFaq.tsx` (outer section only; keep the per-question `border-b` inside the accordion — that's a list separator, not a section divider)

Chrome:

- `src/components/public/PublicHeader.tsx` — sticky navbar bottom border + mobile sheet header / user block / login block dividers

Out of scope (intentionally left alone — these are *content* borders, not section dividers):

- Card outlines (`border border-reps-border` around cards/panels)
- Table row separators inside dashboards, admin, and pricing comparison
- Tab-strip underlines, input borders, message-thread headers
- Mobile menu nav list (will keep the existing gap spacing; no line)
- Anything inside `/dashboard`, `/admin*`, `/portal`, `/c/$slug` body (not chrome)

## Visual treatment

1. **Section dividers** — delete `border-b border-reps-border` from full-bleed `<section>` wrappers. Keep every existing `bg-reps-panel/15` / `bg-reps-panel/20` / `bg-reps-panel/30` background alternation so the page still has rhythm via tone, not a line.
2. **Navbar (scrolled state)** — replace `border-b border-reps-border` with a soft elevation shadow: `shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]`. At-rest navbar keeps no border (unchanged).
3. **Coach shop-front sticky chrome (`c.$slug.tsx`)** — same treatment: drop the hairline, add the same soft shadow on the scroll-stuck header and sub-nav.
4. **Mobile menu (`PublicHeader.tsx` sheet)** — remove the 3 divider lines on the header row, user block, and login block. Rely on the existing padding + a one-time `shadow-[0_6px_16px_-12px_rgba(0,0,0,0.6)]` under the sticky top row to anchor it visually.

## Memory update

Rewrite the Core rule currently locked as:

> Marketing divider convention (LOCKED): hero has NO divider; every subsequent section uses `border-b border-reps-border`.

To:

> Marketing divider convention (LOCKED): no hairline dividers between marketing/feature page sections. Section rhythm comes from alternating `bg-reps-panel/15`–`/30` tints only. Sticky chrome (navbar, coach sub-nav) uses a soft drop-shadow (`shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]`) on scroll, never a border.

## Technical details

- Edits are pure className changes — no component restructuring, no new files.
- Where a section currently uses `relative overflow-hidden border-b border-reps-border` (hero variants), only the `border-b border-reps-border` tokens are removed; `relative overflow-hidden` stays.
- `cpd.tsx` uses `border-y` / `border-t border-reps-border` between sections — those count as section dividers and are removed.
- `PublicHeader.tsx` line 201/202 conditional: `border-b border-reps-border` → swapped for the shadow class; the `border-b border-transparent` fallback (line 202) is deleted as it's no longer needed for layout stability.

## Out of scope (per your message)

- No changes to `/features/coaching` content/structure — only the divider removal applies there along with every other page.
- No new mock-ups, no copy edits, no layout reflows.

## Verification

After edits:
1. `rg "border-b border-reps-border" src/routes src/components/marketing src/components/public` should return zero hits except inside `MarketingFaq` per-question rows.
2. Spot-check 3 pages in preview at desktop + mobile: `/features/coaching`, `/pricing`, `/for-professionals`. Confirm sections still feel separated via tint alternation, no visible hairlines, navbar shows a soft elevation when scrolled, mobile sheet has no line under the header row.
