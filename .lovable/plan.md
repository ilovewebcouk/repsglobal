## Principle

Verification is **universal and identical** for every paying member. Tier (Verified £99/yr vs Pro £59/mo) is irrelevant to the badge — Pro just adds client-management software on top. Every member runs the same three-step flow and gets the same public ticks.

**Scope of this phase: backend + dashboard + the member's own Public Profile only.** Directory cards, search results, `/c/$slug` shopfront, city pages and profession pages are explicitly OUT until backend is proven.

## Target shape

```text
Public Profile  (/dashboard/profile)  ← trust + presentation, one page
  ┌─────────────────────────────────────────────┐
  │  Verification status strip                  │
  │  ●─●─○   2 of 3 complete · Visible in REPs  │
  │  ID ✓   Insurance ✓   Qualifications …      │
  └─────────────────────────────────────────────┘
  ├─ Identity                  (Stripe ID check, status pill)
  ├─ Insurance                 (provider, cover, expiry, cert upload)
  ├─ Qualifications summary    (titles earned + "Manage on Education & CPD →")
  └─ Photo / bio / services / specialisms / location  (existing, untouched)

Education & CPD  (/dashboard/cpd)
  └─ unchanged: cert upload, awarding body, title derivation

/dashboard/verification           ← DELETED (or thin redirect)
Sidebar "Verification" entry      ← REMOVED
"What you unlock" tier ladder     ← REMOVED from dashboard (lives on /pricing)
```

Three ticks, identical for Verified and Pro:
1. **Identity ✓** — Stripe Identity approved.
2. **Insurance ✓** — valid policy + cert, not expired.
3. **Qualifications ✓** — at least one approved cert; earned titles populate the public title slot.

## Out of scope (explicit)

- Directory / search result cards (`FeaturedProCard`, `ProCard`, search grid).
- `/c/$slug` public shopfront.
- City pages (`/in/$location`) and profession pages (`/professions/$profession`).
- Locked Phase 1 routes (`/`, `/pro/$slug`, `/pro/$slug/enquire`, marketing pillars).
- Messaging, reviews, DBS, first-aid, Veriff fallback.
- Renewal cron, admin review queues (deferred to a later plan).

None of the above are touched until the dashboard ↔ Public Profile loop is signed off.

## Changes

### 1. Backend — single source of truth for the 3 ticks
Files: `src/lib/verification/verification.functions.ts` (+ new `getTrustState` server fn)

- Add one authenticated server fn `getTrustState()` that returns:
  ```ts
  {
    identity: { status, verifiedName, verifiedAt },
    insurance: { status, provider, coverGbp, expiryDate, certUrl },
    qualifications: { count, titles: string[], latestApprovedAt },
    ticks: { identity: boolean, insurance: boolean, qualifications: boolean },
    completedCount: 0|1|2|3,
  }
  ```
- Reads from `professionals` (identity_*), `insurance_policies` (active + expiry ≥ today), `verification_submissions` (approved) + `pro_titles`.
- Tier-blind. No `subscription.tier` checks anywhere in this fn.
- Every other surface (status strip, Identity card, Insurance card, Qualifications summary) consumes this one fn — no parallel queries.

### 2. Stripe Identity return URL
File: `src/lib/verification/stripe-identity.functions.ts`

- Change `return_url` from `/dashboard/verification?...` to `/dashboard/profile?stripe_identity=complete#identity`.
- Webhook (`src/routes/api/public/payments/webhook.ts`) already writes `identity_status`/`identity_verified_name`/`identity_verified_at` (PR 1 from prior turn) — leave as-is.

### 3. Public Profile becomes the trust home
File: `src/routes/_authenticated/_professional/dashboard_.profile.tsx`

- Add a **Verification status strip** at the very top, fed by `getTrustState`. Merge with the existing "Visible in REPs directory" bar so there's one bar, not two.
- Add three collapsible sections beneath it, in order: **Identity**, **Insurance**, **Qualifications (summary)**. Lift `IdentityCard` and `InsuranceCard` as-is from `dashboard_.verification.tsx`.
- Qualifications section here is **read-only**: lists earned titles + count + "Manage on Education & CPD →". Upload/edit only on `/dashboard/cpd`.
- On mount, if `?stripe_identity=complete`, toast + scroll to `#identity` + refetch `getTrustState`.

### 4. Delete the Verification page + sidebar entry
Files: `src/routes/_authenticated/_professional/dashboard_.verification.tsx`, `src/components/dashboard/DashboardShell.tsx`

- Delete `dashboard_.verification.tsx` (or 1-line redirect to `/dashboard/profile#verification`).
- Remove `Verification` from `VERIFIED_NAV` and `PRO_NAV`.
- Delete `VERIFICATION_MODULE_NAV` + `inVerificationModule` branch in `Sidebar`.
- Delete `TierUnlockCard` and any "What you unlock" component only used by the verification page.

### 5. CPD page
File: `src/routes/_authenticated/_professional/dashboard_.cpd.tsx`

- Unchanged behaviour. Add a "← Back to Public Profile" hint at the top so users coming from the Qualifications summary have a return path.

### 6. Tier-blind sweep
- Grep for `useTrainerTier` / `subscription.tier` inside verification UI/state. Remove any conditional that gates Identity, Insurance or Qualifications behaviour on tier.
- Tier checks stay only on truly Pro-only client-management features.

## Acceptance (this phase)

- `getTrustState()` returns correct values for: brand-new account, identity-only, identity+insurance, fully verified.
- `/dashboard/verification` no longer in the sidebar; route either 404s or 302s to `/dashboard/profile#verification`.
- Public Profile shows 3-dot strip with live data — refetches after Stripe return.
- Stripe ID check returns to Public Profile, not a dead route.
- A Verified-tier and a Pro-tier account see the **identical** Trust block.
- No "What you unlock / Verified vs Pro" copy anywhere on the dashboard.
- **Directory / shopfront / city / profession pages: completely unchanged** — confirmed by `git diff` touching none of those files.

## Next phase (NOT in this plan, listed for visibility)

Once the above is signed off and stable, separate plan to wire the verified state into:
- Directory result cards (tick + earned title).
- `/c/$slug` shopfront trust band.
- City / profession page "Verified" filter and badges.
