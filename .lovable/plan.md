## Goal

Every `/c/$slug` H1 (tagline) and About paragraph reads as intentional, professional copy from day one — even if the member has never opened `/dashboard/website`. Members retain full control and can regenerate or overwrite at any time.

## 1. AI drafter (server function)

New `src/lib/shop-front/ai-draft.functions.ts` exposing two auth-gated server functions:

- `draftTagline({ professionalId })` → returns `{ tagline: string }`
- `draftAbout({ professionalId })` → returns `{ about: string }`

Both use `google/gemini-3-flash-preview` via Lovable AI Gateway. Inputs pulled server-side from `professionals` + `professional_locations` + `services`: first name, profession(s), primary city, top specialisms, years of experience, service modes. Never trust client-supplied context.

Constraints baked into the system prompt:
- Tagline: 4–10 words, sentence case, outcome-led, no emojis, no exclamation marks, no "certified"/"qualified" clichés, no city name (city already shown in metadata row).
- About: 60–110 words, 2 short paragraphs, first person, plain English, no bullet lists, no hashtags, no pricing claims, no unverifiable stats.

Rate-limit per member to 20 drafts/day (soft check via a lightweight `ai_draft_usage` row) to prevent abuse.

## 2. Dashboard — per-field "AI draft" buttons

In `src/routes/_authenticated/_professional/dashboard_.website.tsx`:

- Tagline input: add `placeholder="e.g. Stronger, leaner, sharper — in 12 weeks"`. Add a small `AI draft` button (secondary, `Sparkles` icon) next to the label. On click: call `draftTagline`, show inline spinner, replace field value on success, toast on error. The value is not saved until the member clicks Save (existing behaviour) — gives them a chance to edit or regenerate.
- About textarea: same pattern with its own `AI draft` button calling `draftAbout`.
- Both buttons disabled while a draft is in flight; second click regenerates.

No layout/structure changes beyond adding the two buttons + placeholders.

## 3. Auto-draft on new signups

Extend the existing shop-front row seeding (currently done in the migration that backfilled 333 rows) so that whenever a `shop_fronts` row is inserted with null `tagline` or `about`, we enqueue a draft.

Implementation: a server-side helper `ensureShopFrontDrafted(professionalId)` that:
1. Reads the current `shop_fronts` row.
2. If `tagline IS NULL` → calls the drafter, saves result.
3. If `about IS NULL` → calls the drafter, saves result.
4. No-op if both present.

Called from two places:
- The professional-onboarding server function that first creates the `shop_fronts` row.
- The `/c/$slug` loader as a safety net: if the row is missing either field, kick off `ensureShopFrontDrafted` fire-and-forget and render a deterministic fallback for this render only (`{FirstName} — {Profession} in {City}` for tagline; a one-sentence About). Next render will show the AI copy.

## 4. One-time backfill for 333 existing members

Standalone script `/tmp/backfill_shopfront_copy.ts` run from the sandbox (not a migration — this is data + AI cost). Iterates every `professionals` row where the linked `shop_fronts.tagline IS NULL OR about IS NULL`, calls the drafter with 500ms spacing, writes results. Logs progress + failures to a report file. Estimated cost: ~666 Gemini Flash calls, trivial spend.

Safe to re-run — it skips rows that already have both fields.

## 5. Deterministic safety net at render time

In `src/routes/c.$slug.tsx` and `src/lib/shop-front/shop-front.functions.ts`:

- If `tagline` still empty after loader (shouldn't happen post-backfill, but defensive): render `{FirstName} — {Profession} in {City}` as H1.
- If `about` still empty: render a single sentence: `{FirstName} is a {Profession} based in {City}, working with clients {online/in person/both}.`

This guarantees no blank H1 ever ships, regardless of AI failure or race conditions.

## Out of scope

- No changes to the locked `/c/$slug` visual layout.
- No "regenerate history" — we don't store previous drafts.
- No auto-regenerate when member edits profession/city — they can hit the button themselves.
- No changes to Services, FAQs, transformations, or other shop-front fields (this plan is tagline + about only).

## Files touched

- New: `src/lib/shop-front/ai-draft.functions.ts`
- New: `src/lib/shop-front/ensure-drafted.server.ts`
- Edit: `src/routes/_authenticated/_professional/dashboard_.website.tsx` (buttons + placeholders)
- Edit: `src/routes/c.$slug.tsx` (safety-net fallback + fire-and-forget draft trigger)
- Edit: `src/lib/shop-front/shop-front.functions.ts` (synthesize safety-net values if still null)
- New (sandbox-only): `/tmp/backfill_shopfront_copy.ts`
