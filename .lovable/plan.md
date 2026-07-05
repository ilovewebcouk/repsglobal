
# Website editor — corrected launch plan

## Product rule (correction)

Trainers who exist publicly (verified / directory-visible) stay reachable at `/c/$slug` **even if their website is incomplete or unpublished**:

- Do NOT 404, blank, or hide `/c/$slug` when `published_snapshot` is null or sections are empty.
- Keep the existing placeholder/template scaffold (default service cards, default About, default hero) visible on the public page.
- Show a persistent, dismissible-per-session banner at the top of `/c/$slug` whenever the page is not 100% trainer-authored:
  - Copy: "Some content on this page is still template placeholder text and imagery. {FirstName} is finishing their REPs profile."
  - Visible to public visitors, NOT visible in the editor iframe preview (skipped when `?preview_token=…` is present) and NOT visible in the trainer's own dashboard preview.
  - Neutral styling (not a red error). Sits above the hero.
- Owner-viewing-own-page (auth.uid = professional_id) gets the SAME banner plus a "Finish your website" CTA linking to `/dashboard/website`.
- Reverts the previously-planned "remove live-draft fallback / return null" behaviour from P1-01. `getWebsiteBySlug` continues to fall back to live draft data + defaults, and the page renders.

## What "not 100%" means (banner trigger)

A pro is "incomplete" when any of the following holds (reuse `computeWebsiteSections`):

- `published_snapshot IS NULL`, OR
- Any of the 9 sections is `empty` or `partial`, OR
- `has_unpublished_changes = true` (after the P0-03 fix below actually starts tracking profile edits).

If all 9 sections are `done` AND a snapshot exists AND no unpublished changes → no banner.

## Security + integrity fixes (unchanged, still shipping)

### 1. Cross-tenant row hijack (P0-01)
`upsertMyService`, `upsertTransformation`, `upsertClientResult`, `upsertFaq` currently call `supabaseAdmin` and upsert by client-supplied `id`, letting an attacker overwrite another trainer's row.

Fix: switch each handler to `context.supabase` (the authenticated user's RLS-scoped client) so the existing `owner_all` policies enforce ownership. Where admin is genuinely needed (e.g. bypassing an audit trigger), first `select professional_id/user_id where id = data.id` and reject on mismatch before the upsert.

Files: `src/lib/website/website.functions.ts` (`upsertMyService`), `src/lib/website/website-content.functions.ts` (`upsertTransformation`, `upsertClientResult`, `upsertFaq`).

### 2. Open anon RLS policies (P0-02)
Migration:

- Drop `websites_public_read USING(true)`, `website_transformations_public_read USING(true)`, `website_client_results_public_read USING(true)`, `website_faqs_public_read USING(true)`.
- Replace with narrow policies:
  - `websites`: anon SELECT allowed only for `slug` + `published_snapshot` when a directory-visible pro exists; owner SELECT for `auth.uid() = professional_id`.
  - `website_transformations`, `website_client_results`: anon SELECT `USING (is_published = true)`.
  - `website_faqs`: add `is_published boolean NOT NULL DEFAULT true`, anon SELECT `USING (is_published = true)`.
- Add owner SELECT policies on all four so non-admin server clients can still read drafts.
- Add `websites_owner_select` (P1-15).
- Verify + top up Data API `GRANT`s for `authenticated` and `service_role` on all five tables (P1-16).

Because the public page keeps rendering scaffold + live drafts via the server fn (admin client), no public-facing regression from tightening RLS.

### 3. Dirty tracking for profile / location / specialisms / social edits (P0-03)
Add BEFORE INSERT/UPDATE/DELETE triggers that flip `websites.has_unpublished_changes = true` on the corresponding pro when any of these move:

- `professionals`: `specialisms`, `languages`, `contact_phone`, `social_instagram|tiktok|youtube|x|linkedin`, `in_person_available`, `online_available`, `trains_at_home_studio`, `trains_at_clients_home`, `headline`, `primary_profession`, `city`.
- `professional_locations` (any content column).
- `professional_gyms` (insert/delete).
- `profiles.avatar_url`.

Wire matching entries into `getMySectionDiff` so the sidebar / publish dialog surface these under `profile`, `location`, `specialisms`, `contact`, plus rewording per P1-14. Extend `discardMySectionChanges` (or explicitly document why these sections aren't discardable and hide the discard action for them per P2-20).

### 4. Trust item ID leakage (P0-04)
`fetchTrustSummary` in `src/lib/website/website.functions.ts` returns `items[].id` with real `certificate_number` / `policy_number`; these end up in `published_snapshot.website.trust.items[].id` and in the public DTO.

Fix: strip `items[].id` from `fetchTrustSummary`'s public return (keep it only when the caller is the owner, e.g. `getMyWebsite`). One-off data migration to null-out `published_snapshot -> 'website' -> 'trust' -> 'items' -> 'id'` on all existing snapshots.

### 5. Missing foreign keys (P0-05)
Migration adds:

```
ALTER TABLE public.websites               ADD FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
ALTER TABLE public.services               ADD FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE CASCADE;
ALTER TABLE public.website_transformations ADD FOREIGN KEY (user_id)         REFERENCES public.professionals(id) ON DELETE CASCADE;
ALTER TABLE public.website_faqs            ADD FOREIGN KEY (user_id)         REFERENCES public.professionals(id) ON DELETE CASCADE;
ALTER TABLE public.website_client_results  ADD FOREIGN KEY (user_id)         REFERENCES public.professionals(id) ON DELETE CASCADE;
```

(Precheck for orphans first; audit confirmed 0 orphans across 333 pros so cascade is safe.)

## Public page (`/c/$slug`) changes

- Keep the existing snapshot-or-live fallback in `getWebsiteBySlug`.
- Add `isPlaceholderContent` + `completionSummary` (sections total / done / partial / empty) to the DTO the public page consumes.
- Render a new `<TemplateContentBanner />` at the top of `src/routes/c.$slug.index.tsx` when `isPlaceholderContent` is true. Hidden when the request carries a valid preview token (editor iframe).

## Ship order

1. Migration bundle: RLS tightening (P0-02) + FKs (P0-05) + owner select (P1-15) + GRANT audit (P1-16) + faqs `is_published` column + dirty-tracking triggers (P0-03).
2. Server-fn changes: kill row hijack (P0-01) + strip trust IDs (P0-04) + extend `getMySectionDiff` for profile/location/specialisms/contact.
3. Public page: banner + `isPlaceholderContent` wiring; keep the live-draft fallback (do NOT do P1-01).
4. Editor UI: publish dialog copy update (P1-14), sidebar surfaces new dirty sections, hide discard where not applicable.

## Out of scope for this pass

- P1-01 "remove live-draft fallback" — explicitly cancelled by the product rule.
- All P1-02 → P2-* polish items; queued for a follow-up.
