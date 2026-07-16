## Wire Trust & Assurance box to the real 3-step provider verification

Replace the generic PT-shaped rows (Identity / Accreditations / Insurance) on `/t/$slug` with the actual training-provider 3-step verification, so the badge on the public page only earns "REPS Verified" when all three steps are complete.

### What "verified" means (already defined in `provider-verification.functions.ts`)

1. **Identity** — `professionals.identity_status = 'approved'`
2. **Provider name** — `profiles.full_name` locked (non-empty)
3. **Domain** — latest `provider_domain_verifications.status = 'approved'`

A provider is "REPS Verified" only when all 3 are done.

### Server: new public function

`src/lib/verification/provider-verification-public.functions.ts`
- Export `getPublicProviderVerification({ providerId }) -> { identity, name, domain, completedCount, verifiedAt }`
- Uses `supabaseAdmin` inside the handler (no auth) — reads only the same 3 sources as the private summary, but returns:
  - `identity.done: boolean`, `identity.verifiedAt: string | null`
  - `name.done: boolean`, `name.value: string | null`
  - `domain.done: boolean`, `domain.value: string | null` (the domain string, not the email)
  - `completedCount: 0 | 1 | 2 | 3`
  - `verifiedAt: string | null` — max of the three completion timestamps when `completedCount === 3`
- No emails, no rejection reasons, no pending-review internals in the response.

### Client: rewrite the Trust box in `src/routes/t.$slug.index.tsx` (~lines 684–720)

- Fetch via `useQuery` keyed on `sf.professional_id`.
- Header changes with state:
  - `completedCount === 3` → "REPS Verified" (emerald), sub "Confirmed {Mon YYYY}" from `verifiedAt`
  - else → "Not yet verified" (neutral black/60), sub "REPS is reviewing this provider."
- Always render three rows, each with a ✓ (emerald) or ○ (black/25) icon:
  - **Identity** — done: "Owner confirmed via Stripe Identity{, Mon YYYY}" · not done: "Not yet confirmed"
  - **Provider name** — done: "{trading name} locked" · not done: "Not yet locked"
  - **Domain** — done: "{domain} confirmed" · not done: "Not yet confirmed"
- Remove the "View full verification" link entirely (per your answer).
- Keep the article shell, radius, spacing, and `TrustRow` primitive so it stays visually consistent with neighbouring cards.

### Hero badge consistency

The hero already has a "REPS Verified" chip driven off `sf.trust?.identityVerifiedAt` (line ~333). That's wrong for providers — identity alone isn't verification. Switch that chip to also read `completedCount === 3` from the same query so the header badge, the Trust box header, and the directory badge all tell the same story.

### Files touched

- `src/lib/verification/provider-verification-public.functions.ts` — new
- `src/routes/t.$slug.index.tsx` — rewrite Trust box, update hero verified chip condition

### Out of scope

- No changes to how providers complete verification, no schema changes, no admin flow changes.
- Insurance / accreditations rows are removed from this box; if you want them back later they belong in a separate "Compliance" card, not "Verification".
