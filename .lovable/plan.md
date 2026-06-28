## Scope

Two things in this pass:

1. **Open the shop-front (`/c/$slug`) to Verified tier** so Katie Gibbs (Core/Verified) gets a working `/c/katie-gibbs` page.
2. **Confirm the Services & Pricing wiring** on `/pro/$slug` is already live — no changes until you send the card design for `/c/$slug`.

## 1. Unlock `/c/$slug` for Verified

Currently `src/routes/c.$slug.tsx` loader rejects anything that isn't `pro` or `studio`:

```ts
if (live.shopFront.tier !== "pro" && live.shopFront.tier !== "studio") {
  throw notFound();
}
```

Change: allow `verified` too. The page will only render at all if the pro has a `shop_fronts` row with `is_published = true` (that requirement stays), so Verified pros still have to opt in by publishing one.

Also update the marketing memory + copy that says "Shop-front is Pro+Studio only":
- `mem://design/coach-shopfront` — change to "Verified, Pro and Studio".
- `mem://design/locked-shop-front` — same edit; also drop the "Pro+Studio only" sentence.
- `/features/shop-front` page copy + the Verified-vs-Pro matrix on that page — flip Shop-front from a Pro/Studio-only row to "All tiers".
- `/pricing` + `/compare` tier matrices — same flip.

I will NOT touch the visual design of `/c/$slug` in this pass.

## 2. Katie's shop-front data

Katie has no `shop_fronts` row yet. Once the gate is open, she still needs a published shop-front to see anything at `/c/katie-gibbs`. I'll seed one minimal published row for her so the URL works immediately:

```sql
INSERT INTO public.shop_fronts (professional_id, is_published, published_at, layout_variant)
VALUES ('<katie-uuid>', true, now(), 'lite')
ON CONFLICT (professional_id) DO UPDATE SET is_published = true, published_at = COALESCE(shop_fronts.published_at, now());
```

(Looked up via her `cruz.pt+kate@icloud.com` account.)

## 3. Services & Pricing on `/pro/katie-gibbs` — already wired

Confirmed in `src/lib/profile/public-profile.functions.ts` (lines 159–167) and `src/routes/pro.$slug.index.tsx` (lines 326–361): the profile page reads live `services` rows for the pro, ordered by `sort_order`, limited to 3. The "1-to-1 session / From £75" card you see today is the fallback that renders when she has **zero published services** but a `hourly_rate_pence` is set. The moment she saves her first service card in `/dashboard/services`, it replaces the fallback on `/pro/katie-gibbs`.

No code change here.

## 4. Waiting on you

You said you'd send the card design for what services should look like on `/c/katie-gibbs`. I'll do that as a follow-up — the current `TierCard` layout stays untouched until then.

## Technical details

- File: `src/routes/c.$slug.tsx` — change the loader tier check to `!["verified", "pro", "studio"].includes(live.shopFront.tier ?? "")`.
- Migration: insert/upsert one `shop_fronts` row for Katie's `professional_id` (data op via insert tool, not schema).
- Memory edits: `mem://design/coach-shopfront`, `mem://design/locked-shop-front`, and the Core rule in `mem://index.md` that says "Shop-front is a Pro+Studio feature (NOT Verified)".
- Copy edits: `src/routes/features.shop-front.tsx` tier matrix + intro line; `/pricing` + comparison matrices that list Shop-front as Pro-only.
- No changes to `/pro/$slug` services rendering.
