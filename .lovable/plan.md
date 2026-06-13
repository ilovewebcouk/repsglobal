## What’s wrong right now

- The current experience is not cohesive: Identity + Insurance have been dropped into Public Profile, but they read like a separate module rather than part of the profile setup flow.
- The screen in your screenshot is still the old verification UI: `Back to dashboard`, `1 of 4 complete`, `What you unlock`, and tier copy. That means the old verification route is still being reached/rendered somewhere in the flow.
- `Continue ID check` is not returning users to the clean Public Profile trust area reliably.
- Qualifications are over-emphasised on this page. Based on your product logic, they should be managed in Education & CPD and only surface here as trust status.

## Brutally honest target

If I were doing this from scratch within your existing dashboard system:

- **Public Profile is the only trust home.** No separate member-facing Verification module.
- **Identity and Insurance are profile trust tasks**, styled in the same numbered system as Profile photo / Basic information / Bio.
- **Qualifications are not an editable card here.** They appear as a read-only trust row or status chip that says the title/qualification state is pulled from Education & CPD, with one clear link to manage it there.
- **No tier framing inside verification.** No “What you unlock”, no Verified vs Pro comparison, no “required for Pro tier” copy inside the trust workflow.
- **Stripe return lands back on `/dashboard/profile#identity`** and the page refetches state, highlights Identity, and stays in the normal dashboard shell.
- **Old `/dashboard/verification` UI becomes unreachable** for professionals.

## Plan

### 1) Run a proper QA pass and capture the broken paths
- Re-auth in preview and test the live flow end to end.
- Capture screenshots for:
  - `/dashboard/profile` before clicking ID check
  - the click target for `Continue ID check`
  - where Stripe returns after submit
  - sidebar/nav state on return
  - Education & CPD qualification state
- Confirm whether the old screen is coming from:
  - the old `/dashboard/verification` route still being mounted
  - stale saved Stripe session URLs
  - old return URLs stored in pending identity rows
  - sidebar logic that swaps to a special verification nav

### 2) Lock the information architecture
- Make **Public Profile** the only member-facing trust surface.
- Keep only these trust elements on profile:
  - **Identity** — actionable here
  - **Insurance** — actionable here
  - **Qualifications** — read-only summary, managed in Education & CPD
- Remove all member-facing tier/upgrade copy from the trust area.
- Decide the exact placement so it feels native to the profile editor rather than bolted on.

### 3) Redesign the trust section to match the dashboard properly
- Replace the current large standalone TrustBlock layout with a structure that matches the page’s numbered cards.
- Recommended shape:
  - a slim trust/status strip near the top
  - **Identity** card with one primary action
  - **Insurance** card with the form/upload state
  - **Qualifications** row/card showing approved status, earned title, and link to Education & CPD
- Make numbering and hierarchy visually consistent with the rest of Public Profile.
- Remove the current awkward two-column “verification module inside profile” feel.

### 4) Fix the routing and stale-screen problem
- Update the ID-check flow so **every new Stripe session returns to `/dashboard/profile?stripe_identity=complete#identity`**.
- Remove or hard-redirect the old professional verification route so it cannot render the legacy UI anymore.
- Remove the special verification sidebar state (`Back to dashboard` module shell) for professionals.
- Add stale-session handling so `Continue ID check` does not reuse broken/expired hosted-session URLs.
- Ensure any legacy links/search params that still point to verification resolve safely back into Public Profile.

### 5) Align copy with the product truth
- Verification is **universal** across paying members, not a Pro upgrade.
- Insurance copy should not frame it as a Pro-only requirement inside this flow.
- Qualifications copy should explain that titles and status are derived from Education & CPD, not edited here.
- Keep trust copy factual, short, and operational.

### 6) Final QA and acceptance checks
- Verify that clicking `Continue ID check` never shows the old verification screen.
- Verify sidebar stays the normal dashboard sidebar with the correct active state.
- Verify the user always lands back on Public Profile after ID submission.
- Verify qualifications status updates from Education & CPD and is only linked here.
- Verify no old `What you unlock` / Verified vs Pro trust copy remains in the dashboard trust flow.
- Compare final screenshots against current state and confirm the page feels like one coherent profile workflow.

## Technical details

- Current evidence points to two technical issues:
  1. the old verification route/sidebar pattern still exists in the app flow
  2. Stripe Identity sessions can resume/return through stale URLs, which can surface the old screen again
- Likely implementation tasks:
  - retire or redirect `dashboard_.verification.tsx`
  - remove the verification-only sidebar branch in `DashboardShell.tsx`
  - refactor `TrustBlock.tsx` so qualifications become read-only + deep-link to CPD
  - harden `stripe-identity.functions.ts` return-path handling
  - add stale-session restart logic for pending Stripe identity sessions

## Deliverable after implementation

A Public Profile page that feels world-class because it behaves like **one clean profile completion workflow**: numbered, coherent, trust-focused, no duplicate module, no broken sidebar, and no old verification screen resurfacing.