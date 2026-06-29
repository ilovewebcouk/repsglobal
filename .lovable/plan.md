## Fix Member 360 billing display — drop the "source/mirror" jargon, surface real Stripe data

You're right on all of it. Three separate problems are stacked here:

1. The UI is leaking implementation jargon ("Source", "Local mirror", "Stripe live") that you should never see as an admin.
2. The same fact is repeated three times in the header (status pill + renewal pill + duplicated in Snapshot).
3. Price is blank because when the Stripe-live mirror call doesn't return, the local fallback doesn't carry price data — even though we know the tier is Core and Core is £99/yr. So the page reads as broken even when the data is fine.

The professionals page works because it reads the local `subscriptions` row plus the tier's catalogue price. Member 360 should do the same — and prefer Stripe when Stripe answers, silently, without telling you about it.

### Changes

**A. Remove the "source" UI noise (`admin_.members.$userId.tsx`)**
- Delete the "Stripe live" / "Local mirror" / "Source mismatch" pill in the sticky header.
- Delete the duplicate "Renews 19 April 2027" pill — that fact already lives in the Snapshot tile.
- Keep the header to: avatar · name · profession · email · `Verified` · `Core` · `Scheduled Core renewal` (or `Active`, `Past due`, `Cancels {date}`).
- Drop the "Source" tile from the Snapshot grid. New tile order: Tier · Price · Scheduled renewal · Joined · Last sign-in · (Trial days left when trialing — matches professionals).
- A real Stripe⇄local mismatch becomes a single amber strip above Billing ("Stripe and our copy disagree on X — open in Stripe"), not a header pill. Only shown when `discrepancies.length > 0`.

**B. Always have a price (`subscription-resolver.server.ts`)**
- When falling back to local, derive `unit_amount_pence` / `currency` / `interval` from the tier's catalogue in `src/lib/billing.ts` (Core £99/yr, Pro £59/mo, Studio £149/mo) using `price_lookup_key` first, then the local `tier`. So Cherie shows £99/yr instead of "—" even if Stripe is slow.
- Add `trial_days_left` to the DTO so Member 360 can render the same "Trial · 295d left" chip the professionals list uses.

**C. Make the Stripe mirror actually answer (`stripe-mirror.server.ts` + resolver)**
- Today `getMirrorForUser` lists subs by customer. If that call errors or times out, the resolver swallows it and silently falls back to local. For members where we already know `stripe_subscription_id` (Cherie does — `sub_1TnLJIAP31Yc4cJjvWYDedWN`), retrieve that subscription directly with `getMirrorSubscription(id)` first; only fall back to `listMirrorSubscriptionsForCustomer` if that fails. Direct retrieve is one API call, not a paginated list, and is far less likely to time out.
- Log the underlying Stripe error to the server function logs (not the UI) when a fallback occurs, so we can see which calls are actually failing instead of guessing.

**D. Internal naming stays, UI naming goes**
- `source`, `discrepancies`, `fallback_reason` stay in the DTO — they still drive the optional mismatch strip and server-side debugging — but no UI surface renders the literal words "Stripe live" / "Local mirror" anymore.

### Expected result for Cherie

Header: `Cherie Hallett` · `Personal trainer` · email · `Verified` · `Core` · `Scheduled Core renewal`
Snapshot: Tier `Core` / Price `£99 per year` / Scheduled renewal `19 Apr 2027` / Trial `295d left` / Joined `16 Jun 2026` / Last sign-in `—`
No "Source" tile. No "Local mirror" pill. No duplicated renewal pill. Matches the professionals row.

### Out of scope

- No backend schema changes, no rewrite of the resolver contract.
- BD/legacy archive tables stay untouched.
- Active-member counts and the Richard Bennett regression fixture stay green.
