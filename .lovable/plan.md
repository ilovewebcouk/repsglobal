## 1. New Campaign button — white text
`src/routes/admin_.campaigns.tsx` line 42: `text-black` → `text-white` on the orange button. (Matches every other `bg-reps-orange` CTA on the site.)

## 2. Add "Unverified" tier to Broadcast
`src/components/admin/campaigns/ComposeDialog.tsx`, `TIERS` array (line 58): prepend `{ value: "free", label: "Unverified" }`. The backend (`outbound.functions.ts` → `resolveTierRecipients`) already handles `"free"` — it resolves to "all professionals without any active paid sub", so no server change needed. Default selection stays `["verified"]`.

## 3. Branded email footer
Rewrite `bodyToHtml` in `src/lib/campaigns/outbound.functions.ts` (line 558) so every outbound campaign / 1-to-1 email is wrapped in a proper HTML email shell:

- White card on a soft grey page background, 600px max width, Arial/Helvetica stack.
- Header strip with the **REPs wordmark inlined as SVG in black** (`#0F172A`), copied directly from `RepsWordmark.tsx` (same 4 paths, viewBox 267.34×48.17, height ~22px).
- Existing message body rendered below.
- Footer block under a hairline divider containing:
  - Black REPs wordmark (smaller, ~16px).
  - One-line tagline: "REPs — the global register of exercise professionals."
  - Reply-prompt line: "Reply directly to this email — it goes straight to the {Inbox label} team."
  - Small print row with links to **repsuk.org**, **/contact**, **/privacy**, **/terms** (absolute https://repsuk.org URLs so they work in mail clients).
  - Year + "© {year} REPs. All rights reserved."
- All styles inline (no `<style>` / external CSS), table-free flex-safe markup using `<div>` with inline `style`. Keeps Gmail/Outlook-friendly.

`bodyToHtml` becomes `wrapEmail(bodyText, inboxLabel)` and is called from both branches (broadcast + direct) with the resolved inbox label.

## 4. QA the "sent but toast says failed" bug

Likely cause (from reading `sendAdminOutbound`): the recipient set isn't pre-validated. `resolveTierRecipients` lowercases `public_email ?? auth.users.email ?? ""` then filters empty strings — but malformed addresses (e.g. `"name only"`, stray whitespace, missing `@`) make it through and Mailgun rejects them, so `failed_count > 0` even though the rest delivered. The UI then fires `toast.warning("Sent N · failed M")`.

Fix in three small steps, all in `src/lib/campaigns/outbound.functions.ts`:

1. Add a single `isValidEmail(e: string)` helper (same regex used in `ComposeDialog.addManual`). Apply it inside `resolveTierRecipients` and to the `recipients` array in `sendAdminOutbound` BEFORE the dedupe, dropping invalid addresses. Track them in a new `skipped` array so we still report them.
2. Return shape gains `skipped: Array<{ email: string; reason: string }>` alongside `failures`.
3. In `ComposeDialog.tsx` `onSuccess`:
   - If `res.failed === 0` AND `res.skipped.length === 0` → `toast.success(...)` (current behaviour).
   - If only `skipped > 0` (e.g. malformed addresses but every valid send went out) → `toast.success("Sent to N recipients")` with a `description` line "Skipped K invalid address(es)" — no warning toast.
   - Only show `toast.warning` when Mailgun genuinely rejected a delivery (`res.failed > 0`), and include the first failure's `error` text in `description` so the admin can see *why*.

This eliminates the false-alarm warning while keeping real failures visible.

## Files touched
- `src/routes/admin_.campaigns.tsx` (1 className)
- `src/components/admin/campaigns/ComposeDialog.tsx` (TIERS array, toast logic)
- `src/lib/campaigns/outbound.functions.ts` (email wrapper, validation, return shape)

No DB migration, no new packages, no changes to `CampaignsList`, the `outbound_campaigns` table or routing.
