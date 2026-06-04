
# Public Header IA — Review Only

Goal: lock the four-journey model **before** rebuilding the Resources dropdown. Resources becomes purely editorial; institutional/support pages move to About REPs.

No routes created, no header redesign, no content changes in this step.

## Current state (for reference)

Header today exposes 3 mega-menus (Find a Professional, For Professionals, Resources) plus a single top-right `About` link. `Our Standards`, `How verification works`, `Help Centre` currently sit inside the Resources dropdown as "REPs explained" quick links. `/faq`, `/cpd`, `/specialisms`, `/careers`, `/press`, `/contact`, `/reviews`, `/complaints` are live but not in the header (footer only).

## Proposed top-level nav (desktop, left → right)

```text
[Logo]   Find a Professional ▾   For Professionals ▾   Resources ▾   About REPs ▾        [Location] [Sign in] [Join]
```

Active-state rules (`useActive`) will need updating so each trigger highlights for its own URL family — `resources` no longer claims `/standards`, `/verify`, `/help`.

---

## 1. Find a Professional ▾  (no change vs today)

Public search & discovery only.

| Section | Label | Route | Exists |
|---|---|---|---|
| Primary CTA | Find a Professional | `/find-a-professional` | ✅ |
| Browse by profession (6) | Personal Trainer | `/professions/personal-trainer` | ✅ (dynamic) |
| | Pilates Instructor | `/professions/pilates-instructor` | ✅ |
| | Yoga Teacher | `/professions/yoga-teacher` | ✅ |
| | Nutritionist | `/professions/nutritionist` | ✅ |
| | Strength Coach | `/professions/strength-coach` | ✅ |
| | Online Coach | `/professions/online-coach` | ✅ |
| Browse by location (6) | London / Manchester / Birmingham / Edinburgh / Glasgow / Bristol | `/in/$location` | ✅ |
| Browse by goal (6) | Fat loss / Strength / Mobility / Pre-post natal / Rehab / Sport | `/find-a-professional?goal=…` | ✅ (filter) |
| Footer of menu | How REPs works | `/how-it-works` | ✅ |

## 2. For Professionals ▾  (no change vs today)

| Section | Label | Route | Exists |
|---|---|---|---|
| Overview | For Professionals | `/for-professionals` | ✅ |
| Features | Visibility / Operations / Coaching / AI / Growth | `/features/visibility` … `/features/growth` | ✅ |
| | All features | `/features` | ✅ |
| Pricing & compare | Pricing | `/pricing` | ✅ |
| | Compare platforms | `/compare` | ✅ |
| | REPs vs Trainerize | `/compare/reps-vs-trainerize` | ✅ |
| | REPs vs MyPTHub | `/compare/reps-vs-mypthub` | ✅ |
| | REPs vs PT Distinction | `/compare/reps-vs-pt-distinction` | ✅ |
| CPD | CPD & Education | `/cpd` | ✅ (currently orphaned from header) |
| Specialisms | Specialisms explained | `/specialisms` | ✅ (currently orphaned) |
| CTA | Join REPs | `/signup` | ✅ |

Recommended additions vs today: surface `/cpd` and `/specialisms` here (both are professional-facing and currently footer-only).

## 3. Resources ▾  (editorial only — slimmed down)

After moves below, Resources contains **only** the article library. No institutional links.

| Section | Label | Route | Exists |
|---|---|---|---|
| Browse by topic (6, from `RESOURCE_TOPICS`) | Find a Professional / Verification & Standards / Coaching & Clients / Fitness Business / CPD & Education / Platform Updates | `/resources?category=…` | ✅ |
| Featured (3) | from `getFeaturedArticles(3)` | `/resources/$slug` | ✅ |
| Latest (3) | from `getLatestArticles(3)` | `/resources/$slug` | ✅ |
| Footer of menu | All articles | `/resources` | ✅ |

**Removed from Resources dropdown (moved to About REPs):**
- Our Standards → `/standards`
- How verification works → `/verify`
- Help Centre → `/help`
- ("REPs explained" quick-link group disappears here)

