# Phase 1 final sweep — remaining static pages

Build all outstanding Phase 1 visual routes in one pass, reusing existing shells (`ProShell`, `AdminShell`, `PublicHeader`/`PublicFooter`) and REPs design tokens. Static high-fidelity only — no auth, DB, or business logic.

## Pages to build (13 total)

### Group D — Remaining professional dashboard (1)
1. `/dashboard/clients` — clients index list (table view with search, status chips, LTV, last check-in, adherence). Complements existing `clients/$slug` deep page.

### Group E — Remaining admin sub-pages (4)
2. `/admin/directory` — public directory health: listings count, completeness scores, broken-link queue, featured-pro rotation.
3. `/admin/cpd` — CPD oversight: cycle compliance %, pros at risk, evidence audit queue, course catalogue moderation.
4. `/admin/support` — support ticket queue: open/pending/resolved tabs, priority chips, assignee, response SLA timers.
5. `/admin/settings` — platform settings tabs: General, Branding, Email, Integrations, Feature flags, Audit log.

### Group F — Auth helper pages (3)
6. `/forgot-password` — single-field email form, matches `/login` visual language (dark left panel + white card).
7. `/reset-password` — new password + confirm, strength meter, same visual frame.
8. `/verify-email` — "Check your inbox" confirmation state with resend CTA.

### Group G — Legal & info (5)
9. `/terms` — long-form legal layout (sticky TOC sidebar, numbered sections, last-updated stamp).
10. `/privacy` — same legal layout, UK GDPR-flavoured placeholder copy.
11. `/cookies` — cookie categories table (Essential / Analytics / Marketing) + preferences placeholder.
12. `/help` — help-centre landing: category grid (Getting started, Billing, Verification, Profile, Bookings), search bar, popular articles.
13. `/faq` — accordion list grouped by audience (Clients / Professionals / Billing).

## Working agreement

- All pages built directly (no per-page prompt) using realistic UK-fitness placeholder data consistent with existing pages (Sarah Johnson, Amelia Carter, £ amounts, REPs verification language).
- Phase 1 lock respected: no Supabase calls, no form submission wiring, no real search — purely visual.
- REPs tokens enforced: brand orange via semantic token only, radii from the 9-step scale (button 10 / input 12 / card 16-18 / panel 22 / hero 24), no `rounded-xl/2xl/3xl`, no button shadows.
- Each route gets unique `head()` metadata (title + description + og tags).
- Legal pages share a small `LegalShell` component (TOC + content column) to avoid duplication.
- Auth helper pages share the existing `/login` split-screen frame.

## Technical notes

- Flat-nested route filenames: `dashboard_.clients.tsx`, `admin_.directory.tsx`, etc., matching the existing convention. `routeTree.gen.ts` is auto-generated.
- New shared components:
  - `src/components/legal/LegalShell.tsx` — sticky TOC + prose column
  - `src/components/auth/AuthShell.tsx` — extracted from `/login` for reuse across forgot/reset/verify
- Post-flight: run the REPs build-compliance audit script; fix any violations before handing back.

## Out of scope (explicit)

- Real auth flows, password reset emails, session handling.
- `/blog` (no content model decided yet — confirm separately if wanted).
- Sweeping pre-existing shadcn `rounded-xl` violations (separate task).
- Screenshot QA pass across all built pages (separate task — can follow this sweep).

## Deliverable

13 new route files + 2 small shared components, all visually consistent with the locked mock-ups, audit-clean, ready for review.
