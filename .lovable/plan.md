# Website (formerly Shop-front) — full wire-up

The public `/c/$slug` page does not change visually. We only swap mock data for editable data and rename the surface.

## Phase 1 — Sidebar rename + lock

Files: `src/components/dashboard/nav-data.ts`, `src/components/dashboard/DashboardSidebar.tsx`, plus any nav consumer.

- Rename `"Shop-front"` → `"Website"` in `VERIFIED_NAV` and `PRO_NAV`. Keep route `/dashboard/shop-front` (internal); add redirect from `/dashboard/website` for forward-compat.
- Add a `CORE_NAV` "Website" entry so Core trainers (e.g. Katie) also see it.
- Lock state: read `useEffectiveIdentity()` + qualifications + insurance to compute `isVerified` (3 pillars, same rule as `/c/$slug` trust strip). If not verified:
  - Render the row with a padlock icon, muted styling, no orange.
  - Click opens a shadcn `AlertDialog`: "Get verified to unlock your Website" with a `Continue verification` CTA to `/dashboard/verification`.
- Page header on the editor: rename "Shop-front" → "Website" everywhere user-facing. Keep DB table name `shop_fronts` (internal).

## Phase 2 — Global copy rename (user-facing only)

- Replace user-facing `Shop-front` / `Shopfront` strings across marketing, pricing, dashboard callouts, emails. ~100 hits across `feature-config.ts`, `ContactForm.tsx`, `FeatureGroupLayout.tsx`, pricing tables, hub widgets.
- Do not touch table names, route paths, DB columns, file names, or code identifiers.

## Phase 3 — Data model additions (one migration)

Extend existing tables; add small new ones. RLS + GRANT on each.

Add to `public.shop_fronts`:
- `subtitle text` (replaces hard-coded "Coaching 3 of 20")
- `method_name text` (e.g. "The Foundation Method")
- `method_intro text`
- `method_pillars jsonb` (array of `{title, body}`, max 6)
- `venues jsonb` (array of `{name, city}`, max 6)
- `coaching_reach jsonb` (`{online_global, online_regions[], in_person_cities[]}`)
- `client_results_intro text`
- `faq_auto_generated boolean default true`

New tables:
- `public.shop_front_transformations` — `id, user_id, image_url, client_first_name, headline, metric, quote, sort_order, is_published`
- `public.shop_front_client_results` — `id, user_id, review_id (nullable), headline, body, sort_order, is_published` (lets pros write the narrative; rating/source still flows from `reviews`)
- `public.shop_front_faqs` — `id, user_id, question, answer, sort_order, source ('ai'|'manual')`

GRANT to `authenticated` (owner RLS) + `anon SELECT` for published rows only. `service_role` all.

## Phase 4 — Public page `/c/$slug` rewire

File: `src/routes/c.$slug.tsx`. Layout, classes, radii, accent — unchanged.

Swap mock arrays for live data inside `mergeLiveIntoCoach`:
- H1 promise → `shop_fronts.tagline` (already wired)
- Subtitle → `shop_fronts.subtitle` (NEW)
- Services / 3 tiers → already from `services` table ✓ (no change)
- Foundation Method → `method_name` + `method_pillars` (NEW); falls back to a deterministic AI-seeded default on first publish
- About paragraphs → `shop_fronts.about` (already wired)
- In-person venues → `shop_fronts.venues` (NEW); falls back to professional's primary city
- Coaching reach → `shop_fronts.coaching_reach` (NEW); falls back to `in_person_available` / `online_available`
- Real numbers (transformations) → `shop_front_transformations` (NEW)
- In their words → `shop_front_client_results` joined to `reviews` (NEW). When empty, fall back to top published reviews (current behaviour) so the page never looks empty.
- Verified by REPS → already wired ✓
- Common questions → `shop_front_faqs` (NEW); if empty and `faq_auto_generated=true`, seed 5 AI FAQs on first publish.

## Phase 5 — Editor sections at `/dashboard/shop-front`

Same shell. Add Pro+Core sections (with shadcn primitives, no layout drift):
1. **Hero** — H1 (tagline), Subtitle, Hero image. Live preview chip.
2. **Coaching plans** — links to existing `/dashboard/services` (single source of truth). Inline summary of 3 published services. The Pro-only `ServicesEditor` already writes to `services`; show a banner reminding pros these also feed `/pro/$slug` directory card "From £X".
3. **Foundation Method** — Method name + intro + pillar editor (add/remove, max 6). "Draft with AI" button calls new server fn.
4. **About** — Long-form textarea. "Polish with AI" button.
5. **Where I train** — Venues repeater + reach toggles (online global / regions, in-person cities).
6. **Client results** — Two sub-blocks:
   - Transformations cards (image + name + metric + quote).
   - Client write-ups linked to a published review (dropdown of own `reviews`).
7. **Common questions** — Auto-generate 5 with AI on first save (from profile + services). Editable list, can regenerate or edit individually.

Use `<FieldGroup>` / `<Field>`, `RadioGroup`, `ToggleGroup`, `Textarea`. No `space-y-*`. Save via existing shop-front mutation + new ones per table.

## Phase 6 — Services / directory alignment

- The sidebar "Services" page already writes the rows used by `/c/$slug` AND `/pro/$slug` "From £75". Add a one-line helper banner on both editors making this single-source-of-truth explicit ("These services power your directory card and your Website coaching plans").
- No schema change.

## Phase 7 — AI drafting

New server fns in `src/lib/shop-front/shop-front-ai.functions.ts` (requireSupabaseAuth, Lovable AI Gateway, `google/gemini-3-flash-preview`):
- `draftFoundationMethod({ context })` → `{ name, intro, pillars[] }`
- `polishAbout({ current })` → `string`
- `generateFaqs({ count: 5 })` → `[{question, answer}]`
- `draftClientResultWriteup({ reviewId })` → `{ headline, body }`

Tone preset reuses the existing "founder-friend" system prompt from support drafts. Domain locked to `repsuk.org`.

## Technical notes

- Visual lock: no `/c/$slug` markup or class changes. All new fields are additive with fallbacks so any page renders unchanged today.
- Padlock UX uses shadcn `AlertDialog`, lock icon, `text-reps-muted`. No new accent color.
- `getTrustState` (already canonical for the trust strip) is the single source for "is verified".
- Memory: `/c/$slug` is LOCKED visually — every change is data-layer only.
- Rename leaves DB/route names alone to avoid a breaking migration.

## Out of scope (next pass)

- Drag-and-drop reorder for transformations / FAQs (we ship `sort_order` now, UI = up/down buttons).
- Image cropping for transformations (use existing uploader).
- Per-section publish toggles beyond the existing global `is_published`.