This matches your direction: Resources = editorial discovery only.

## 4. About REPs ▾  (new dropdown — currently a single link)

Promote the existing top-right `/about` link into a mega-menu grouping every institutional, trust, support and corporate page.

| Section | Label | Route | Exists | Source of move |
|---|---|---|---|---|
| The organisation | About REPs | `/about` | ✅ | (unchanged) |
| | Careers | `/careers` | ✅ | currently footer-only |
| | Press | `/press` | ✅ | currently footer-only |
| | Contact | `/contact` | ✅ | currently footer-only |
| Standards & trust | Our Standards | `/standards` | ✅ | **moved from Resources** |
| | How verification works | `/verify` | ✅ | **moved from Resources** |
| | Reviews | `/reviews` | ✅ | currently footer-only |
| | Complaints | `/complaints` | ✅ | currently footer-only |
| Support | Help Centre | `/help` | ✅ | **moved from Resources** |
| | FAQ | `/faq` | ✅ | currently footer-only |

**Missing routes**: none — every label above maps to a route file that already exists. No new routes required for the IA rebuild.

---

## Mobile drawer (accordion order)

Each top-level item becomes one Accordion section, in the same 4-journey order. Featured/Latest article thumbnails stay desktop-only (consistent with today).

```text
▾ Find a Professional
   Find a Professional · Professions (6) · Locations (6) · How REPs works
▾ For Professionals
   For Professionals · Features (5 + All) · Pricing · Compare (+ 3 vs pages) · CPD · Specialisms · Join REPs
▾ Resources
   All articles · 6 topic links
▾ About REPs
   About · Careers · Press · Contact · Standards · Verification · Reviews · Complaints · Help · FAQ
[Sign in] [Join REPs]
```

Today's mobile drawer has a separate `/about` link plus an ad-hoc "About REPs" list (lines ~1074–1090). That collapses into the single About REPs accordion above.

---

## Summary of moves

**Out of Resources dropdown → into About REPs:**
- `/standards`, `/verify`, `/help`

**Out of footer-only → into header (About REPs):**
- `/careers`, `/press`, `/contact`, `/reviews`, `/complaints`, `/faq`

**Out of footer-only → into header (For Professionals):**
- `/cpd`, `/specialisms`

**Active-state logic** (`useActive` in `PublicHeader.tsx` L75–95) needs splitting so `resources` no longer matches `/standards`, `/verify`, `/help`; a new `about` matcher covers those + `/about`, `/careers`, `/press`, `/contact`, `/reviews`, `/complaints`, `/faq`.

## Files this IA will touch (when approved, not now)

- `src/components/public/nav-config.ts` — drop `RESOURCE_QUICK_LINKS` standards/verify/help; add `ABOUT_GROUPS` (organisation / standards-trust / support) and a `PRO_RESOURCES` group for cpd/specialisms.
- `src/components/public/PublicHeader.tsx` — 4th `NavigationMenu.Trigger` for About REPs, desktop mega-menu + mobile accordion; remove "REPs explained" column from Resources mega-menu; update `useActive`.
- `scripts/check-nav-links.mjs` — orphan allowlist trims (faq/cpd/specialisms/careers/press/contact/reviews/complaints all become linked).
- No changes to `src/lib/resources.ts`, `routeTree.gen.ts`, or any route file in this step.

## Out of scope for this IA pass

- Resources dropdown rebuild (audience split, search-in-menu, dedup Latest vs Featured) — resumes after IA is locked.
- New routes, content rewrites, SEO synthesis, FAQ JSON-LD, cross-link pass.
- Logged-in / portal nav, location pin, command palette.

## Questions before I write code

1. About REPs grouping — happy with 3 columns (Organisation / Standards & trust / Support), or prefer a flat list?
2. Should `/how-it-works` stay in Find a Professional, or also mirror under About REPs?
3. `/reviews` — institutional ("trust") or member-facing ("Find a Pro")? I've put it under About → Standards & trust.
4. Keep the top-right `About` text link as well, or fully replace it with the new About REPs dropdown trigger? (Recommend: fully replace.)
