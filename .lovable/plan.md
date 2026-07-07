## Goal
Stop showing "REPS Verified" on unverified newcomers. Plumb verification through and render a neutral "New member" pill for pros whose `verification_status !== 'verified'`.

## Changes

### 1. `src/lib/directory/newest.functions.ts`
- Add `verification_status: string | null` to `NewestCoachRow`.
- Include `verification_status` in the `professionals` select (line 42).
- Pass it through when building each row (line 79–92).

### 2. `src/routes/index.tsx` — `rowToNewestCoach`
- Compute `verified: r.verification_status === "verified"` and set it on the returned `NewestCoach`.

### 3. `src/components/public/NewestCoachCard.tsx`
- Add `verified: boolean` to the `NewestCoach` type.
- Replace the hardcoded verified strip with a conditional:
  - **Verified** (unchanged): `ShieldCheck` + "REPS Verified" in emerald (`text-emerald-600` / `text-emerald-700`).
  - **Unverified**: `Sparkles` icon + "New member" in neutral stone tones — `text-black/45` icon + `text-black/55` label, same size / tracking / vertical rhythm so card heights stay identical across the grid.
- No border, no background fill on either pill — matches the existing quiet chrome.

## Out of scope
- No change to which pros appear in the rail (unverified newcomers stay included, per the serverfn's stated intent).
- No change to homepage section header, grid, spacing, or any other card element (photo well, rating chip, name, role, meta row).
- No change to `/c/$slug` or other surfaces.

## Memory compliance
- Emerald stays reserved for the verified status pill only (per `mem://design/status-colors`).
- Neutral pill uses only stone/black opacities already in the card — no new accent hue introduced.
