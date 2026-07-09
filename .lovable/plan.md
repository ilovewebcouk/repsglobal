## Answer: they are the same field

Both surfaces read the **same column**: `profiles.business_name`. There is one provider name in the database, shown in two places.

### What's on each page today

| Page | Label | Behaviour |
|---|---|---|
| `/dashboard/verification` — **Trading name** card | "Trading name" | Amber "action needed" state when empty. Input + **Set name** button. Once set → locked pill, copy: *"Locked. Contact REPs support to change your trading name."* |
| `/dashboard/profile` — **Identity → Provider name** field | "Provider name" | Text input that reads `business_name`. But the `saveProviderProfile` server fn **ignores the `name` field on save** (see `provider-profile.functions.ts` L110–113: *"`name` is accepted for backwards compatibility but ignored — name changes go through the admin approval queue"*). So the input looks editable, does nothing. |

### Why this is confusing (and wrong)

1. **Two different labels for one field** — "Trading name" vs "Provider name" makes it look like two settings.
2. **Profile input is a dead control** — user types, hits save, name doesn't change, no error, no explanation.
3. **The gate lives in the wrong place** — trading name is a verification prerequisite (blocks qualification/CPD submission), so it belongs in `/dashboard/verification`, not in profile chrome.

### Recommendation (one field, one place)

Consolidate to a single surface:

- **Keep the card in `/dashboard/verification`** as the only place a provider sets or sees their name. Rename it from **"Trading name"** to **"Provider name"** to match the public label.
- **Remove the Provider name input from `/dashboard/profile`.** Replace with a read-only display of the current provider name plus a small link: *"Set in Verification"* (or *"Contact support to change"* once locked). The Identity panel keeps logo + hero image + slug/public URL.
- **Drop the ignored `name` field** from `UpdateProviderProfile` (server fn) and the `namePending` UI branch on the profile page — that logic is dead weight now that changes flow through support only.
- **Column stays**: `profiles.business_name` is the single source of truth. No DB migration needed.

### Result

- One field, one page, one label ("Provider name"), consistent with the public site.
- Profile page shows the current name for reference but is not editable there.
- Verification page owns the write path (first-set instant, later changes = contact support).
- No dead controls, no split brain.

### Open decisions before I build

- (a) Rename **"Trading name"** card → **"Provider name"** everywhere? Or keep "Trading name" (legal/tax connotation) and only rename the profile label?
- (b) On the profile page, should the read-only pill link to `/dashboard/verification#trading-name`, or just render as static text?
