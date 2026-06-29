## Goal
Make Member 360 match the polish of `/admin/professionals` and kill the cream Billing card.

## 1. Extend the snapshot (`src/lib/admin/member360.functions.ts`)
Add to `Member360Snapshot` and the handler:
- `avatar_url: string | null` — from `professionals.photo_url` (or whichever column the pro list uses; confirm against `admin_.professionals.tsx`).
- `profession: string | null` — from `professionals.profession` / `headline`.

## 2. Sticky header (`src/routes/admin_.members.$userId.tsx`)
- `<Avatar>` renders `<AvatarImage src={avatar_url}>` first, with the orange-tint initials only as fallback.
- Identity line: `Name · profession` (profession in `text-white/55`), email moves to its own row underneath.
- Badge row: keep Verified + Tier + Status, and when `status === "trialing"` append a small `Trial ends 12 Jul` chip (same format `/admin/professionals` plan column uses). When `cancel_at_period_end`, append `Cancels 12 Jul`.

## 3. Billing tab — replace the cream `MemberSnapshotCard`
Drop the `MemberSnapshotCard` import and render an inline dark panel using the same `PANEL / PANEL_HEADER / PANEL_BODY / LABEL` tokens already defined in the file:
- Header: "Current Stripe subscription" + status pill (reuses the status colour map from the sticky header).
- Stat grid (same micro-card style as Overview): Plan/tier, Price + interval, Current period end, Trial end, Cancel-at-period-end.
- Identifiers row: Stripe customer, Stripe subscription, Price id — each as the mono `IdRow` chip with a Stripe deep-link.
- Empty state when `subscription === null`: dark panel with "No active subscription" (no cream slab).

## 4. Cleanup
- Remove the `[&_[class*='rounded-xl']]:rounded-[18px]` wrapper hack — no longer needed once `MemberSnapshotCard` is gone from this route.
- Leave `MemberSnapshotCard.tsx` untouched (still used elsewhere).

## Out of scope
No backend/business-logic changes beyond adding 2 read-only fields to the snapshot. Profile / Reviews / Notes tabs stay as "soon" stubs.
