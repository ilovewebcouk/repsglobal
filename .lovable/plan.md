## Why it's still showing

There are two different "verified" signals in the dashboard hub, and they disagree for Jordon:

- The **REPS Verified badge** in the header card uses `trust.ticks.identity && trust.ticks.insurance && trust.ticks.qualifications` — the live 3-of-3 trust state (`src/components/dashboard/hub/index.tsx`, line 93). Jordon passes all three, so the badge is green.
- The **"Complete your verification" attention item** uses `isVerified` derived from `profile.verification_status === "verified"` (`src/routes/_authenticated/_professional/dashboard.tsx`, line 73), passed into `NeedsAttention` (line 218) and checked at `hub/index.tsx` line 252.

`professionals.verification_status` is the cached column updated by `recompute_pro_verification`. When Jordon's insurance was approved in the new admin queue, the trust ticks went green immediately (they read live from `insurance_policies` + `verification_submissions` + `identity_documents`), but the cached column either didn't recompute or the trigger fired against an older row state. Result: badge says Verified, but the Needs Attention card still nags him to verify.

## Fix

Make Needs Attention use the same single source of truth as the badge — the live trust ticks — so the two surfaces can never disagree again.

### Frontend change

1. In `src/components/dashboard/hub/index.tsx`:
   - Drop the `isVerified: boolean` prop from `NeedsAttention`.
   - Replace `if (!isVerified)` with `if (!trust || !trust.ticks.identity || !trust.ticks.insurance || !trust.ticks.qualifications)` (the `trust` prop is already passed in).

2. In `src/routes/_authenticated/_professional/dashboard.tsx`:
   - Remove the `isVerified` calculation and the `isVerified={isVerified}` prop on `<NeedsAttention>`.

No other call sites use `isVerified` on this component.

### Backend hygiene (one-time)

Run `recompute_pro_verification(<jordon's pro id>)` once so `professionals.verification_status` matches the live state and the admin list / search filters don't lag. No schema change — just call the existing function.

## Out of scope

- The recompute trigger itself looks correct; if you'd like a deeper QA on why the cached column drifted (trigger timing, RLS on update, etc.) I'll do that as a separate pass. For now the UI fix removes the user-visible inconsistency.
