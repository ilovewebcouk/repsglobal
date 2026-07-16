## Drop the FAQ storage cap

Remove the separate 8-row storage cap so there's only one number: the public publish cap (5). All FAQs stored are publishable.

### Changes

**`src/components/dashboard/organisation/ProviderFaqsSection.tsx`**
- Delete `maxRows` usage and the `atCap` (>= maxRows) check.
- Replace status line `"5 published · 5/8 total"` with `"5 of 5 published"` (using `publishedCount` / `maxPublic`).
- Disable "Add FAQ" / generation when `faqs.length >= maxPublic` (since every stored FAQ is intended to be publishable). Tooltip: "Publish cap reached — delete one first."
- Remove the `${maxRows}-FAQ cap` warning copy.

**`src/lib/provider-faqs/provider-faqs.functions.ts`** (server)
- Change the create/upsert guard from `maxRows` (8) to `maxPublic` (5) as the hard limit on total rows for that provider.
- Keep returning `maxPublic` in the list response; stop returning `maxRows` (or leave the field but the client ignores it).

### Out of scope
- No DB migration — existing rows above 5 (if any) stay; the guard only blocks new inserts beyond 5.
- No visual redesign of the FAQ panel.
- Any admin-side FAQ moderation UI.

### Verification
- Playwright: sign in as the demo verified account, open `/dashboard/profile`, screenshot the FAQ panel and confirm it reads "5 of 5 published" with a single cap message and no "5/8 total".
