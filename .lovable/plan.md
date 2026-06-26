## Issue

On `/pro/jordon-gumbley` the subtitle shows **"REPS Professional"**, but his directory card shows **"Fitness Professional"**. Different fallbacks for the same missing field (`primary_profession`).

## Cause

- Directory cards (`find-a-professional`, `index`) fall back to `"Fitness Professional"` when `primary_profession` is null.
- Profile page (`src/routes/pro.$slug.index.tsx`, lines 295–299) falls back to `"REPS Verified Professional"` or `"REPS Professional"`.

Jordon has no `primary_profession` set, so each surface picks its own fallback.

## Fix

In `src/routes/pro.$slug.index.tsx` `proFromDb()`:

- Replace the verified/unverified fallback pair with a single `"Fitness Professional"` fallback, matching the directory cards.
- Drop `verifiedFallback` (the green "REPS Verified" badge already signals verified status — the subtitle doesn't need to repeat it).

Result: subtitle = `getProfessionLabel(primary_profession) ?? "Fitness Professional"` — same string the card uses.

No other files change. No data/migration work.
