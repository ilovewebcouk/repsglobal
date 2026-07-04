## What this is

The "Currently coaching **3 of 20** available spaces" line lives in the coach shop-front hero at `src/routes/c.$slug.index.tsx:928`, hardcoded. You want the **3** editable from the Website editor; the **20** stays a fixed cap.

Not a visual redesign — /skill:redesign doesn't fit. Small data + editor field addition instead.

## Plan

**1. DB migration**
- Add `websites.current_clients smallint` (nullable). Null = hide the strip; `0..20` = show it.
- Validation trigger enforces `current_clients between 0 and 20` (avoids a CHECK, matches repo convention).
- No new grants/policies needed — extending an existing table.

**2. DTO + save handler** (`src/lib/website/website.functions.ts`)
- Add `current_clients: number | null` to `WebsiteDTO`.
- Extend the Basics upsert (currently persists `tagline / subtitle / about / hero_image_url`) with `current_clients`. Clamp to `0..20` server-side; treat `null` as "hide".

**3. Editor UI** (`src/routes/_authenticated/_professional/dashboard_.website.tsx`, Basics panel around line 679)
- Add a small field under Hero subtitle: **"Currently coaching"** — number input `0–20` + a "Hide on my page" toggle.
- Helper text: *"Shown in the hero as 'Currently coaching X of 20 available spaces'. The cap of 20 is fixed."*
- Wire into the existing dirty-tracking + save flow (mirrors `subtitle`).

**4. Render** (`src/routes/c.$slug.index.tsx:925–930`)
- Replace hardcoded `3 of 20` with `{website.current_clients} of 20`.
- If `current_clients == null`, hide the whole `<div>` (strip disappears — no zero-state weirdness).

## Out of scope

- Making **20** editable (locked per your ask).
- Live "auto-count" from actual client records — this is a manually curated marketing number.
- Copy variants ("filling fast", "waitlist only", etc.).
- Any other shop-front hero changes — the page stays locked otherwise.

## Verify

1. Editor: set to `3`, save, hit `/c/$slug` — strip shows "Currently coaching 3 of 20 available spaces".
2. Set to `0` — shows "0 of 20".
3. Toggle Hide → strip disappears from the public page.
4. Try to save `25` via API — clamped to `20`.
