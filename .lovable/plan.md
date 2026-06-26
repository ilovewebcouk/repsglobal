## Plan: Disable the coming-soon gate (keep the page for later reuse)

### Change

In `src/lib/launch.ts`, flip:

```ts
export const LAUNCH_GATE_ENABLED = false;
```

That's the single switch. Every visitor will hit the real site immediately; no redirect to `/coming-soon`.

### What we keep

- `/coming-soon` route file stays in place and remains directly reachable.
- `LAUNCH_AT_UTC`, `PREVIEW_UNLOCK_CODE`, `isAllowlistedPath`, etc. all stay so we can flip the flag back to `true` later (maintenance, future relaunch, scheduled downtime) with zero rebuild work.
- No database, no component deletions, no route removals.

### Validation

- Hard refresh `/`, `/find-a-professional`, `/pro/...` while signed out → real site loads (no redirect).
- Visit `/coming-soon` directly → page still renders, so we can link to it manually if needed.
