| Field | Value |

| --- | --- |

| Owner | REPs Admin / Scott |

| Primary build target | /admin/activity |

| Status | Build contract. Do not treat as a loose prompt. |

| North star | Live -> People -> Pages -> Actions -> Historical -> Diagnostics |

| Primary source of truth | Supabase operational tables |

| Secondary analytics system | PostHog EU for product analytics and rollups only |

| Raw IP rule | Supabase security table only; masked by default; reveal requires audit |



# REPs Activity Command Center

Product, UX, Data, and QA Build Contract

Version 1.0 - Build Contract - 2 July 2026



# 0. Executive decision



This document replaces incremental Lovable prompts. It is the build contract for a world-class REPs Activity Command Center. The current UI is not accepted. The backend is credible enough to build on, but the interface must be rebuilt around an operational model rather than a pile of analytics widgets.



The Activity page is not a metrics wall. It is the owner cockpit for live platform operations: who is on the site, where they are, what they are doing, whether members are active, and what requires action.



| Decision | Rule |

| --- | --- |

| Operational source of truth | Supabase: visitor_journeys, security_visitor_ip_observations, user_sessions, member_session_events, public_visitor_conversions. |

| Analytics source of truth | PostHog: product analytics, funnels, trends, long-term event analysis, daily rollups. |

| UI principle | Live operational panels must not be powered by PostHog. |

| Raw IP | Never sent to PostHog. Never shown by default. Available only through audited reveal. |

| Design principle | Every visible panel must answer one of five operator questions. Otherwise it is demoted, collapsed, or removed. |



# 1. Product north star



The Activity Command Center must let the owner understand the platform in under five seconds. It should feel like seeing the business breathe, not like reading a spreadsheet.



## 1.1 The five operator questions



1. Is the platform alive right now?

1. Who is on the site right now?

1. Where are they?

1. What are they doing?

1. Is there anything I need to act on?



## 1.2 What world-class means for REPs



World-class does not mean copying Google Analytics. Google Analytics is analytics-first. REPs needs operations-first: Google Analytics plus a security console plus membership operations.



The ideal operator journey: a public visitor comes from Google, searches for a professional, views a profile, clicks enquiry, starts an enquiry, signs up, pays, logs in, uses the dashboard, and later has a support/dispute event. The command center must let the owner trace that journey without hunting through five systems.



# 2. Current-state verdict and what must stop



Current visual/product score: 4.5/10. Current backend/data foundation: approximately 7.5/10. The page is not bad because the backend cannot do it; it is bad because the UI lacks a single operating hierarchy.



| Problem | Why it matters | Required response |

| --- | --- | --- |

| Widget pile | Map, realtime, analytics, health, support, recent feed and diagnostics compete equally. | Rebuild around the hierarchy Live -> People -> Pages -> Actions -> Historical -> Diagnostics. |

| Developer language | Words like ingest, linker, rollup nominal and scope mean nothing to the owner. | Move diagnostics to a hidden technical area; use owner-facing copy. |

| Contradictory counts | Realtime card and live rail can show different values for the same concept. | Create shared summary logic and one time-window definition. |

| Geo inconsistency | Same visitor can show city in one place and United Kingdom elsewhere. | Use one location resolver across all surfaces. |

| Map blobs | Oversized markers make the map decorative and misleading. | Use capped marker sizing, clustering, live/recent rules, and clear fallback marker styling. |

| Member panel regression | Old Online Now row had avatar, tier, device, location, page and Open button. Some of that regressed. | Restore member row quality. |

| Zero noise | Lists of /dashboard 0 rows make the system look broken. | Collapse to clean empty states. |

| Backfill button in header | One-off maintenance action is not a daily command control. | Move to diagnostics/maintenance or automate it. |



# 3. Non-negotiable source-of-truth rules



| Capability | Authoritative source | Not allowed |

| --- | --- | --- |

| Live public visitors | Supabase visitor_journeys + security_visitor_ip_observations | PostHog persons/events as live owner truth |

| Public journey | Supabase visitor_journeys | PostHog path list in live command view |

