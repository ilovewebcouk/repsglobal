## Fix

`LAUNCH_AT_UTC` is currently set to the **start** of Friday 26 Jun (Thursday midnight), which is why the countdown already reads zero. You want **end** of Friday 26 Jun — i.e. midnight tonight (Sat 27 Jun 00:00 Europe/London = 2026-06-26T23:00:00.000Z BST).

## Change

`src/lib/launch.ts` line 12:

```ts
// before
export const LAUNCH_AT_UTC = new Date("2026-06-25T23:00:00.000Z");
// after
export const LAUNCH_AT_UTC = new Date("2026-06-26T23:00:00.000Z");
```

Update the comment above it from "Friday 26 June 2026, 00:00" → "Saturday 27 June 2026, 00:00 Europe/London (end of Fri 26 Jun)".

No other files change. Countdown will tick down to midnight tonight; gate stays on (`LAUNCH_GATE_ENABLED = true`) until you flip it.
