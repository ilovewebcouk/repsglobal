## Revised plan — remove `shop_fronts.is_published` entirely

You're right: the website is always live for every paying member. There should be no per-pro published flag on `shop_fronts` at all.

### Scope clarification

This removes ONLY the top-level "website is published" flag on `shop_fronts`. It does NOT touch the per-item `is_published` flags on `services`, `shop_front_transformations`, or `shop_front_client_results` — those are legitimate "Show / Hide this card" toggles the pro still needs.

Visibility of the whole `/c/$slug` page is decided by exactly two conditions (unchanged):
- `professionals.is_published = true`
- `isProPubliclyVisible(pro.id)` — pro has an active/trialing paid subscription.

### Step 1 — Migration

- `ALTER TABLE public.shop_fronts DROP COLUMN is_published;`
- `ALTER TABLE public.shop_fronts DROP COLUMN published_at;` (dead once the flag is gone — nothing reads it in the UI)
- Backfill: `INSERT INTO shop_fronts (professional_id, layout_variant) SELECT id, 'full' FROM professionals WHERE is_published = true ON CONFLICT (professional_id) DO NOTHING;` — creates the missing 328 rows so every published pro has a shop_fronts row to hang content on.

### Step 2 — Loader (`src/lib/shop-front/shop-front.functions.ts`)

- Remove `.eq('is_published', true)` from the `shop_fronts` fetch.
- Also make the loader tolerant of a missing `shop_fronts` row: if `sf` is null, synthesise defaults from the pro record instead of returning `null`. (Belt-and-braces so a brand-new pro's `/c/$slug` never 404s.)
- Drop `is_published` and `published_at` from `ShopFrontDTO` and `ShopFrontUpsertSchema`.

### Step 3 — Dashboard (`src/routes/_authenticated/_professional/dashboard_.website.tsx`)

- Remove the hardcoded `is_published: true` payload lines and any residual references.
- No UI change — the toggle was already removed in the previous turn.

### Step 4 — Types & sweep

- Let types regenerate after migration.
- `rg` sweep for any remaining `shop_fronts` + `is_published` references and clean up.

### Step 5 — QA

- DB check: `SELECT COUNT(*) FROM shop_fronts;` should equal published-pros count (≈333).
- Curl `/c/andrew-crease` on the published site → 200 + name in HTML.
- Spot-check 3 more slugs across tiers.
- Load `/dashboard/website` as a pro → save without errors.

### Out of scope

- No visual changes to `/c/$slug` (LOCKED).
- Per-item Show/Hide toggles on services / transformations / testimonials stay as-is.

Approve and I'll ship the migration + code changes + QA in one pass.