| Raw/masked IP | security_visitor_ip_observations + revealVisitorIp | PostHog, diagnostics, journey table |

| City/town and lat/lng | MaxMind fields stored in Supabase observations | PostHog $geoip fields for live command center |

| Member online | user_sessions + member_session_events | PostHog |

| Pages being viewed | Supabase public journeys + member sessions/events | Hardcoded zero rows |

| Conversions/key actions | public_visitor_conversions | Only PostHog events |

| Historical analytics | PostHog rollup into Supabase where useful | Shown as live operational truth |



# 4. Time-window model: live, recent, stale



Every component must use the same windows. Inconsistent windows are a product defect.



| State | Definition | UI treatment |

| --- | --- | --- |

| Live | last_seen_at <= 5 minutes | Bright marker, included in Live now and Public/Members now. |

| Recent | 5 minutes < last_seen_at <= 30 minutes | Dimmed or listed under Recent; not counted as live. |

| Stale | last_seen_at > 30 minutes | Hidden from live panels by default; may appear in history/drawer. |

| Historical | 24h/7d/30d rollups | Lower-page analytics sections only. |



Rule: if the Realtime card says Public 30m = 0, the Live Activity rail cannot show a public visitor from the last 30 minutes. If the rail shows /pricing 9m ago, Realtime Public 30m must be at least 1, and the row must be labelled Recent rather than Live.



# 5. Final information architecture



The Activity page must be structured as an operator cockpit, not as analytics cards.



| Zone | Purpose | Priority | Default visibility |

| --- | --- | --- | --- |

| Zone 1: Header controls | Search, time range, filters, refresh. No maintenance buttons. | High | Always visible |

| Zone 2: Alert band | Critical operational problems only. 0px when clean. | Highest when active | Conditional |

| Zone 3: Compact status strip | Five-second summary: live, public, members, conversions, action queue, health. | High | Always visible |

| Zone 4: Hero map + realtime card | Where activity is and platform heartbeat. | Highest visual area | Always visible |

| Zone 5: Live operations | Online Now and Pages Being Viewed Now. | High | Always visible |

| Zone 6: Action queue | Disputes, payments, urgent support, verification blockers. | High if non-empty | Visible, compact |

| Zone 7: Historical analytics | 24h/7d/30d rollups. | Medium/low | Below fold / collapsible |

| Zone 8: Diagnostics/maintenance | Backfill, ingest, rollup jobs, proxy health. | Low unless broken | Hidden behind diagnostics/settings |

| Zone 9: Audit trail | Recent activity feed. | Low/medium | Below fold |



# 6. Desktop layout specification



Target desktop viewport: 1440px wide. Sidebar remains approximately 230px. Content max width should support a map-first command view without excessive dead space.



```

DESKTOP 1440+ TARGET

[ Header: Activity title | search | range | filters | refresh ]
[ AlertBand: only visible when critical/warning requires attention ]
[ Status strip: Live now | Public now | Members now | Key actions | Action queue | Health ]

[ Large realtime map - 2/3 width ][ Realtime summary card - 1/3 width ]

[ Online Now - 1/2 width ][ Pages Being Viewed Now - 1/2 width ]

[ Needs Attention - action focused ]

[ Historical public analytics - collapsed/lower ]
[ Member analytics - lower ]
[ Recent activity feed - lower ]
[ Diagnostics/Maintenance - hidden / separate ]

```



## 6.1 Grid rules



| Area | Desktop width | Height guidance | Notes |

| --- | --- | --- | --- |

| Status strip | Full width | 72-96px max | Compact, not the hero. |

| Map | 8 columns / 66-70% | 560-680px | Hero anchor. Must visually dominate. |

| Realtime card | 4 columns / 30-34% | natural but aligned to hero | Must use space; no dead bottom third. |

| Online Now | 6 columns | natural; scroll after sensible max | Do not bury member rows behind tabs. |

| Pages Now | 6 columns | natural | Hide zero rows. |

| Needs Attention | Full or 8/4 with secondary info | natural | Critical items first. |

| Rollups | Full width, lower | collapsible | Historical, not live. |



