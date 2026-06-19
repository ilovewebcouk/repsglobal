
## Goal

Add an explicit, hard-to-misfire **Execute launch-day billing run** button to `/admin/migration`, separate from the existing "Renew due" CTA. It triggers the already-approved v7 logic, but only after multiple safeguards pass.

## Where it lands

`src/routes/admin_.migration.tsx` → `StripeLinkingPanel`. New dedicated row above the existing stats grid, visually separated from the day-to-day "Renew due" button so it can't be hit by reflex.

## Behaviour

The new button calls the existing `runLegacyRenewalBatch` server function — no new billing logic. All v7 cohort rules already live in `src/lib/admin/stripe-linking.functions.ts` (overrides, honour window, anomaly £99, no £34 recurring, pre-launch guard via `LAUNCH_AT_UTC`).

Client-side safeguards before the call fires:

1. **Environment must be Live.** If the env selector is "Sandbox", the button is disabled with helper text.
2. **Date/time gate.** Disabled until `now >= 26 June 2026, 00:00 BST` (23:00 UTC, 25 June). Shows a countdown label while locked.
3. **Typed confirmation.** Opens a shadcn `AlertDialog` summarising the locked v7 expectation:
   - honour_window = 6 × £34 = £204
   - anomaly_launch_charge = 1 × £99 = £99
   - **Launch-day total = £303**
   - No long-overdue cohort, no lifetime cohort, no renewable £34 subs.
   Admin must type `LAUNCH` to enable the confirm button.
4. **Admin-role check.** Reuses existing admin guard on the page; no extra server work needed.

Server-side safeguard already exists: `_runLegacyRenewalBatch` throws if called before `LAUNCH_AT_UTC`, so even a bypassed UI cannot fire early.

After execution, the result is rendered into the existing `log` area and the stats grid is invalidated, same pattern as `renewPass`.

## Visual

A boxed panel inside `StripeLinkingPanel`, above the stats grid:

```text
┌─ Launch-day billing run ──────────────────────────────────┐
│  Locked v7 plan: honour 6 × £34 + anomaly 1 × £99 = £303  │
│  Available from: 26 Jun 2026, 00:00 BST                   │
│  Environment:    Live (required)                          │
│                                                           │
│  [ Execute launch-day billing run ]   status / countdown  │
└───────────────────────────────────────────────────────────┘
```

Uses brand orange for the CTA; disabled state is muted. No changes to existing "Renew due" button or daily cron — those stay as the steady-state path after launch.

## Out of scope (call out, don't build)

- No change to `runLegacyRenewalBatch` logic or cohort rules.
- No change to the daily 03:00 UTC cron.
- No new server function, no new DB column.
- No e-mail sends added.

## Files touched

- `src/routes/admin_.migration.tsx` — extend `StripeLinkingPanel` with the new panel, dialog, gate state, and mutation handler (reuses `renewFn`).

That's the only file.
