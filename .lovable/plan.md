## Goal

One home for the provider name: the **Profile** page. Providers can change it as often as they like — every change submits a request to admin, and the public page keeps showing the last approved name until review.

## Changes

### 1. Verification page — remove the name card
`src/components/dashboard/organisation/VerificationPage.tsx`
- Remove `<TradingNameCard />` from the render tree (line 136) and delete the `TradingNameCard` function (lines ~645–770).
- Drop now-unused imports: `getMyProviderNameStatus`, `submitProviderNameChange` from `@/lib/verification/provider-name.functions`, plus any icons only that card used.
- Verification page becomes: qualifications, insurance, CPD only.

### 2. Profile page — make Provider name an editable field
`src/components/dashboard/organisation/ProviderProfilePage.tsx`
- Replace the current read-only "Provider name" row + "Set in Verification" link (lines ~391–445) with an editable input:
  - Text input pre-filled with the approved name.
  - Inline "Submit name change" button (disabled when unchanged or empty).
  - Calls `submitProviderNameChange({ requested_name })` on click — same server fn already used by Verification.
  - Shows pending banner ("Awaiting admin approval — 'X'. Public page still shows 'Y'.") when `nameStatus.pending` is set — reuses existing pending UI already in this file.
  - Hint text: "Change this any time. Every change is reviewed by REPs before it appears on your public page and URL."
- Keep the public-URL hint (`repsuk.org/t/{slug}`) unchanged.
- Keep the top "Every profile change needs admin approval" banner — the name now fits that same model naturally.

### 3. Server function — no schema changes
`src/lib/verification/provider-name.functions.ts` already implements the right behaviour:
- First-time set (no prior `business_name`) → applied instantly.
- Any subsequent change → inserted into `provider_name_requests` as pending; `profiles.business_name` unchanged until an admin approves via `reviewProviderNameRequest`.

No migration needed. Admin review queue at `/admin/provider-names` is unchanged.

### 4. Copy tidy
- Anywhere that says "Managed on your Verification page" / "Contact REPs support to change" for provider name → remove.
- The "Set this before you can submit regulated qualifications or CPD" gating text disappears with the Verification card. If qualifications submission actually requires an approved name, that gate should live on the qualifications card (existing behaviour — no change unless you want it revisited).

## Out of scope
- Admin review UX at `/admin/provider-names` (unchanged).
- Rate-limiting repeated name changes (can add later if spam becomes an issue).
- The public read path already reads `business_name ?? full_name` from the recent QA fix.

## Files touched
- `src/components/dashboard/organisation/VerificationPage.tsx` — remove card + imports
- `src/components/dashboard/organisation/ProviderProfilePage.tsx` — swap read-only row for editable input + submit
