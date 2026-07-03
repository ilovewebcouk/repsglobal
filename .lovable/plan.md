## Goal
On `/dashboard/website`, replace the current mix of per-section save buttons with:
1. A **sticky section nav** near the top so users can jump between sections.
2. **One unified save** wired into a sticky footer bar (and the existing top "Save changes" button), so a single click saves everything on the page.

## Section nav (sticky, in-page)
Add a horizontal sub-nav directly below the DashboardShell page header, sticky under the topbar:

```text
[ Basics ] [ Services ] [ Method ] [ Specialisms ] [ Transformations ] [ Results ] [ FAQs ] [ Location ]
```

- Each button smooth-scrolls to a `<section id="…">` anchor.
- Active section is highlighted using `IntersectionObserver`.
- Sticky offset accounts for the existing dashboard topbar height, matching the coach shop-front sub-nav shadow convention (`shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]` on scroll — see `mem://design/coach-shopfront`).
- Radius `rounded-full` pills, semantic tokens only.

## One unified save
Currently the page has separate save calls:
- `upsertMyShopFront` — Website basics (tagline, subtitle, about, hero)
- `saveMyPrimaryPostcode` — primary postcode
- `saveMyWebsiteContent` — cities covered, method intro, results intro, etc.
- `updateMyDashboardProfile` — specialisms
- `upsertTransformation` / `upsertFaq` / `upsertClientResult` — list items (already saved per-row on add/edit; leave those in place because they need per-row lifecycle)

Introduce a single `saveAll` mutation that runs the four *page-level* saves in parallel via `Promise.allSettled`, toasts once, and invalidates the relevant queries. Wire it to:
- The existing top-right "Save changes" button.
- A new **sticky footer save bar** at the bottom of the page (mirrors top button, always visible while scrolling).

Remove the per-section save buttons from:
- Website basics (already the top save's scope)
- Specialisms
- Method / Results intro / About / any section that only writes page-level fields

Keep per-row Save/Delete on list editors (Transformations, FAQs, Client Results, Services) — these are item CRUD, not page-level fields.

## Sticky footer save bar
- Fixed to viewport bottom inside the DashboardShell content area.
- Contains: "View public page" link (if slug) + primary "Save changes" button + subtle "Unsaved changes" indicator driven by a dirty-state flag (comparing local state to loaded query data for the four page-level payloads).
- Matches radius rules (10px button) and status tokens.

## Dirty-state indicator
Track a `dirty` boolean derived from comparing current form state to the loaded server state for: basics, cities/method/results copy, specialisms, primary postcode. Show "Unsaved changes" text in the sticky footer when true; disable Save when false.

## Technical notes
- File: `src/routes/_authenticated/_professional/dashboard_.website.tsx`.
- New small component `WebsiteSectionNav` co-located in the same file (or `src/components/dashboard/WebsiteSectionNav.tsx` if it grows).
- Section wrappers: add `id="basics" | "services" | "method" | "specialisms" | "transformations" | "results" | "faqs" | "location"` to their PPanel roots.
- Sticky offsets: nav `top-[calc(var(--dashboard-topbar-h,64px))]`; footer `bottom-0` with a `bg-reps-bg/95 backdrop-blur border-t border-reps-border`.
- No backend changes. No new deps.

## Out of scope
- Bulk save for per-row lists (Transformations/FAQs/Services).
- Accordion / tab restructure (rejected earlier).
- Any other dashboard page.
