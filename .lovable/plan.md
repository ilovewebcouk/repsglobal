Add an `onImage` variant to `VerificationPill` that mirrors the homepage style (`bg-reps-green/15 ring-1 ring-reps-green/30 text-reps-green` with `BadgeCheck`), and pass `variant="onImage"` from `FeaturedProCard`. Directory cards keep the existing emerald default.

### Files
1. `src/components/directory/VerificationPill.tsx` — add `variant?: "default" | "onImage"`; when `onImage`, render verified pill with `bg-reps-green/15 ring-1 ring-reps-green/30 text-reps-green` and `BadgeCheck` icon. Unverified/tier branches unchanged.
2. `src/components/public/FeaturedProCard.tsx` — pass `variant="onImage"`.

### Verification
Reload `/in/london` — Featured card pill matches the homepage rail's green verified pill.