# 7. Responsive layouts



| Breakpoint | Layout |

| --- | --- |

| >= 1280px | Full two-column hero: map 8/12, realtime 4/12. Online Now and Pages Now side by side. |

| 1024-1279px | Keep map + realtime side by side if usable. If not, map first, realtime second, both full width. |

| 768-1023px | Single column: status strip wraps, map first, realtime second, Online Now third, Pages Now fourth. |

| < 768px | Mobile admin fallback: single column, compact cards, map height 360-420px, drawers full screen. |



At no point should the map be moved into a small right-side panel. If space is limited, stack the realtime card under the map rather than shrinking the map into decoration.



# 8. Header and controls



| Element | Required behaviour |

| --- | --- |

| Title | Activity |

| Subtitle | Live operational command centre |

| Search | Search professionals, members, sessions, IP hash, city. |

| Time range | 1h, 24h, 7d, 30d. Live panels still use live/recent windows; range affects historical panels. |

| Filters | Public/member, city/country, event kind, source, live/recent. |

| Refresh | Manual refetch for live panels. |

| Backfill geo | Remove from header. Move to diagnostics/maintenance or automate. |



# 9. AlertBand specification



The alert band appears above the status strip only when there is a true operational issue. When clean, it occupies 0px.



| Condition | Copy | Action |

| --- | --- | --- |

| Open dispute | Open dispute: £34.00 requires response | Open dispute |

| Failed payment spike | Failed payments detected in last 24h | Open billing |

| Urgent support | Urgent support item waiting | Open support |

| Tracking degraded | Live activity stale: no events for X minutes | Open diagnostics |



Low-priority support/news emails must not dominate the top of the command center. They belong under Other warnings or the support panel.



# 10. Compact status strip



Maximum six cards. This strip is a status summary, not the page hero.



| Card | Primary value | Sublabel | Source |

| --- | --- | --- | --- |

| Live now | public_live + members_live | X public - Y members | shared live summary |

| Public now | public_live | anonymous - live | getPublicVisitorsLive summary |

| Members now | members_live | logged in - live | user_sessions/member events |

| Key actions | conversions_today | enquiries/signups today | public_visitor_conversions |

| Action queue | critical_count | X critical - Y warnings | getNeedsAttention |

| Health | Healthy/Degraded/Broken | only details on hover/drawer | ingest health + rollup freshness |



Remove top-level Views 5m and standalone Ingest. They are not owner-priority status cards.



# 11. Shared live summary data contract



The Realtime card, Command strip, Live rail headers and Map counts must all use the same shared summary contract. Do not let each component calculate live differently.



```

type LiveCommandSummary = {
  generated_at: string;
  windows: { live_minutes: 5; recent_minutes: 30 };
  live_now: number;
  public_live: number;
  members_live: number;
  public_30m: number;
  members_30m: number;
  events_30m: number;
  conversions_today: number;
  action_queue: { critical: number; warning: number };
  health: { state: 'healthy' | 'degraded' | 'broken'; owner_label: string };
  activity_per_minute: Array<{ minute: string; count: number }>;
  devices_online: { mobile: number; desktop: number; tablet: number; unknown: number };
  last_public_seen_at: string | null;
  last_member_seen_at: string | null;
};

```



Acceptance: Realtime hero number must equal summary.live_now. Command strip Live now must equal summary.live_now. Public now must equal summary.public_live. Members now must equal summary.members_live.



# 12. Realtime Summary Card specification



This card must recreate the strong old card pattern. It should feel like a platform heartbeat, not a debug panel.



```

REALTIME
Live operational activity

3
visitors + members online now

Public - 30m    8
Members - 30m   2
Events - 30m    27

Activity per minute - 30m
[vertical bar chart]

Devices online now
[donut]
Mobile 1 | Desktop 2 | Tablet 0

```



| State | Card copy |

| --- | --- |

| Live activity exists | "3 visitors + members online now" |

| Quiet now, recent activity | "Quiet right now" + "Last public visitor 9m ago" + "Last member active 21m ago" |

