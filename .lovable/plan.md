## Goal

In the Broadcast composer, show the exact number of **confirmed newsletter subscribers** that will be targeted — alongside a per-tier breakdown — instead of the current single "Will send to N trainers" line.

## Current state

- `previewBroadcastCount` (`src/lib/campaigns/outbound.functions.ts`) resolves every selected tier through `resolveTierRecipients`, deduplicates by email, and returns just `{ count }`.
- The composer (`src/components/admin/campaigns/ComposeDialog.tsx`, line ~361) renders one line: `Will send to N trainers` — which is misleading when the Newsletter tier is selected (subscribers aren't trainers), and hides how the total is composed when multiple tiers are ticked.

## Change

### 1. Server: return a breakdown

Update `previewBroadcastCount` to return:

```
{
  count: number,          // deduped total (unchanged)
  byTier: {
    free?: number,
    verified?: number,
    pro?: number,
    studio?: number,
    former?: number,
    newsletter?: number,  // confirmed subscribers only
  }
}
```

Implementation: run the existing tier resolvers once per selected tier (small dataset today; same helpers already used inside `resolveTierRecipients`), count each, then also compute the deduped union for `count`. Newsletter count comes from `newsletter_subscribers` where `status = 'confirmed'` (matching the existing sender behaviour — pending/unsubscribed/bounced are excluded).

No change to send-time behaviour; this is preview-only.

### 2. Composer UI

Replace the single line under the tier checkboxes with:

- A headline: **"Will send to N recipients"** (neutral wording, not "trainers").
- A small breakdown row underneath, only for ticked tiers with a non-zero count, e.g.:
  `Verified 12 · Pro 4 · Newsletter 318`
- When Newsletter is the only ticked tier, headline reads **"Will send to 318 confirmed newsletter subscribers"**.
- Loading state unchanged (`Counting recipients…`).

No changes to send logic, tier options, or the direct-recipients mode.

## Files touched

- `src/lib/campaigns/outbound.functions.ts` — extend `previewBroadcastCount` return shape.
- `src/components/admin/campaigns/ComposeDialog.tsx` — render breakdown; adjust copy.

## Out of scope

- Auto-adding members to the newsletter list and single opt-in (previous request) — will handle separately.
- Any change to campaign sending, tracking, or the Newsletter admin tab.
