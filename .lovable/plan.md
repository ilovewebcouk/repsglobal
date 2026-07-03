
# /pro/$slug — Complete Mock-up Rebuild (one pass, no rolling patches)

Rebuild `src/routes/pro.$slug.index.tsx` end-to-end in a single implementation pass to match `user-uploads://...pro-mockup...` (3-column hero + premium sidebar + dark navy service cards + coverage radius map + honest data). No partial ships. Screenshots at the end, not between sections.

## Non-negotiables

- One pass, all 16 build-order items completed before returning to user.
- Every existing hex/radius must comply with `skill/reps-build-compliance` (orange tokens only, radii 6/8/10/12/16/18/22/24/full).
- Data honesty: no fabricated response rates, reply %s, client counts, years, phone/call buttons, availability, or footer marketplace stats. Missing fields hide cleanly.
- Cookie banner: dismiss/hide during Playwright QA via `localStorage` seed so screenshots are not blocked. No banner code changes.
- Locked memory rules respected (no "BD migration", no "UK" qualifier, radius scale, brand orange, emerald-status-only, shadcn primitives, marketing primitives where applicable — the profile is not a marketing page so `SectionHeading`/etc. do NOT apply here).

## Build order (executed in one pass)

1. **Hero refactor** — `lg:grid-cols-[280px_minmax(0,1fr)_320px]`, gap-8. Left = portrait (rounded-[18px]) + gallery pill (`ImageIcon` count) shown only if `pro.gallery?.length`. Middle = REPs Verified badge → H1 name → role/location line → rating line (only if `reviewCount >= 3`) → mode chips (In-person / Online — only truthy) → 2-line clamped bio with "Read more" reveal → "From £{minPrice} / session" anchor derived from services. Right = sticky Get-in-Touch card (see §2).
2. **Get in Touch card** — sticky `top-[92px]`, `rounded-[18px]` cream card. Copy: "Get in touch" / "Free, no-obligation enquiry." 3 honest bullets (private enquiry / no obligation / details shared only with {firstName}). Primary orange "Send enquiry" → `/pro/$slug/enquire`. Secondary ghost "Save profile". NO Call button, NO response-time stat, NO reply-rate.
3. **Trust strip** — 4 compact cards under hero (Verified on REPs / Qualifications on file / Insurance verified / CPD current) — each hides if underlying flag is false. Radius 16, `bg-reps-warm-white`, `Check` icon in emerald token.
4. **Who I Help** — full-width `bg-reps-warm-ivory` panel, radius 22, 4 icon columns (Dumbbell, UserPlus, Home, Compass) sourced from `pro.who_i_help` array with sensible defaults derived from specialisms when empty.
5. **About** — main-column card, radius 18. Show `pro.bio_long`. Stats row ("clients helped" / "years experience") rendered only when both values are truthy and > 0.
6. **Services & Pricing** — dark navy cards matching `/c/$slug`: `bg-reps-panel`, radius 18, orange service icon top-left, price large + `/session` or `/month` from data, bullet features from `service.features[]`, orange "Enquire about this" button. "Most popular" ribbon on `is_featured` service (orange glow). Empty state: single "Contact for pricing" card if no services.
7. **Location & Coverage** — sidebar card, radius 18. Header "Based in {town}, covering:" + green-tick list from `pro.coverage_towns` (max 6, "+N more" collapse). Map via `LocationMap` with `radiusKm={pro.service_radius_km ?? 15}` (already renders orange dashed circle, no pin). Postcode input + Check button — disabled with `Tooltip` "Coming soon" if no coverage RPC exists.
8. **Quick Details** — sidebar card, radius 18. Label/value rows for: Specialisms, Age groups, Training style, Availability, Equipment. Each row hides if empty. No chip-soup.
9. **Qualifications** — main-column card, radius 18. List with awarding-body pill + year. Hides section entirely if none.
10. **Trust & Assurance** — sidebar compact checklist card, radius 18. 4 lines with "View full verification →" linking to verification detail page. Replaces standalone main-column trust card.
11. **Reviews** — main-column, radius 18. Star distribution histogram shown only if `reviewCount >= 3`. Otherwise show compact "New to REPs — reviews coming soon" empty state. Individual review cards with initials avatar (no fake photos).
12. **FAQ** — accordion (shadcn `Accordion`), first item `defaultValue` open. Hides section if `pro.faq` empty.
13. **Final CTA band** — reuse styling from `/c/$slug` end-of-page CTA, orange primary "Send enquiry", ghost "Back to search". No platform stats.
14. **Footer stats honesty** — audit `PublicFooter.tsx`; remove any marketplace count / country count / verified-pro count if still present. (Prior audit said clean — re-verify in same pass.)
15. **Mobile polish** — hero collapses to single column, portrait full-width capped 320px, Get-in-Touch becomes sticky bottom bar (`fixed bottom-0` with safe-area padding) showing "From £X" + "Send enquiry" button. Sidebar cards flow inline after main sections. Trust strip becomes 2×2 grid.
16. **Screenshot QA** — Playwright script (`tests/e2e/profile-shot.py`) with webdriver masked, cookie banner pre-dismissed via `localStorage.setItem('reps.consent.v1', JSON.stringify({analytics:true,ts:Date.now()}))`. Capture desktop 1280×1800 + mobile 390×1600 full-page → `/tmp/browser/profile/desktop.png` + `mobile.png`. View both, verify against mock-up before returning.

## Files touched

- `src/routes/pro.$slug.index.tsx` — full rebuild of body (hero, sections, sidebar, mobile CTA). Single file, complete rewrite of the visible JSX; keep loader/head/data wiring intact.
- `src/components/pro/LocationMap.tsx` — no change needed (radius already wired).
- `src/components/public/PublicFooter.tsx` — verify honesty; edit only if fabricated stats present.
- `tests/e2e/profile-shot.py` — new Playwright QA script.

No new components extracted unless a natural `<ProfileSidebar>` split emerges during the rewrite. No schema changes. No server function changes.

## Data-honesty guardrails (applied throughout)

| Field | Rule |
|---|---|
| `pro.years`, `pro.clients` | render only if truthy && `> 0` |
| `pro.contact_phone` | NEVER rendered publicly (locked contact-channels policy) |
| `pro.response_time`, reply rate | NEVER rendered |
| `pro.availability` free text | render only if non-empty |
| `pro.reviews` | histogram only if count ≥ 3; else empty state |
| `pro.gallery` | gallery pill only if length > 0 |
| `pro.coverage_towns` | list only if length > 0 |
| `pro.faq` | section only if length > 0 |
| Footer marketplace stats | removed |

## Acceptance

- Desktop screenshot `/tmp/browser/profile/desktop.png` shows: 3-col hero, orange price anchor, dark navy service cards with "Most popular" ribbon, orange dashed radius map, sticky sidebar with 4 stacked cards.
- Mobile screenshot `/tmp/browser/profile/mobile.png` shows: stacked sections, sticky bottom Send-enquiry bar, 2×2 trust strip.
- Typecheck clean.
- `bash knowledge://skill/reps-build-compliance/scripts/audit.sh` exits 0.
- Response includes both screenshots and audit result; no partial-progress claims.

## Out of scope

- No changes to `/c/$slug`, `/pro/$slug/enquire`, homepage, professions, cities, dashboard.
- No new data model or server functions.
- No cookie-banner logic changes (only test-side dismiss).
- No new component library primitives beyond what already ships.
