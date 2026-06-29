## Button color fixes on Member 360 sticky header

In `src/routes/admin_.members.$userId.tsx` (lines 262–292):

1. **"View public profile" (orange)** — swap `text-black` → `text-white` so the label reads white on orange, matching every other orange CTA in the app.
2. **"Send email" + "⋯ More actions" (secondary)** — swap the current `bg-reps-panel/40` for `bg-white/5` (the secondary-button background already used in `/admin/support`'s toolbar). Keep `border-reps-border text-white hover:bg-reps-panel-soft hover:text-white` so the hover state still lifts.

No other files change.