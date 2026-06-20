# Wire services into Verified + Pro surfaces

The `services` table, `upsertMyService` / `deleteMyService` / `getMyShopFront` server fns, and the editor UI already exist — but the editor is hidden from Verified by `useProGuard`, and the three public surfaces read services inconsistently. This plan unblocks Verified, normalises the public reads, and locks in a max of 3 user-defined services per pro (Discovery Consultation stays auto on `/enquire`).

## Outcome by tier

| Surface | Verified | Pro |
|---|---|---|
| `/dashboard/services` (new) — manage up to 3 service cards | ✅ | ✅ |
| `/dashboard/shop-front` (existing, branding + services) | ❌ (blocked) | ✅ |
| `/c/$slug` — full shop-front, 3 tier cards w/ bullets | ❌ (404 / not gated yet) | ✅ |
| `/pro/$slug` — "Services & Pricing" horizontal cards (×3) | ✅ DB-driven | ✅ DB-driven |
| `/pro/$slug/enquire` — 4 tiles (3 services + auto Discovery) | ✅ DB-driven | ✅ DB-driven |

No visual redesigns. Existing components stay — we only swap the data source and add a slim Verified editor.

## Step 1 — Verified-accessible service editor

New route: `src/routes/_authenticated/_professional/dashboard_.services.tsx` already exists for specialisms. Add a second section in that page (or split into a dedicated `dashboard_.service-cards.tsx`, TBD on routing collision) that lets **Verified + Pro** CRUD up to 3 rows in `services`:

- Reuses `upsertMyService` / `deleteMyService` / `getMyShopFront` (no new server fns).
- Hard cap at 3 published services in the UI; "Add service" disables at 3.
- Fields shown: `title`, `description` (short, 1–2 lines), `price_label` (free text, e.g. "From £60 / session"), `mode`, `is_featured` (only enforced on Pro — see Step 3).
- No `useProGuard` on this page.

Pro's existing shop-front editor (`dashboard_.shop-front.tsx`) keeps its full `ServicesEditor` — same `services` rows, same DTO, no migration. The new Verified editor is a slimmer view of the same data, so a pro upgrading from Verified → Pro keeps their 3 cards and just gains bullets / branding.

## Step 2 — `/pro/$slug` "Services & Pricing" reads from `services`

In `src/routes/pro.$slug.index.tsx` (~lines 316–327, 652–692):

- Replace the `hourly_rate_pence`-derived single tile + static fallback with a query of the pro's published services (top 3 by `sort_order`).
- Render the existing horizontal card markup unchanged — just map DB rows into the same `{title, desc, price, unit}` shape. `price` = `price_label` if set, else formatted `price_pence`; `unit` derived from `mode` / duration.
- If the pro has 0 published services, hide the section (don't fall back to fixtures).
- "View all services →" link: keep pointing at `/pro/$slug/services` for Pro; on Verified hide the link (Verified has no overflow page).

Server-side: extend `getPublicProfileBySlug` to include `services` in its return DTO (single query, no extra round-trip from the route).

## Step 3 — `/c/$slug` stays Pro-only

In `src/routes/c.$slug.tsx`:

- Add a tier check in the loader (resolve from `subscriptions` for the looked-up pro). If tier ≠ pro/studio → `throw notFound()` so Verified pros don't accidentally expose a half-built shop-front.
- Existing `mergeLiveIntoCoach` + 3-tier card layout untouched. `is_featured` continues to drive "Most popular".
- The Verified editor in Step 1 will not surface the `is_featured` toggle (no shop-front to feature on).

## Step 4 — `/pro/$slug/enquire` reads same 3 services + auto Discovery

In `src/routes/pro.$slug.enquire.tsx` (~lines 153–194):

- Collapse the two branches (Pro-from-services / Verified-from-specialisms) into one: always read top 3 published `services` rows for both tiers.
- Always append a synthetic, non-editable 4th tile: **Discovery Consultation — Free — 30-min call to discuss goals**. Not stored in DB; rendered as the last `ToggleGroup` item with a stable id like `discovery`.
- If a pro has 0 services yet (brand new account) → show only the Discovery tile.
- Enquiry submission: the selected `serviceId` is either a real `services.id` or the literal string `discovery` — `enquiries.service_id` stays nullable for the latter.

## Step 5 — UI polish + guardrails (small)

- `dashboard_.shop-front.tsx`: keep `useProGuard` (Pro-only) — branding/hero/bullets stay Pro. But its `ServicesEditor` section should now show a banner: "Manage your 3 service cards from /dashboard/services" with a link, so we don't have two editors for the same rows. (Alt: leave both — Pro power-users get both surfaces. Decide in build.)
- Document Verified Lite = "3 service cards + directory listing + email-only enquiries" in `docs/09_phase2_verified.md`.

## Technical notes

- **No schema changes.** All columns already exist on `services`.
- **No new server fns.** Reuse `getMyShopFront`, `upsertMyService`, `deleteMyService`, extend `getPublicProfileBySlug` and `getShopFrontBySlug` selects.
- **RLS:** existing policies on `services` already scope CRUD to `professional_id = auth.uid()` via the existing fns — no GRANT changes needed.
- **Tier gating happens server-side** in the `/c/$slug` loader (notFound for Verified) — don't rely on client-only checks.
- **Hard cap of 3** enforced in the editor UI; not in DB (allows future expansion without a migration).
- **Locked screens:** `/c/$slug`, `/pro/$slug`, `/pro/$slug/enquire`, and the dashboard shell are visually frozen — only the data source changes. No new components, no new section orders.

## Out of scope

- Stripe wiring for booking these services (still REPs-doesn't-take-bookings rule).
- Service photos (current cards on `/pro/$slug` show stock trainer thumbnails — keep existing image strategy).
- Reordering UI beyond `sort_order` (drag-and-drop later).
- `/pro/$slug/services` overflow page for Pro with >3 services (not needed while cap is 3).
