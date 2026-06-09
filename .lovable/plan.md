## Goal

Replace the current thin `/features/operations` (117-line `PillarPage` template) with a full standalone pillar page that matches the quality of the locked `/features/visibility` and `/features/shop-front` pages, framed around one clear idea:

> **Operations = the back office for the fitness business.** It keeps every lead, enquiry, booking, form, payment, client record, task and follow-up connected to one professional workspace — distinct from Shop-front (client-facing), Coaching (delivery) and Growth (marketing).

H1: **Run your fitness business from one organised workspace.**
Subhead: Manage enquiries, bookings, forms, payments, client records and follow-ups in the same platform that powers your REPs profile and Shop Front.

## Scope

- Full rewrite of `src/routes/features.operations.tsx`. Drop `PillarPage` wrapper, render `PublicHeader` + 12 sections + `PublicFooter` standalone (same pattern as shop-front).
- No new functionality. Reuses existing live routes for `AnnotatedMock` + `DeviceMockup` previews — `/dashboard`, `/dashboard/leads`, `/dashboard/bookings`, `/dashboard/payments`, `/dashboard/clients/$slug`.
- No new screenshots, no new hero photo — reuses an existing trainer/desk asset from `src/assets`.
- Lock the page into project memory once complete.

Out of scope: `/features/coaching` and `/features/growth` rebuilds; any change to the dashboard routes themselves; any backend or data work.

## Page structure (12 sections)