| No data yet | "No live activity yet" + "Waiting for consented traffic" |

| Degraded | "Live tracking delayed" + last successful event time. |



Forbidden in this card: ingest, linker, rollup nominal, scope. These are diagnostics terms.



# 13. Realtime map specification



The map is the visual anchor. It must communicate where live/recent activity is, not decorate the page.



## 13.1 Marker taxonomy



| Marker type | Meaning | Visual |

| --- | --- | --- |

| Public city marker | Public visitor with city + finite lat/lng | Blue filled dot, small, capped. |

| Member city marker | Logged-in member with city + finite lat/lng | Orange filled dot, small, capped. |

| Mixed cluster | Public + members in same area | Cluster pill with split/tooltip. |

| Country fallback | Only country available | Hollow ring, dim, labelled country-only. |

| Recent marker | 5-30m old | Dimmed; not counted as live. |

| Stale marker | >30m | Hidden by default. |



## 13.2 Marker sizing



```

radius = clamp(6 + sqrt(count) * 2, 6, 18)
Country fallback ring radius = 10-14, hollow
Radius must remain screen-space; zoom must not turn dots into giant blobs.

```



## 13.3 Tooltip copy



```

Croydon, England, GB
1 public visitor
Latest: /pro/jordon-gumbley
Last seen: 12s ago

Katie Gibbs - Core
Croydon, England, GB
/dashboard/profile
Chrome - Desktop - 58s ago

United Kingdom - country only
City unavailable

```



Acceptance: if live_now = 0, there must be no bright live-looking markers. Recent markers may be dimmed and labelled Recent only if the map is in recent mode.



# 14. Canonical location resolver



All surfaces must use the same location formatting. This prevents Croydon in one panel and United Kingdom in another for the same session.



```

function formatLocationLabel(row) {
  if (row.city && row.city !== 'Unknown') return `${row.city}, ${row.region ? row.region + ', ' : ''}${row.country_code}`;
  if (row.region && row.region !== 'Unknown') return `${row.region}, ${row.country_code}`;
  if (row.country_code) return countryName(row.country_code);
  return 'Unknown location';
}

```



| Surface | Must use resolver? |

| --- | --- |

| Public visitor row | Yes |

| Member online row | Yes |

| Visitor drawer | Yes |

| Member session drawer | Yes |

| Cities/Towns Live | Yes |

| Map tooltip | Yes |

| Geo lists | Yes |



# 15. Online Now panel



This is one of the core panels. It must restore the useful member row and add public visitors without burying members behind confusing tabs.



## 15.1 Panel structure



```

ONLINE NOW
Members
[member rows]

Public visitors
[public rows]

Recent (optional, collapsed)
[5-30m rows]

```



## 15.2 Member row



```

[avatar] Katie Gibbs  CORE
/dashboard/profile
Desktop - Chrome - Croydon, GB
Last seen 58s ago                         [Open]

```



| Field | Required |

| --- | --- |

| Avatar | Yes |

| Name | Yes |

| Tier badge | Yes |

| Current page | Yes |

| Device/browser | Yes |

| Location | Yes, via canonical resolver |

| Last seen | Yes |

| Open button | Yes, opens admin member/profile route |

| Row click | Opens member session drawer |



## 15.3 Public visitor row



```

Visitor #8F3A
/pro/jordon-gumbley/enquire
82.12.34.*** - iPhone - Chrome - Croydon, GB
Latest event: enquiry_start - 12s ago      [Open]

```



Raw IP is never shown in the row. Use masked IP only. Open launches the Public Visitor Drawer.



# 16. Pages Being Viewed Now panel



This panel is valuable and must return. It must show live pages with actual viewers only. It must never show permanent zero rows.



```

PAGES BEING VIEWED NOW

/pro/jordon-gumbley                 2
[public] [KG]
1 public - 1 member - last activity 12s ago

/dashboard/profile                  1
[Katie Gibbs]
1 member - last activity 58s ago

/find-a-professional                1
[public]
1 public - last activity 2m ago

```



| Rule | Requirement |

| --- | --- |

| Grouping | Group by current/latest path. |

