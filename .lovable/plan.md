## Change

Show an explicit **"Unverified"** pill in the hero of unverified public profiles, matching the same slot where verified profiles show the green "REPS Verified · Insured" (coach) / "REPS Verified" (provider) pill. Nothing renders there today when the profile isn't verified, which reads like the pill was removed.

## Where

1. `src/routes/c.$slug.index.tsx` — coach website hero, around lines 906–914 (the `coach.trust?.isVerified ? <Badge…/> : null` block).
2. `src/routes/t.$slug.index.tsx` — training-provider hero, around lines 244–247 (currently a hard-coded emerald "REPS Verified" pill that ignores trust state).

## How

- Coach page: add an `else` branch that renders a neutral pill in the same shape as the verified one — `rounded-full`, `bg-white/[0.06]`, `text-reps-muted`, `ring-1 ring-white/12`, `Shield` icon, label **"Unverified"**. Sits in the same flex row as the location, so layout is unchanged.
- Provider page: make the pill conditional on trust state (identity approved AND verification = verified, matching `VerificationPill`). Verified → keep the current emerald "REPS Verified" pill unchanged. Not verified → render the light-theme equivalent of the neutral pill: `border-black/15 bg-white text-black/60`, uppercase, tracking `0.14em`, label **"Unverified"**, `Shield` icon.

Scope is hero pill only. No changes to the trust strip, tagline defaults, credential sections, SEO copy, or data model. No new files.
