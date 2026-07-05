## Diagnosis

The database triggers we added last turn do correctly flip `websites.has_unpublished_changes = true` when you edit `professionals` fields (specialisms, socials, `trains_at_home_studio`, `trains_at_clients_home`), `professional_locations` (postcode/cities), `professional_gyms`, `profiles.avatar_url`, `services`, `website_transformations`, `website_client_results`, `website_faqs`.

The UI does NOT reflect that because the "All changes published" pill reads from the React Query `["my-website-publish-state"]` query, and it is only invalidated in three places today:

1. `saveMutation` (basics/tagline/subtitle/about/hero) — invalidates it.
2. `publishMut` and `discardMut` — invalidate it.
3. A `useEffect` in `dashboard_.website.tsx:545` that fires when `contentQuery.dataUpdatedAt` or the `website` fetcher's `updatedAt` changes.

Every other mutation only invalidates its own domain query and never touches the publish-state or section-diff caches. So the DB row is dirty, but the browser never re-fetches it. Impacted mutations we've already spotted:

- `trainingBaseMut` (Home / private studio, Client's home / mobile toggles) — invalidates only `["my-dashboard-profile"]`.
- `postcodeMut` (primary postcode) — invalidates only `["my-primary-location"]`.
- Cities-you-cover save (in `WhereITrainPanel`) — same pattern.
- `GymPicker` add/remove — invalidates only `["my-professional-gyms"]`.
- Profile-side edits routed through this editor (avatar, socials, specialisms, languages, phone) — invalidate only their own queries.
- `reorderServicesMut` / `deleteServiceMut` / `upsertServiceMut` — some invalidate `contentQuery` (which retriggers the effect), some don't; `section-diff` is never invalidated directly.

Same class of bug affects the "Unpublished changes since last publish" banner, the sidebar per-section dot, and the publish dialog's changed-section list — they all read `publish-state` + `section-diff` and are stale.

Nothing needs to change in the migration; the fix is purely front-end cache invalidation.

## Plan

Front-end only. No schema, no server-fn signature changes.

1. **Add a shared invalidator hook** at `src/lib/website/useMarkWebsiteDirty.ts`:
   - `useMarkWebsiteDirty()` returns a function that invalidates `["my-website-publish-state"]`, `["my-website-section-diff"]`, and (optionally) forces a refetch of `["my-dashboard-website-full"]`.
   - Also bumps a lightweight `["my-website-local-dirty"]` counter set to a monotonic value so the pill can flip to "Unpublished changes" optimistically, before the server round-trip completes.

2. **Wire it into every mutation** in the editor that hits a trigger-covered table. Concretely append it to `onSuccess` of:
   - `dashboard_.website.tsx`: `saveMutation`, `upsertServiceMut`, `reorderServicesMut`, `deleteServiceMut`, `trainingBaseMut`, `postcodeMut`, plus any other panel-local mutations in the same file (draftTagline/draftAbout only if they write; skip pure-preview drafts).
   - `WhereITrainPanel` / cities save + `GymPicker` add/remove (both live in this route file today per grep — same list).
   - `PillarEditDialog`, `ResultEditDialog`, `FaqEditDialog` save/delete handlers — call the invalidator on success.
   - Any specialisms/languages/socials/phone/avatar editor invoked from the website page — trace and add. Where the editor lives outside `/dashboard/website` (e.g. shared profile editor), only wire it when called from this route by passing an `onSaved` callback prop; do NOT globally alter the profile editor's own invalidation.

3. **Harden the queries themselves** so a missed call site can't leave the pill wrong for long:
   - `["my-website-publish-state"]` and `["my-website-section-diff"]`: set `staleTime: 0`, `refetchOnWindowFocus: true`, `refetchOnMount: "always"`.
   - Keep the existing effect at `dashboard_.website.tsx:545` but broaden its deps to include the local-dirty counter from step 1.

4. **Isolate `isDirty`** so the pill/publish CTA flip immediately:
   - `const isDirty = basicsDirty || !!publishState?.has_unpublished_changes || localDirtyCount > lastPublishedDirtyCount;`
   - Reset the local counter inside `publishMut.onSuccess` and `discardMut.onSuccess`.

5. **Verification pass** (no code):
   - Toggle Home / private studio → pill flips to "Unpublished changes" within one paint.
   - Toggle Client's home / mobile → same.
   - Add a city → same.
   - Add/remove a gym → same.
   - Edit socials / specialisms / avatar / phone from anywhere reachable from this editor → same.
   - Publish → pill returns to "All changes published"; discard → same.
   - Refresh the page mid-edit → publish-state fetched from DB now shows dirty (already correct via triggers).

## Out of scope

- Any change to migrations, triggers, RLS or server functions.
- Rewriting the profile editor's own cache keys.
- Snapshot / section-diff shape changes beyond invalidation.
