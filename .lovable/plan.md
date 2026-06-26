## Goal

Remove the Core/Verified naming collision everywhere, make insurance review a first-class admin workflow, and make Jordon Gumbley's verification state explainable and correct.

The product truth must be:

- **Core** is the paid entry tier formerly shown as “Verified”. Internally it can continue to use the legacy enum key `verified` until a safe billing/data migration is done.
- **REPS Verified** is the trust badge. It means the trainer has all 3 checks approved: identity, qualification, and active in-date insurance.
- Jordon is currently **Unverified** because his insurance rows are `pending`, not `active`, and pending insurance is not visible enough for admin human review.

---

## 1. Rename the paid tier from Verified to Core across the app

Use **Core** anywhere the app is talking about the paid plan/tier/product.

Examples:

- “Verified plan” → “Core plan”
- “REPS Verified tier” → “REPS Core tier”
- “Join REPS Verified” → “Join REPS Core”
- Admin membership/professional tables must show `Core`, not the raw database value `verified`.

Keep **REPS Verified** only for the 3-of-3 trust badge and verification state language.

Files to sweep:

- `src/lib/billing.ts` — source of truth for tier display label/copy.
- `src/lib/billing/startCheckout.ts` — keep legacy tier key if checkout still expects `verified`, but callers/UI must display Core.
- `src/hooks/use-effective-identity.ts`
- `src/hooks/use-account-menu.ts`
- `src/components/dashboard/DashboardShell.types.ts`
- `src/components/dashboard/DashboardSidebar*`
- `src/routes/pricing.tsx`
- `src/routes/signup.tsx`
- `src/routes/for-professionals.tsx`
- `src/routes/features.*.tsx`
- `src/routes/help.index.tsx`
- `src/content/help/**`
- `src/emails/**`
- Admin tables/routes: `src/routes/admin_.professionals*`, `src/routes/admin_.memberships*`, `src/routes/admin_.subscriptions*`, or equivalent.

### Stripe product naming

If `STRIPE_SECRET_KEY` is available in build mode, update the Stripe Product display name/description for the legacy `verified` product to **REPS Core** while preserving all existing product and price IDs.

Do **not** delete or recreate Stripe prices. Existing subscriptions must continue to bill normally.

If Stripe credentials are not available, leave a one-off script or exact checklist for updating product metadata in Stripe Dashboard.

---

## 2. Replace raw plan displays with a single label helper

Create/use a single helper so raw enum values never leak:

```ts
getTierDisplayName("verified") // "Core"
getTierDisplayName("pro")      // "Pro"
getTierDisplayName("studio")   // "Studio"
```

Use this helper in:

- Trainer header/sidebar/account menu.
- Admin Professionals list.
- Admin Memberships/subscriptions list.
- Billing/pricing components.
- Email templates that mention a plan.

This fixes the specific admin issue: **Professionals must not show “plan verified”; it must show “Core”.**

---

## 3. Dashboard header must show verification, not plan, beside the trainer name

The trainer dashboard header/welcome panel must not put an orange “Verified”/Core plan pill beside Jordon’s name because that reads like trust verification.

New behaviour:

- If `is_pro_fully_verified` / trust state says all 3 are approved → green **REPS Verified** pill.
- Otherwise → neutral/amber **Unverified** pill.
- The paid plan can be shown separately as muted metadata: “Plan: Core”.

This makes Jordon’s dashboard truthful: he can be on the Core paid plan while still being **Unverified** as a profile.

---

## 4. Insurance auto-approval must be explicit and auditable

The intended insurance flow:

1. Trainer uploads certificate.
2. Gemini extracts policy holder / insured name, insurer/provider, policy number, cover amount, start date, expiry date, and confidence.
3. System compares policy holder against the Stripe-verified legal name, not just display name.
4. If confidence is high and all rules pass, auto-approve insurance.
5. If any rule fails or confidence is not high enough, send it to human review.

Auto-approval rules:

- Identity must be Stripe-approved.
- Policy holder name must match the Stripe legal name above threshold, recommended `>= 0.92` for auto-approval.
- Insurance must be in date.
- Cover must meet the minimum required amount.
- Insurer/provider must be recognised or admin-approved.
- AI confidence must be high enough.

