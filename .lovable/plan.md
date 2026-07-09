# Admin Provider 360 — parity with Trainer 360

Make the org branch of `/admin/members/$userId` structurally **identical** to the trainer branch, and make the Profile tab **mirror the training-provider dashboard front-end 1:1**, backed by writes to the exact same DB columns the provider themselves save to.

Backend/admin-only. No front-end changes, no design-token changes, no pricing/verification-workflow changes.

## The core problems being fixed

1. **View-as missing** on provider 360 → org branch uses a custom header instead of the trainer `StickyHeader`.
2. **Profile fields are wrong.** Admin edits `headline / value_prop / bio / staff_count / year_established / company_number / cover_url / awarding_bodies / website / …` — none of which the front-end profile page (`ProviderProfilePage`) reads or writes. Provider dashboard uses only: **tagline, about, website_url, contact_email, contact_phone, address, social_{instagram,linkedin,youtube,tiktok,x}**.
3. **`tagline` and `about` live on `websites`, not `professionals`.** Admin currently writes them to `professionals.bio` etc — silently disconnected from public output. This is the biggest bug.
4. **Names & domains tab** duplicates the change-request queue. Admins override, they don't request.
5. **Billing and Activity** are custom for providers, breaking parity with trainer 360.

## Tab set (locked, matches trainer 360)

Order — Overview / Billing / Verification / Profile / Reviews / Activity / Sessions / Notes.
No Names-and-Domains tab. No Danger tab — Suspend / Republish / Close move into the header actions bar next to View-as (same location the trainer 360 uses for lifecycle actions).

## Route changes — `src/routes/admin_.members_.$userId.tsx`

- Remove the early-return org branch that mounts `<ProviderMemberView />`.
- Extend the existing `StickyHeader` with a small `isProvider` branch: name = `business_name`, public URL prefix = `/t/{slug}`, add a "Training provider" chip, and expose Suspend / Republish / Close actions inline (calls `suspendProvider` / `republishProvider` / `closeProvider`). Everything else — avatar, View-as button, back nav, verification pill, published pill — stays identical.
- Tab list is the same for individuals and orgs. Content of Overview / Billing / Verification / Reviews / Activity / Sessions / Notes is shared. Only **Profile** branches:
  - Individual → existing `SoonEmpty` (unchanged).
  - Organisation → new `<ProviderProfileMirror userId snapshot />`.

## New component — `src/components/admin/providers/ProviderProfileMirror.tsx`

Mirrors `src/components/dashboard/organisation/ProviderProfilePage.tsx` **section-for-section, field-for-field**:

- **Identity** — Provider name row with "Rename (admin override)" button → opens rename dialog → calls existing `renameProvider` (bypasses `provider_name_requests`; slug regen + `legacy_redirects` continue to work). Shows current `business_name`, current `/t/{slug}`, and any pending name request (read-only badge).
- **About** — `tagline` (max 160), `about` (max 800). Writes to `websites` table.
- **Contact** — `website_url`, `contact_email`, `contact_phone` (E.164), `address` (autocomplete). Writes to `professionals`.
- **Social** — 5 handles (Instagram, TikTok, YouTube, LinkedIn, X). Writes to `professionals`.
- Domain/email-lock UI: admin sees the same lock indicator the provider sees, but with a "Override lock" toggle (checkbox) that unlocks the input. Overrides are audited.
- Single "Save changes" button matching the dashboard's dirty-tracking + toast pattern.
- Provider name is NOT part of the save button — always a dedicated dialog action.

## New server function — `src/lib/admin/providers.functions.ts`

`adminUpdateProviderProfileMirror({ userId, patch })`:
- Zod-validated patch limited to: `tagline, about, website_url, contact_email, contact_phone, address, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x` (+ `override_domain_lock?: boolean`, `override_email_lock?: boolean`).
- Auth: `requireSupabaseAuth` + `has_role('admin')`.
- Reads `professionals` + `websites` before → applies patch:
  - `tagline`, `about` → upsert `websites` (professional_id keyed).
  - Everything else → update `professionals`.
- If `website_url` or `contact_email` changes while their domain-verification lock is on, require the matching override flag; if provided, mark the domain verification record accordingly (or write an audit note) so provider sees the correct state on next load.
- Single audit row: `provider.profile_update` with before/after diff.
- Loaded via `await import("@/integrations/supabase/client.server")` inside handler.

The existing `updateProviderField` stays for now (used nowhere after this change) — deleted in cleanup step.

## Files edited