| Counts | Show total, public count, member count. |

| Avatars/chips | Member avatars where known; anonymous visitor chips where public. |

| Sorting | Live first, highest viewers second, recent activity third. |

| Zero rows | Do not render. |

| Empty state | No pages being viewed right now. |

| Click | Opens filtered list/drawer for viewers of that page. |



# 17. Public Visitor Drawer



The drawer is investigation mode. It is where the owner can inspect one visitor/session, but raw IP remains protected by reveal.



| Section | Fields |

| --- | --- |

| Header | Visitor label, live/recent/stale, linked member badge if known. |

| Session | session_id, posthog_distinct_id, first_seen_at, last_seen_at, duration. |

| Location | city, region, country, lat/lng, timezone, source, confidence. |

| Device | browser, OS, device type, user agent. |

| Journey | ordered path history and event history. |

| Conversions | enquiry_started, enquiry_created, signup_started, checkout_started, signup_complete. |

| IP | masked IP, ip_hash, Reveal full IP action. |



## 17.1 Reveal IP flow



1. Default drawer shows masked IP only.

1. Admin clicks Reveal full IP.

1. Prompt requires reason with minimum 8 characters.

1. Server writes audit row before returning raw IP.

1. Raw IP appears in drawer after reveal.

1. Audit row must not contain raw IP; only target id, admin id, reason, ip_hash/session_id metadata.



# 18. Member Session Drawer



Row click on Online Now member opens a member session drawer. Open button still goes to member profile. This restores the earlier useful member experience.



| Section | Fields |

| --- | --- |

| Header | Member avatar, name, tier, live/recent status. |

| Session | session_id, current page, first/last seen, duration. |

| Device | browser, OS, device, user agent. |

| Location | city/region/country via resolver. |

| Activity | member_session_events timeline. |

| Linked public journey | pre-signup journey if user_id is linked. |

| Actions | Open member, open billing if relevant, view audit trail. |



# 19. Action Queue



Needs Attention becomes an action queue, not a dumping ground for support emails.



| Priority | Included items |

| --- | --- |

| Critical | Open disputes, failed payment requiring action, system tracking failure, urgent support. |

| Warning | Verification blockers, stale high-value support, repeated auth failures, unusual activity. |

| Other warnings | Collapsed by default; old non-urgent emails go here. |



If critical > 0, the AlertBand appears. If no critical items, Action Queue remains compact.



# 20. Historical analytics



Historical analytics are useful, but they are not live command. They must sit below live operations and be labelled as historical/rollup.



| Panel | Label | Rules |

| --- | --- | --- |

| Public analytics 24h | 24h analytics summary - refreshed Xm ago | Lower page; not part of live command; collapsible. |

| Member analytics | Member analytics - 24h/7d/30d | Lower page; supporting context. |

| Recent activity | Audit trail | Below live and action areas. |



Remove scary or misleading PostHog configuration copy from live views. If PostHog is relevant, label it as historical rollup status in diagnostics or panel footnote.



# 21. Diagnostics and maintenance



Diagnostics are necessary, but not in the main command center unless broken.



| Item | Placement |

| --- | --- |

| Backfill geo | Diagnostics/Maintenance, not main header. |

| Ingest health | Small Health status in strip; details in diagnostics drawer. |

| PostHog rollup status | Historical analytics footer or diagnostics. |

| Proxy diagnostics | Diagnostics drawer. |

| Linker health | Diagnostics drawer. |

| Raw technical labels | Tooltips/drawer only. |



Owner-facing main UI copy uses Live, Quiet, Stale, Healthy, Needs attention, Historical. It does not use ingest, linker, rollup nominal, scope.



# 22. Exact owner-facing copy deck



| Situation | Copy |

| --- | --- |

| No live users | Quiet right now |

| No public visitors | No public visitors active right now |

| No members online | No members online right now |

| Recent public visitor | Last public visitor 9m ago |

| No active pages | No pages being viewed right now |

| Country fallback | Country-level location only |

| City unavailable | City unavailable |

| Stale live feed | Live data delayed - last update Xm ago |

