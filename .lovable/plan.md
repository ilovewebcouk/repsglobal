# Fix article + sweep "Verified tier" → "Core tier"

## Scope guardrail (critical)

Two meanings of "verified" exist in the repo. Only ONE gets renamed:

| Meaning | Example | Action |
| --- | --- | --- |
| **Plan/tier name** ("Verified tier", "Verified plan", "Verified members get…", "Included on Verified+") | pricing, compare pages, dashboard gating copy, emails, memory | **Rename to "Core"** |
| **Trust concept** — a professional who has passed ID / insurance / credential checks | `verification.functions.ts`, `/verify` flow, "verified professional" badge on the register, trust chips, `email_confirmed_at` copy, DB columns | **KEEP unchanged** |

A member on the Core tier is still a "verified professional" on the register. That badge/label/flow does not change.

## Step 1 — Fix the resource article

File: `src/lib/resources.ts`, article slug `introducing-the-reps-website-editor`.

- Remove every claim that the website editor is "Pro-only" / "Pro tier and above" / etc.
- Replace every "Verified tier" reference with "Core tier".
- Add one explicit line stating it's included on every REPs tier — Core, Pro and Studio.
- No other content changes. Hero image, structure, tone all stay.

## Step 2 — Spawn a read-only subagent for the sweep

Delegate the audit to a background `spawn_agent` task. Its job: produce a categorised find-list, NOT edit anything.

Subagent brief:
- Search all of `src/`, `docs/`, and memory index for the word "verified" / "Verified" / "verification" (case-insensitive).
- For each hit, classify as **TIER-NAME** (must change) or **TRUST-CONCEPT** (must NOT change) using context around the line.
- Return a table grouped by file, with line numbers, the current phrase, and the proposed replacement (or "KEEP").
- Explicitly flag any ambiguous case for me to decide.

Files it must NOT touch under any circumstance:
- `src/integrations/supabase/**` (auto-gen)
- `src/routeTree.gen.ts`
- Anything under `src/mockups/legacy-admin/**` (archived)
- DB column names, RPC names, function file names (those stay)

## Step 3 — Apply the tier-name renames

Once the subagent returns its list, I apply the TIER-NAME changes in a single batched pass:

- **User-facing copy** — pricing page, compare pages, dashboard upsell copy, feature-gate messages, marketing pillars, resource articles, emails.
- **Memory files** — `mem://index.md` (Core rules mention "Verified tier"), `mem://phase/2.0-verified-scope` (rename to reflect Core naming, or add a top-note stating tier = Core), any other memory that says "Verified tier".
- **Docs** — `docs/09_phase2_verified.md`, `docs/10_billing_phase0_decisions.md`, admin-v2 docs where the tier is named.

Every TRUST-CONCEPT hit stays untouched.

## Step 4 — Verify

- Re-run the same rg sweep, confirm no remaining "Verified tier" / "Verified plan" / "Verified members" / "on Verified+" phrases outside archived mockups.
- Spot-check pricing page, /features/shop-front, /for-professionals, dashboard upsell strings, and the fixed resource article render.
- Confirm the verification badge on `/pro/$slug` and `/c/$slug` still says "Verified professional" (unchanged).

## What I will NOT do

- Rename any file, function, RPC, DB column, route, or type containing the word "verification" / "verified".
- Change the "Verified professional" badge or the `/verify` onboarding flow.
- Touch anything in `src/mockups/`, `src/integrations/supabase/`, or the generated route tree.
- Change any other content in the resource article beyond the two edits above.