All AI decisions must write to `trust_signals`/metadata: `ai_checked_at`, `ai_confidence`, `insured_name`, `name_score`, `name_match`, `expiry_date_extracted`, `cover_amount_extracted`, `provider_extracted`, `auto_approved`, and `reason`.

---

## 5. Make pending insurance visible in Admin → Verification

Current gap: admin verification is driven mainly by qualification submissions, so insurance rows like Jordon’s can sit in `pending` without a human place to approve/reject them.

Build a first-class insurance queue inside `/admin/verification`.

Top-level tabs:

- **Identity**
- **Insurance**
- **Qualifications**

or a unified queue with clear type filters, but insurance must be directly visible.

Insurance queue item must show:

- Trainer name.
- Current profile verification state.
- Stripe legal name / identity status.
- Policy holder name extracted by AI.
- Name match score.
- Insurer/provider.
- Cover amount.
- Start/expiry dates.
- Certificate preview/download.
- AI recommendation: Auto-approved, Recommend approve, Needs human review, or Recommend reject with reason.

Admin actions:

- **Approve insurance** — sets policy `status = active` if in-date.
- **Reject insurance** — requires reason and notifies trainer.
- **Request replacement** — for expired/unreadable/wrong-name certificates.
- **Re-run AI check** — useful for rows with `ai_checked_at = null`, including Jordon’s existing pending policies.

Safety:

- Admin approval must not allow an expired policy to become active.
- If expired, show “Expired — request renewed certificate”, not “pending review”.

---

## 6. Fix trainer-facing insurance status copy

Do not show “Insurance on file — admin is reviewing” when the expiry date is already lapsed.

Use trust-state-derived status, not raw row status:

| Status | Trainer-facing label | Copy | CTA |
|---|---|---|---|
| `active` | In date | Provider + expiry date | none |
| `expired` | Expired | “Your certificate lapsed on …” | Upload renewed certificate |
| `pending` | In review | “Admin is reviewing your certificate” | none |
| `rejected` | Rejected | show reason | Upload replacement |
| `none` | Not started | “Upload your insurance certificate” | Upload certificate |

This directly fixes the confusing Jordon dashboard copy.

---

## 7. Why Jordon is currently still Unverified

Jordon can have identity approved, qualification uploaded/approved, and insurance uploaded, and still be **Unverified** because the trust badge requires **active** insurance, not merely uploaded insurance.

His current blocker is insurance: uploaded rows are `pending`, and without the new admin insurance queue/admin action or successful AI auto-approval, the database function correctly refuses to mark him fully verified.

Once one insurance row is approved as `active` and in-date, the existing verification recompute trigger should flip him to fully verified if the other two checks are also approved.

---

## 8. QA checklist after implementation

### Naming QA

- Ripgrep for plan-related “Verified” and remove/replace with “Core”.
- Confirm “REPS Verified” still appears only for trust badge/verification language.
- Admin Professionals shows plan **Core**, not `verified`.
- Pricing page shows **Core**, not Verified.
- Checkout still sends legacy key if needed but shows Core to the user.

### Insurance QA

- Upload a clear in-date certificate with matching legal name → AI auto-approves.
- Upload an expired certificate → no auto-approval; trainer sees Expired / replacement CTA.
- Upload mismatched policy holder name → no auto-approval; appears in admin insurance queue.
- Upload low-cover policy → no auto-approval; appears in admin insurance queue.
- Existing orphan pending policies appear in `/admin/verification` → Insurance.
- Admin can approve/reject/request replacement.
- Trainer receives notification after admin decision.

### Jordon QA

- Dashboard top pill shows **Unverified** until insurance is active.
- Plan label shows **Core**.
- Insurance card shows the correct state from expiry/status.
- Admin can review his pending insurance in the insurance queue.
- Once approved, Jordon becomes **REPS Verified** only if identity + qualification + insurance are all approved.

---

## Out of scope unless explicitly approved

- Renaming the database enum value from `verified` to `core`. That is a larger migration touching subscriptions, Stripe webhook assumptions, RLS/policies, and historical rows. The safer immediate fix is a complete display-layer rename plus Stripe product display-name update.
- Recreating Stripe prices/products.