| Reveal IP | Reveal full IP |

| Reveal reason prompt | Reason required for audit |

| Historical panel | 24h analytics summary - refreshed Xm ago |

| Diagnostics entry | Diagnostics |

| Healthy | Healthy |

| Degraded | Degraded |

| Broken | Action needed |



# 23. Empty, loading and error states



| Component | Empty state | Loading state | Error state |

| --- | --- | --- | --- |

| Map | No live locations right now | Loading live locations... | Live map unavailable - retry |

| Realtime card | Quiet right now | Checking live activity... | Live summary unavailable |

| Online Now | No one online right now | Loading online sessions... | Online sessions unavailable |

| Pages Now | No pages being viewed right now | Loading active pages... | Active pages unavailable |

| Action Queue | No urgent actions | Checking action queue... | Action queue unavailable |

| Historical analytics | No analytics yet | Loading 24h summary... | Historical summary unavailable |



Do not render lists of zero rows. One clean empty state beats five fake rows.



# 24. Data contracts



## 24.1 getPublicVisitorsLive



```

type PublicVisitorLiveRow = {
  journey_id: string;
  session_id: string | null;
  posthog_distinct_id: string | null;
  user_id: string | null;
  member_name: string | null;
  visitor_label: string;
  masked_ip: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location_label: string;
  location_confidence: 'city' | 'region' | 'country' | 'unknown';
  latest_path: string | null;
  entry_path: string | null;
  latest_event: string | null;
  path_history: string[];
  event_count: number;
  page_count: number;
  device: { type: string; browser: string | null; os: string | null };
  first_seen_at: string;
  last_seen_at: string;
  status: 'live' | 'recent' | 'stale';
};

```



## 24.2 getPagesBeingViewedNow



```

type PageBeingViewedRow = {
  path: string;
  total_viewers: number;
  public_viewers: number;
  member_viewers: number;
  viewer_chips: Array<{ type: 'member' | 'public'; label: string; avatar_url?: string }>;
  last_activity_at: string;
  status: 'live' | 'recent';
};

```



## 24.3 getLiveCommandSummary



Use the LiveCommandSummary contract in section 11. All summary counts must be computed server-side once and shared.



# 25. Implementation phases



| Phase | Goal | Files/areas | Acceptance |

| --- | --- | --- | --- |

| 1. Shared logic | Create live summary + location resolver + pages-being-viewed source. | lib/admin, lib/geo | Counts reconcile; location label identical. |

| 2. Strip + realtime | Simplify command strip and rebuild realtime card using shared summary. | CommandStrip, RealtimeSummaryCard | Hero equals stat sum; no technical copy. |

| 3. Map | Fix markers, live/recent logic, tooltips, clustering. | WorldMapPanel/ClientOnlyMap | No giant blobs; city labels consistent. |

| 4. Live people/pages | Rebuild Online Now and Pages Being Viewed Now. | LiveActivityRail or new panels | Member row restored; zero rows hidden. |

| 5. Drawers | Public visitor and member session drawers. | PublicVisitorDrawer, MemberSessionDrawer | Journey shown; reveal IP audited. |

| 6. Action queue | Make Needs Attention action-focused. | NeedsAttentionPanel/AlertBand | Critical first; old warnings collapsed. |

| 7. Demotion/cleanup | Move historical/diagnostics lower or hidden. | PublicVisitorsPanel, diagnostics controls | No Backfill geo in header; rollups labelled historical. |

| 8. QA | Playwright acceptance suite. | e2e/admin-activity.spec.ts | All acceptance tests pass. |



Do not implement phases out of order. Do not continue polishing a failed layout without passing consistency tests first.



# 26. What to remove, demote, or hide



| Item | Action | Reason |

| --- | --- | --- |

| Backfill geo button in header | Move to Diagnostics/Maintenance | One-off maintenance, not operator control. |

| Standalone Ingest tile | Merge into Health | Developer concept. |

| Views 5m tile | Demote to realtime chart/analytics | Not a top operational metric. |

| Technical source labels in main UI | Hide in tooltips/diagnostics | Owner-facing UI should be clean. |