1. **Hero** — `pt-24 pb-20 lg:pt-28 lg:pb-24`. Headline, subhead, primary "Start using REPs Pro" + secondary "See how operations works", 3 universal trust chips (Pro & Studio · Connected to your REPs profile · No extra add-ons).
2. **Problem** — "Most fitness businesses are run across too many disconnected tools." Two-column today's-mess vs REPs-organised list (mirrors shop-front problem card styling: 8 items per side, `rounded-[16px]` cards on the REPs side).
3. **AnnotatedMock — Inside the workspace** — `AnnotatedMock` over a live `/dashboard` route with 6 callouts (Today's sessions, New leads, Pending forms, Unpaid invoices, Upcoming bookings, Tasks needing attention).
4. **One place for every enquiry** — pipeline strip (6 statuses: New enquiry → Consultation booked → Awaiting form → Payment pending → Onboarded → Follow-up needed) as a horizontally-flowing card row. Side copy: "Every enquiry should have a status, a next step and a place to live."
5. **Bookings & schedule** — `DeviceMockup` of live `/dashboard/bookings` in a 50/50 `ProductBlock`. Bullets: consultations, assessments, 1:1, group, online calls, recurring bookings, availability, reminders, confirmations.
6. **Forms, waivers & onboarding** — 50/50 with form-stack illustration card (PAR-Q, health screening, consultation forms, goal-setting, consent forms, waivers, onboarding questionnaires, client agreements). Copy: "Collect the information you need before the first session, then keep it attached to the client record."
7. **Payments & packages** — `DeviceMockup` of `/dashboard/payments` (reverse 50/50). Bullets: paid consultations, coaching packages, memberships, one-off payments, payment status, receipts, failed/pending payments, package visibility. Includes the cautious commission line: "REPs does not take a platform commission on your client payments. Standard payment processing fees may apply."
8. **Client records & notes** — `DeviceMockup` of `/dashboard/clients/$slug` (e.g. `james-carter`). Bullets: contact details, forms, bookings, payment status, goals, notes, programme status, review-request status, communication history. Keep admin-focused — explicitly avoid programme/check-in depth.
9. **Tasks, reminders & next actions** — 8-card grid of action cards (Follow up new enquiry, Chase incomplete form, Confirm consultation, Review unpaid payment, Send onboarding link, Request review, Check inactive client, CPD/profile renewal). Each card uses a small lucide icon in `bg-reps-orange-soft` chip + short body.
10. **Replace the admin stack** — `ReplacedStackBoard`-style 2-column list: REPs replaces (form builder, booking link, payment link, spreadsheet CRM, notes app, manual reminders, scattered documents, client folders) vs what stays (your coaching tools, your tone of voice). Soft framing: "Replace the disconnected admin stack most trainers build by accident."
11. **Verified vs Pro** — shared `TierCard` x2 + a Verified/Pro feature matrix (10 rows: enquiry inbox, pipeline statuses, booking page, calendar sync, deposits, forms & waivers, payments & packages, client records, tasks & reminders, follow-up automations). Pro = ✓ across the board; Verified = profile + reviews only. Reinforces that **Operations is a Pro pillar.**
12. **Use cases** — 5 cards: Personal trainer, Online coach, Small-group coach, Studio/gym team, Specialist coach — each with the exact one-liner from the brief.

Plus:
- **FAQ** — `MarketingFaq` with 6 questions (Where do my leads go? / Can clients book themselves? / Do I have to use REPs for payments? / Can I keep using Google Calendar? / What about my existing client list? / Is Operations included in Verified or only Pro?).
- **FinalCta** — H2 "Run the business behind your coaching with less admin and more control." + "Start using REPs Pro" / "Explore all features".

## Compliance contract (must pass)

- Hero padding `pt-24 pb-20 lg:pt-28 lg:pb-24`, every other section `py-20 lg:py-28`. No `lg:py-24`.
- Hero has no divider; every subsequent section uses `border-b border-reps-border`.
- Section H2s via `SectionHeading` / `SectionHeader`; in-block H3s via `BlockHeading`. No hand-rolled `<h2/h3 className="font-display text-[Npx]...">`.
- Radii: button 10, card 16, AnnotatedMock/feature 18, large panel 22, hero 24. No 14/20/28/32, no `rounded-xl/2xl/3xl`.
- Emerald used only for status semantics (Pro tick row, "included" pills).
- Banned phrases avoided: no "15%", "booking fee", "Stripe surcharge", "one flat plan", "UK", "CIMSPA".
- All copy global ("clients worldwide" / "wherever you train"), £ pricing where pricing appears.
- `audit.sh` must exit `0` (allowing the existing 14px enquire-page exception).

## Components (all existing, no new primitives)

`PublicHeader`, `PublicFooter`, `MarketingHeroEyebrow`, `SectionEyebrow`, `SectionHeading`, `SectionHeader`, `BlockHeading`, `AnnotatedMock`, `DeviceMockup`, `ProductBlock`, `TierCard`, `MarketingFaq`, `FinalCta`, plus `Badge`/`Separator` from shadcn and lucide icons (`Inbox`, `Workflow`, `Calendar`, `CreditCard`, `ClipboardList`, `Bell`, `Users`, `LayoutDashboard`, `ListChecks`, `Receipt`, etc.).

## Files touched

- `src/routes/features.operations.tsx` — full rewrite (target ~750–850 lines, in line with shop-front).
- `mem://design/locked-operations` — new memory file freezing the 12-section structure, positioning sentence, Pro-only tier scope, banned-phrase reminders, dated 2026-06-09.
- `mem://index.md` — add the new locked-operations entry under Memories.

No other files change. `PillarPage` and `PlatformMockups` imports are dropped from this route only; both remain in use elsewhere.

## Verification before handing back

1. `bash /tmp/audit.sh` exits `0`.
2. Visual flip-through at 390 / 820 / 1280 in the preview — hero, AnnotatedMock, each 50/50, pipeline row, tasks grid, Verified-vs-Pro matrix, FAQ, FinalCta.
3. AnnotatedMock + DeviceMockup iframes load `/dashboard`, `/dashboard/bookings`, `/dashboard/payments`, `/dashboard/clients/james-carter` without console errors.
4. OG metadata reads "Operations — Run your fitness business from one organised workspace · REPs".

## Risks / open questions

- Hero image: plan is to reuse an existing trainer/desk shot from `src/assets` (something like `hero-operations-bg.jpg.asset.json` if still appropriate; otherwise the same coach image used on shop-front but with a heavier dark overlay so the two pages don't feel identical). If neither works visually, fall back to a dark gradient hero with no photo — no new image generation in this pass.
- `/dashboard` route must actually render content inside an iframe at small sizes for the AnnotatedMock to read well; if it doesn't, swap that section's mockup for `/dashboard/leads` which is denser.
