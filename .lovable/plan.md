## Goal
Sharpen the homepage hero headline and lede so the verification layer feels like the primary reason to choose REPs, not a secondary benefit. Layout, gradient, image crop, form, trust chips, animation delays, and all downstream sections remain untouched.

## Current copy (lines 164-178, src/routes/index.tsx)
- **H1:** "Find a coach / worth trusting."
- **Lede:** "25,000+ verified fitness professionals. Real qualifications. Real reviews. Real results — in 30 seconds."

## Proposed revision
- **H1:** "Find a coach who's actually qualified."
  - Replaces the passive "worth trusting" with an active, credential-first claim that lands harder for someone who has been burned by unverified coaches.
- **Lede:** "Every REP is credential-checked, insured and fully qualified. Browse 25,000+ verified professionals with real client reviews — and book in 30 seconds."
  - Front-loads the verification promise (same language already used in the trust pillars on this page), keeps the 30-second speed claim, and drops the repetitive "Real" triple which currently competes with the trust-chip wording below.

## Constraints
- No changes to HTML structure, class names, animation delays, or line-break placement.
- No changes to hero image, gradient stops, form, or trust chips.
- Meta title/description remain as-is unless explicitly requested.

## Files
- `src/routes/index.tsx` — edit lines 168-177 only (H1 text + lede text).