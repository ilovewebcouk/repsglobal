## Goal

Identity verification is fully delegated to Stripe Identity. Admins should observe outcomes only — no manual approve / reject / needs-more-info / expire actions in the Identity tab of `/admin/verification`.

## Audit findings

**Current admin surface (`src/routes/admin_.verification.tsx`, Identity tab):**
- Status filter pills: Pending, Approved, More info, Rejected, Expired.
- Per-row action buttons: **Approve**, **Reject**, **Needs info** — call `adminOverrideIdentity`.
- Override dialog captures a reason and writes to `identity_documents.admin_note`, sets `status`, and mirrors onto `professionals.identity_status` / `identity_verified_at` / `identity_verified_name`.

**Server (`src/lib/verification/identity.functions.ts`):**
- `adminOverrideIdentity` server fn — manual decision writer.
- `listIdentityChecks` — accepts all 5 statuses.
- `myIdentity` / `getIdentityForPro` — read-only, keep.

**Stripe path (`src/lib/verification/stripe-identity.functions.ts` + webhook):**
- `createStripeIdentitySession` creates the session.
- A Stripe webhook (`identity.verification_session.*`) already updates `identity_documents.stripe_status` / `status` and propagates to `professionals.identity_status`. This is the only path that should mutate identity state.

**Legacy `needs_more_info` / `expired` / manual `rejected`:** only reachable through `adminOverrideIdentity`. Stripe emits `verified`, `requires_input`, `processing`, `canceled` — mapped to `approved` / `pending` in the mirror. There is no Stripe-driven `expired` or `needs_more_info`.

## Changes

### 1. Admin UI — `src/routes/admin_.verification.tsx` (Identity tab only)
- **Remove** filter pills: `needs_more_info`, `expired`. Keep: **Pending**, **Approved**, **Rejected** (rejected = Stripe `requires_input` finalised as unverifiable, kept for visibility).
- **Remove** the Actions column entirely (Approve / Reject / Needs info buttons).
- **Remove** the override `Dialog`, `overrideTarget` / `overrideReason` / `overrideBusy` state, `submitOverride`, `doOverride`, and the `useServerFn(adminOverride)` wiring.
- **Remove** the `adminOverride` prop from `AdminIdentityTab` and its call site.
- Add a short helper line under the filter row: "Stripe Identity manages every outcome automatically — this view is read-only."
- Keep the Stripe dashboard deep-link (already present on the qualifications-side identity block via `stripe_vs_id`).
- Add a "Open in Stripe" link per row (via `stripe_vs_id`) so admins can inspect the check in Stripe when needed.

### 2. Server — `src/lib/verification/identity.functions.ts`
- **Delete** `adminOverrideIdentity` export and its Zod schema.
- **Narrow** `listIdentityChecks` input to `z.enum(["pending", "approved", "rejected"])`.
- Keep `myIdentity` and `getIdentityForPro` unchanged.

### 3. Imports
- Drop `adminOverrideIdentity` import in `admin_.verification.tsx`.
- Drop now-unused `Dialog*`, `Textarea` imports if no longer referenced in the file (verify before removal — they're also used by other tabs).

## Out of scope

- Stripe webhook handler (already the source of truth — no changes needed).
- Qualifications and Insurance tabs (unchanged).
- `identity_documents` schema — historical `needs_more_info` / `expired` rows remain readable; they just won't appear under the trimmed filter set. No migration needed.
- Trainer-facing verification page (already Stripe-driven).

## Verification

- Typecheck passes after removing `adminOverrideIdentity` references.
- Identity tab renders with 3 filters and no action buttons.
- Stripe webhook still moves rows from Pending → Approved without admin involvement.
