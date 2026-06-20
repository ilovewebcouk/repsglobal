
# World-Class Verified Trainer Dashboard — `/dashboard` Index

Goal: replace the current `/dashboard` index (4 static status tiles + onboarding stepper + blurred Pro previews) with a true command-center that aggregates every Verified-tier surface a trainer already has — Profile, Verification, CPD, Enquiries, Reviews, Services, Support — into one hub. Same shell, same tokens, same primitives. Sub-pages stay untouched (only the index is rebuilt).

## Scope
- **In scope:** `src/routes/_authenticated/_professional/dashboard.tsx` only.
- **Out of scope:** Every other dashboard route (already locked or recently QA'd), DashboardShell/Sidebar, nav-data, tokens, primitives, server functions (we reuse what exists).
- **Tier:** Verified £99/yr. Pro/Studio users see the same hub with an extra "Pro tools" strip linking to clients/calendar/messages.

## Layout (12-col grid, DashboardShell content area)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TopBar (DashboardShell): title "Dashboard" · subtitle "Good morning,   │
│  James" · actions: [View public profile ↗] [Request a review]           │
├─────────────────────────────────────────────────────────────────────────┤
│  ROW 1 — Welcome / Listing status banner (full width, PPanel)           │
│  Avatar · Name · tier badge · "Your listing is LIVE" emerald dot OR     │
│  "Draft — complete profile to go live" amber dot · Public URL + copy    │
├─────────────────────────────────────────────────────────────────────────┤
│  ROW 2 — KPI strip (4 × KpiTile, grid-cols-2 md:grid-cols-4)            │
│  Profile views 30d │ New enquiries │ Avg rating │ Reply rate            │
│  (each with trend chip vs prev 30d, sparkline icon)                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ROW 3 — 8 / 4 split                                                    │
│  ┌─────────── col-span-8 ──────────┐ ┌──── col-span-4 ──────┐           │
│  │ "Needs your attention" PPanel   │ │ Profile completeness │           │
│  │ Dynamic action list (max 6):    │ │ PPanel               │           │
│  │ • 2 enquiries awaiting reply →  │ │ Radial ring (pct)    │           │
│  │ • 1 review pending your reply → │ │ 7-item checklist     │           │
│  │ • Insurance expires in 18 days  │ │ from completion()    │           │
│  │ • Add a 2nd service to unlock…  │ │ → "Edit profile"     │           │
│  │ • 1 support reply waiting       │ └──────────────────────┘           │
│  │ Empty state: DashboardEmpty                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ROW 4 — 8 / 4 split                                                    │
│  ┌─────────── col-span-8 ──────────┐ ┌──── col-span-4 ──────┐           │
│  │ Recent activity timeline PPanel │ │ Verification status  │           │
│  │ Merged feed (last 10):          │ │ PPanel               │           │
│  │  • New enquiry from Sarah       │ │ 3 LayerChips         │           │
│  │  • ★★★★★ review from Mike       │ │ (Verified/Insured/   │           │
│  │  • Identity approved            │ │  Qualified) reused   │           │
│  │  • Certificate added            │ │ from /verification   │           │
│  │ Each row: icon + text + time +  │ │ → "Manage"           │           │
│  │ deep link. "View all" footer.   │ └──────────────────────┘           │
├─────────────────────────────────────────────────────────────────────────┤
│  ROW 5 — 6 / 6 split                                                    │
│  ┌──── col-span-6 ────────┐ ┌──── col-span-6 ────────┐                  │
│  │ CPD & education PCard  │ │ Reviews snapshot PCard │                  │
│  │ Ring (CPD %)+ next     │ │ 1–5★ distribution bar  │                  │
│  │ earned title + count   │ │ chart + last review    │                  │
│  │ → "Open CPD"           │ │ quote → "All reviews"  │                  │
│  └────────────────────────┘ └────────────────────────┘                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ROW 6 — Services strip PPanel                                          │
│  Horizontal list of trainer's services (max 4 + "Add service") with     │
│  price/duration. "Manage services" link.                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ROW 7 — Grow on REPs (Pro upsell, DISTINCT styling, dismissible)       │
│  Single PPanel with 3 bullets + "See Pro features" — replaces today's   │
│  heavy blurred preview rows. Verified-only; hidden for Pro/Studio.      │
└─────────────────────────────────────────────────────────────────────────┘
```

Sub-pages (Profile, Verification, CPD, Enquiries, Reviews, Services, Support) remain as-is. The hub is purely an aggregator + entry point.

## Components used (all existing, zero new primitives)

- `DashboardShell` (role=trainer, active=Dashboard, title/subtitle/actions/search)
- `PPanel` for row containers, `PCard` for inner tiles
- `KpiTile` (label/value/delta/trend/icon) for ROW 2
- `SectionHeader` for each PPanel
- `DashboardBadge` (orange/success/warn/danger) for status pills
- `DashboardEmpty` for empty action list
- `DashboardButton` for CTAs
- `Avatar` + `AvatarFallback` (shadcn) — already used in MemberRow
- `Progress` (shadcn) — for completeness linear bar inside the ring tooltip
- `LayerChip` reused from `dashboard_.verification.tsx`
- `VerifiedBadge` for hero banner
- Lucide icons consistent with sidebar (Inbox, Star, ShieldCheck, GraduationCap, MessageCircle, AlertTriangle, ArrowUpRight)

No new shadcn components need installing. Everything composes from primitives already shipped.

## Data wiring (reuse existing server functions)

| Block | Source |
|---|---|
| Welcome banner | `getMyProfile()` already loaded in shell |
| Listing live/draft | `profile.is_published` |
| KPI: Profile views | reuse `analytics_query` source already used in admin; if not exposed, omit tile for v1 |
| KPI: Enquiries | `getEnquiryStats()` (already used by sidebar badge) |
| KPI: Reviews avg | `getMyReviewKpis()` (already used on Reviews page) |
| KPI: Reply rate | derive from `getEnquiryStats()` (already returns reply_rate / avg_reply_time) |
| Needs attention | compose from same calls above + insurance_valid_until + `useMySupportUnread()` + `useReviewsUnread()` |
| Activity timeline | new server fn `getRecentActivity()` (light SQL UNION over recent enquiries/reviews/verification events) OR v1: client-side merge of existing queries (no new fn needed) |
| Profile completeness | lift `completion()` helper from `dashboard_.profile.tsx` into a shared `src/lib/dashboard/profileCompleteness.ts` |
| Verification status | reuse `getMyVerificationLayers()` already on /verification |
| CPD ring | reuse data from `dashboard_.cpd.tsx` loader |
| Reviews snapshot | extend `getMyReviewKpis()` to return rating distribution (already returns counts; just expose 1–5 breakdown) |
| Services strip | reuse `getMyServices()` from /services |

**v1 keeps zero new server functions** by client-side composing existing loaders via TanStack Query — every query is already prefetched somewhere in the app.

## What gets deleted from current `/dashboard`

- Static 4-tile StatusCard row (Membership / Verification / Listing / Setup)
- Onboarding stepper Dialog (replaced by inline "Needs attention" items)
- Blurred Pro preview rows (`KpiRow`, `ScheduleAndAi`, `PerformanceRow`)
- Live-page Alert banner (folded into welcome banner)

## What stays untouched

- `DashboardShell`, sidebar, nav-data, NotificationsBell
- All design tokens, radius scale (16/22 for PCard/PPanel)
- Every other dashboard route
- Tier gating in `_pro/route.tsx`

## Technical details

- File: `src/routes/_authenticated/_professional/dashboard.tsx` (full rewrite of `component`, keep route definition + auth gate).
- Extract `completion()` from `dashboard_.profile.tsx` → `src/lib/dashboard/profileCompleteness.ts` so both pages share it.
- New small components co-located under `src/components/dashboard/hub/`:
  - `WelcomeBanner.tsx`
  - `NeedsAttention.tsx` (composes signals into action list)
  - `CompletenessCard.tsx` (radial ring + checklist)
  - `ActivityTimeline.tsx`
  - `ReviewsSnapshot.tsx` (rating distribution bar)
  - `ServicesStrip.tsx`
  - `CpdMini.tsx`
- All use existing primitives — no new shadcn installs.
- Responsive: KPI strip `grid-cols-2 md:grid-cols-4`; ROW 3/4 stack on `<xl` to `col-span-12`; services strip becomes horizontal scroll on mobile.
- A11y: every action item has a real `<Link>`; rings have `aria-label`; status dots paired with text.

## QA pass

1. Empty new account (no enquiries, no reviews, draft profile) → every empty state copy reads well.
2. Healthy Verified account (cruz.pt) → all live signals populate.
3. Pro account → extra "Pro tools" strip appears; "Grow on REPs" upsell hides.
4. Mobile 375px → vertical stack, no horizontal overflow.
5. Tablet 768px → KPI 4-up, rows still 8/4.
6. Insurance expiring < 30 days → warn pill surfaces in Needs Attention.

## Out of scope (deferred)

- Pro/Studio versions of the hub (Pro gets the same hub + light additions for now)
- Global command palette
- Breadcrumbs
- Studio-specific seats/team UI
- New server functions for analytics — use what's already wired

Used the **shadcn skill** to keep the design composed from existing PPanel/PCard/KpiTile primitives and dark-tuned DashboardBadge/Empty variants — no new components needed.