| Zero member page rows | Hide/collapse | Noise. |

| Country fallback under Towns/Cities heading | Rename or separate | Misleading. |

| PostHog warnings in live UI | Move to historical/diagnostics | PostHog is not live ops source. |



# 27. Security and privacy rules



| Rule | Implementation |

| --- | --- |

| Raw IP location | Only security_visitor_ip_observations.raw_ip. |

| Default UI | Masked IP only. |

| Reveal | Admin only, reason required, audit written before return. |

| Audit | Do not copy raw IP into audit row. |

| PostHog | Never receives raw IP, ip, $ip, raw_ip, forwarding headers. |

| Diagnostics | No raw IP. |

| Journeys | No raw IP and no enquiry message text. |

| Retention | 30d anonymous, 90d authenticated/security unless flagged. |



# 28. Playwright acceptance test suite



| Test | Setup | Expected |

| --- | --- | --- |

| T01 shared counts | Seed or create one live public and one live member. | Command strip and Realtime card agree exactly. |

| T02 city consistency | One session with city Croydon. | Rail, drawer, map tooltip and city list all show Croydon. |

| T03 country fallback | One country-only session. | Shown as country-only, not under Cities. |

| T04 marker sizing | Multiple counts and zoom states. | Markers capped <=18px and never cover UK. |

| T05 quiet state | No live/recent users. | No blobs; Quiet right now; empty states clean. |

| T06 member row | One member online. | Avatar, tier, page, device, location, last seen, Open button visible. |

| T07 pages now | Active pages and zero pages. | Only active pages displayed; zero rows hidden. |

| T08 visitor drawer | Open public visitor. | Journey, masked IP, geo, device, conversions visible. |

| T09 reveal IP | Reveal with reason. | Audit row written; raw IP appears only after reveal. |

| T10 diagnostics hidden | Normal healthy state. | No ingest/linker/rollup jargon in main UI. |

| T11 responsive | 1280, 1024, 768, mobile widths. | Map remains dominant; no broken layout. |

| T12 PostHog hygiene | HogQL leak sweep. | raw IP count = 0. |



# 29. Definition of done



- Owner can answer who is live, where they are, what they are doing, member activity, and urgent actions within five seconds.

- Map, Realtime card, Online Now, Pages Now and Command strip all agree on live/recent counts.

- No developer jargon is visible in the normal healthy state.

- No stale/historical marker appears as live.

- No zero-noise panels are rendered.

- Member online row quality is restored or improved versus the older UI.

- Public visitor drawer and member session drawer work and do not leak raw IP by default.

- Backfill and diagnostics are not normal header controls.

- PostHog is not authoritative for live operational UI.

- All Playwright acceptance tests pass and typecheck is clean.



# 30. Lovable build instruction



Build exactly this document. Do not improvise new panels. Do not add metrics because data exists. Do not continue patching the current layout unless the patch directly implements a section of this contract.



Every implementation response must include: files changed, which contract section was implemented, screenshots at 1440 and 1280, test evidence, typecheck result, and any deviations from this document.



If a proposed UI element does not answer Who is live, Where are they, What are they doing, Are members active, or What needs attention, it belongs below the fold, collapsed, or in diagnostics.



# Appendix A - Quick acceptance checklist



- Command strip has six or fewer cards and no standalone ingest/backfill/views-5m tile.

- AlertBand only appears when action is needed.

- Map is large, left/main, and marker sizes are capped.

- If live count is zero, no live-looking blobs appear.

- Realtime card has big number, activity chart, device donut and owner copy.

- Online Now member rows show avatar, tier, page, device, location, Open button.

- Pages Being Viewed Now hides zero rows.

- Public visitor rows show masked IP, city, path and latest event.

- City labels match across row/drawer/map/list for same session.

- Needs Attention prioritises real actions.

- Historical analytics are labelled and lower priority.

- Diagnostics/maintenance is hidden or separate.

- Reveal IP requires reason and writes audit without raw IP in audit.

- No raw IP in PostHog, diagnostics or journeys.