- `src/routes/admin_.members_.$userId.tsx` — remove org early return; extend `StickyHeader` (View-as + org fields + Suspend/Republish/Close for orgs); branch only inside the Profile tab.
- `src/lib/admin/providers.functions.ts` — add `adminUpdateProviderProfileMirror`; remove `updateProviderField` and its whitelist.
- `.lovable/plan.md` — mark parity pass complete.

## Files created

- `src/components/admin/providers/ProviderProfileMirror.tsx` (mirrors `ProviderProfilePage.tsx` layout, admin save path).

## Files deleted

- `src/components/admin/providers/ProviderMemberView.tsx` (replaced by shared route body).
- `src/components/admin/providers/ProviderProfileTab.tsx` (replaced by mirror).
- `src/components/admin/providers/ProviderBillingTab.tsx` (Billing uses trainer `BillingPane`).
- `src/components/admin/providers/ProviderActivityTab.tsx` (Activity uses trainer `ActivityPane`).
- `src/components/admin/providers/ProviderNameHistoryTab.tsx` (no Names & domains tab).
- `src/components/admin/providers/ProviderDangerTab.tsx` (actions move into header).

Kept: `ProviderVerificationTab.tsx` **only if** the trainer `VerificationPane` doesn't cover org-specific fields — verified during build. If trainer pane suffices, delete this too.

## Build order

1. Read `ProviderProfilePage.tsx` end-to-end + `updateMyProviderProfile` to lock the exact field list + validators.
2. Add `adminUpdateProviderProfileMirror` server fn with audit + override flags.
3. Build `ProviderProfileMirror.tsx` (visual parity with `ProviderProfilePage`).
4. Edit `StickyHeader` to handle `isProvider` case (name/slug/URL/chip + Suspend/Republish/Close actions).
5. Collapse the org early-return in the route; branch only inside Profile tab.
6. Delete the six replaced components; verify no imports remain.
7. Delete `updateProviderField` + its whitelist.
8. Typecheck; QA against acceptance list.

## Acceptance tests

1. `/admin/members/<org-id>` shows the SAME header shape as `/admin/members/<individual-id>`: avatar, name, verification pill, published pill, back arrow, and a **View-as button that opens `/dashboard` impersonating the provider**.
2. Tab list is exactly Overview / Billing / Verification / Profile / Reviews / Activity / Sessions / Notes, in that order, for both individuals and orgs.
3. Provider Profile tab renders four sections in order: **Identity, About, Contact, Social** — matching `ProviderProfilePage` section headings and hint copy.
4. Provider Profile fields = { `tagline, about, website_url, contact_email, contact_phone, address, social_instagram, social_linkedin, social_youtube, social_tiktok, social_x` }. Zero extra fields (`headline`, `value_prop`, `bio`, `staff_count`, `year_established`, `company_number`, `cover_url`, `awarding_bodies`, `website` non-URL are gone).
5. Editing `tagline` in admin then reloading `/dashboard/profile` as the provider (or `getMyProviderProfile`) reflects the new value — proves parity with the front-end's write path (`websites` table).
6. Editing `contact_email` in admin then reading `professionals.contact_email` shows the update; admin audit log has `provider.profile_update` with before/after including that field.
7. Rename (admin override) writes `profiles.business_name`, regenerates `professionals.slug`, inserts `legacy_redirects`, and audits `provider.rename` — **without** creating a `provider_name_requests` row.
8. Domain-locked website field shows the lock indicator; toggling "Override lock" enables the input; saving writes the new URL and audits the override.
9. Billing tab on an org renders the same `BillingPane` used for individuals (Stripe subscription card, product/price, renewal, invoices) — no bespoke provider billing UI.
10. Activity tab on an org renders the same `ActivityPane` timeline used for individuals.
11. Suspend / Republish / Close actions are reachable from the header actions bar (dropdown) on an org, not from a separate Danger tab. Each requires the same reason/notes as before and audits identically.
12. `/admin/members/<org-id>?tab=names` does not exist; direct-navigating there falls back to Overview.
13. `rg -n "updateProviderField|ProviderMemberView|ProviderProfileTab|ProviderBillingTab|ProviderActivityTab|ProviderNameHistoryTab|ProviderDangerTab" src/` returns zero hits after cleanup.
14. Typecheck passes; no unused imports left behind.
15. Unchanged surfaces: pricing, public `/t/*` pages, dashboard/portal layouts, close-membership worker, provider verification workflow, `regenerateProviderSlug`, RLS, design tokens.

Verdict target: 10/10 — one 360, one Profile that actually writes what the provider sees.
