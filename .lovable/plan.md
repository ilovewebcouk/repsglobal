# Phase 0 QA closure plan

## Current verdict: FAIL

Phase 0 is not yet complete:

- **Studio checkout is active** through `/pricing`, `/signup`, the checkout validator and the runtime price catalog.
- **Pro’s 30-day trial is visible but not implemented**: Checkout does not currently configure a trial.
- **The Pro dashboard presents hardcoded figures as account data**, and many controls are no-ops.
- **Billing has conflicting catalogs**: `src/lib/billing.ts` contains the locked Phase 2 offers, while `src/lib/billing/prices.ts` currently drives Checkout with additional unsupported offers.

## Locked commercial behavior

- **Verified:** £99/year, charged immediately.
- **Pro Founding:** £59/month with a **30-day free trial**.
- **Pro trial payment method:** **card required at signup**; no charge today, then £59/month automatically after day 30 unless cancelled.
- **Studio:** £149/month positioning remains visible, but the tier is **waitlist-only** and cannot reach Checkout.

## Implementation

### 1. Establish one billing catalog

- Make `src/lib/billing.ts` the authoritative catalog for sellable tiers, prices and availability.
- Retire the conflicting runtime mappings for Verified monthly, Pro annual and Studio checkout.
- Keep Studio as a recognised historical entitlement where required, but never as a purchasable input.
- Constrain Checkout to exactly two offers: Verified annual and Pro monthly.

### 2. Enforce Studio waitlist-only everywhere

- Replace “Start Studio” on `/pricing` with a waitlist CTA/state that cannot invoke Checkout.
- Reject Studio in the checkout server validator before customer or session creation.
- Reject or safely redirect crafted `/signup?tier=studio&...&next=checkout` URLs.
- Keep `/dashboard/start` limited to Verified and Pro, with Studio linking to the same truthful waitlist destination.
- Verify Studio cannot reach Checkout through UI, direct URL manipulation or direct server invocation.

### 3. Implement the 30-day Pro trial correctly

- For Pro monthly Checkout sessions, configure a 30-day subscription trial and require payment-method collection.
- Keep Verified annual as an immediate charge with no trial.
- Preserve Pro’s visible “30-day free trial” messaging because it will now match the billing behavior.
- Clarify customer-facing copy: “Card required. £0 today, then £59/month after 30 days unless cancelled.”
- Ensure subscription metadata still records the REPs user, Pro tier, monthly period and Founding status.
- Treat Stripe’s `trialing` state as an active Pro entitlement during the 30 days.
- Confirm cancellation during trial prevents the first charge and entitlement ends according to the provider’s resulting status/end date.

### 4. Make the dashboard truthful without redesigning locked visuals

- Keep the four real status cards, real member identity, onboarding dialog, profile/verification actions and public-profile link wired to backend data.
- Treat every unwired Pro module as an explicit preview for **both Verified and Pro users** until that module has real data.
- Preserve the locked dashboard composition, but apply a shared preview/coming-soon treatment so hardcoded revenue, clients, adherence, schedules, leads, reviews, AI insights, CPD, events and tasks cannot be mistaken for account data.
- Disable all no-op controls with proper disabled semantics and an explanation: Quick Add, search, filters, Ask AI, View insights/calendar/recommendations/leads, Create New, support actions and faux “View all” controls.
- Replace controls only where a real route already exists and is in scope: profile editing, verification submission, plan selection, public profile and valid policy/support pages.
- Mark `/dashboard-demo` clearly as a demo/reference surface and disable its no-op actions too.

### 5. QA matrix

- **Checkout contract tests**
  - Verified annual: accepted, immediate charge, no trial.
  - Pro monthly: accepted, card collected, £0 at signup, 30-day trial, £59/month scheduled afterward.
  - Studio, Verified monthly, Pro annual and malformed combinations: rejected.
- **Trial lifecycle tests**
  - Checkout completion creates a `trialing` Pro entitlement.
  - Trial user gets Pro access.
  - Cancellation during trial prevents renewal and later removes entitlement correctly.
  - Trial conversion produces an active paid subscription and retains Founding status.
- **Pricing/browser tests**
  - Studio has no purchase action.
  - Pro trial copy includes card and post-trial charge terms.
  - Direct Studio checkout URLs cannot bypass restrictions.
- **Dashboard tests**
  - Real status and onboarding flows work.
  - No mock metric is presented as live user data.
  - Every visible control is either real and tested or visibly disabled.
  - Desktop and mobile behavior are verified for Verified and Pro accounts.
- **Backend evidence**
  - Record test Checkout, webhook and subscription events so the lifecycle is demonstrated rather than inferred.

## Phase 0 exit criteria

Phase 0 passes only when:

1. Studio cannot create Checkout through any path.
2. Pro Checkout demonstrably starts a 30-day, card-required trial with no immediate charge.
3. Only Verified annual and Pro monthly are accepted purchase combinations.
4. Every dashboard action is real or explicitly disabled.
5. No hardcoded dashboard value appears to be the signed-in user’s data.
6. Focused tests and desktop/mobile QA pass without application errors.

Once these checks pass, Phase 1 can proceed to harden the full Checkout → webhook → entitlement → portal → renewal/cancellation lifecycle.