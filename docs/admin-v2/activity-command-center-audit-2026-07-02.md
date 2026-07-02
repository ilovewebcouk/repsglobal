# Activity Command Center — Forensic Audit (2026-07-02)

**Verdict:** 4.5 / 10. Data layer is strong; UI is not world-class. Feels like
loosely arranged widgets, not a command center. This document is the
source-of-truth spec for the Activity Command Center rebuild.

---

## 1. Brutal truths accepted

- Data pipeline (Supabase `visitor_journeys`, `security_visitor_ip_observations`,
  `public_visitor_conversions`, `proxy_ingest_diagnostics`) is now reliable and
  admin-gated end-to-end. **Keep as-is.** Server functions, IP reveal audit path,
  ActivityFeedV2, EventDetailSheet, BackfillGeoButton, DashboardShell,
  consent/beacon code and PublicVisitorsPanel structure are all in the "do not
  touch" set.
- Geo labels diverge across 5 read paths (rail, drawer, map tooltip, towns
  list, member row). Same visitor renders as "London" here, "GB" there,
  "United Kingdom · country fallback" in the Towns strip.
- Map markers use `min(5.5, max(3, 3 + log1p(count)*1.4))` — a 500× count
  range compresses into a 1.8× visual range. Big country blobs, invisible
  mobile dots. No last-seen tooltip.
- Member live rows regressed: v1 showed avatar + tier + device + flag + page +
  duration + Open. v2 renders name + path + city only, and no drawer entry.
- Realtime Summary hero disagrees with its own stat boxes (hero = public +
  members; boxes use different windows and formulas).
- Empty panels render 5 dashed zero-rows; the page reads as broken instead of
  quiet.
- Hierarchy is inverted: the eye lands on the low-signal "Live sessions" tile
  or empty rail rows before it lands on the Action Queue or critical alerts.
- Command strip has 7 tiles including duplicative "Views 5m" and standalone
  "Ingest", with no visible business-conversion signal.

## 2. Scope + non-goals

**In scope (this rebuild):** the 11 items in §3. **Out of scope:** server
functions, IP-reveal audit, ActivityFeedV2, EventDetailSheet, BackfillGeoButton,
auth gates, DashboardShell, consent/beacon code. PublicVisitorsPanel may only
receive label fixes.

## 3. 11-step remediation plan (approved)

1. **`src/lib/geo/resolve-location.ts`** — canonical `resolveLocation()` +
   `formatLocationLabel()`. Every surface (rail row, drawer, map tooltip,
   towns list, member/public row) reads through this helper.
2. **Restore member row quality** in `LiveActivityRail` — avatar, tier badge,
   device icon, browser/device, country flag/location, current page, duration
   / last-seen, Open button.
3. **Fix "Towns live" label** — heading reads *Cities / Towns live* only when
   ≥1 city row exists; otherwise *Countries live* (and never mixes the two
   with a "country fallback" caption under a Towns heading).
4. **Collapse zero-noise** — when every rail section is empty, render one
   clean empty state, not five dashed rows.
5. **`RealtimeSummaryCard` consistency** — hero = live public + live members
   using the same source as the CommandStrip and map. Public 30m / Members
   30m / Events 30m use shared summary logic.
6. **Map marker scaling** — `sqrt(count)` scaling with capped radius; no
   giant UK blobs, no microscopic mobile dots; add last-seen tooltip.
7. **Map responsiveness** — ResizeObserver / responsive projection scale so
   the map fills its panel on desktop AND laptop.
8. **CommandStrip restructure** — 6 tiles max, banded into Live (Live now,
   Public now, Members now) and Ops (Conversions / Key actions, Action queue,
   Health). Remove *Views 5m* and standalone *Ingest*. Health tile includes
   ingest / linker / rollup health internally. **Amendment 1:** Key actions
   counts commercial events (`enquiry_started`, `enquiry_created`,
   `signup_started`, `checkout_started`, `signup_complete`) — never generic
   pageviews.
9. **AlertBand** — conditional band above the strip. When `criticalCount > 0`
   the eye lands there. When clean it renders `null` (0 px).
10. **PublicVisitorDrawer upgrade** — JourneyTimeline (ordered path history
    with event + timestamp), parsed browser/OS/device icons, clean session
    facts, conversions, geo label from the canonical resolver, masked-IP +
    reveal flow untouched.
11. **E2E acceptance** — `e2e/admin-activity.spec.ts` with 10 DOM checks:
    same geo label across surfaces, map bubbles capped, empty state collapses
    to one element, realtime hero equals stat sum, member row has all
    required fields, honest city/country fallback labels, command strip
    ≤ 6 cards, alert band only when needed, drawer opens + shows journey,
    raw-IP reveal remains audited.

## 4. Acceptance gate (10-point)

| # | Check | Pass condition |
|---|---|---|
| 1 | Location label parity | Same person renders identical `city, region, country` string across rail, drawer, map tooltip, towns list and member/public row. |
| 2 | Map marker cap | `r ∈ [3, 12] px`; no marker exceeds 12 px regardless of count. |
| 3 | Zero-noise | Empty rail → exactly 1 empty-state element (not 5). |
| 4 | Realtime hero = stat sum | `hero === publicOnline + membersOnline`. |
| 5 | Member row fields | Row contains avatar, tier badge, flag, current page, last-seen, and Open target. |
| 6 | Honest towns/countries label | Heading is *Cities/Towns live* iff ≥1 city row; else *Countries live*. |
| 7 | ≤ 6 command tiles | `document.querySelectorAll('[data-command-tile]').length ≤ 6`. |
| 8 | AlertBand conditional | Present iff `criticalCount > 0`. |
| 9 | Drawer + journey | Opening the drawer renders a JourneyTimeline with ≥ 1 step (when history exists). |
| 10 | IP reveal audited | Reveal button requires ≥ 8-char reason and writes to `admin_audit_log`. |

## 5. Do-not-touch list

server functions · IP reveal audit path · ActivityFeedV2 · EventDetailSheet ·
BackfillGeoButton · auth · DashboardShell · consent/beacon code ·
PublicVisitorsPanel (except misleading labels).
