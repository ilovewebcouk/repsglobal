## Brutal honest truth

The save fn, the avatar fn, and the cover fn are wired correctly. The reason "Save failed" appears and your avatar never lands is **not** the form, the schema, or RLS — it's the dev server.

When I deleted `dashboard_.verification.tsx` and `dashboard_.profile-edit.tsx` earlier, Vite cached a broken module graph that still tries to load the deleted file. Every `createServerFn` call is being SSR-routed through that broken graph and crashing with `h3 swallowed SSR error: {"status":500,"unhandled":true,"message":"HTTPError"}`. The toast just surfaces it as "Save failed."

Evidence:
- Your avatar file IS in storage (`avatars/49402cd7-…/avatar-1781245534370.png`) — the browser upload worked.
- `profiles.avatar_url` for your user is still `NULL` — proving the *server fn* that signs the URL and writes it never completed.
- Sandbox stderr is full of `Failed to load url …/dashboard_.verification.tsx` and `h3 swallowed SSR error: 500 HTTPError` — every server fn invocation 500s.
- `routeTree.gen.ts` on disk is already clean; only Vite's in-memory cache is stale. The previous "restart dev server" call didn't clear `node_modules/.vite`.

You're also right to kill the cover. We never designed a public surface that consumes `cover_url`, so it's dead weight in the editor.

## Plan

### 1. Force-clear the wedged Vite cache
- `rm -rf node_modules/.vite .vite dist .nitro` (whichever exist).
- Restart the dev server.
- Re-test one server fn (`getMyDashboardProfile`) and confirm SSR returns 200, not "HTTPError 500".

Without this step nothing else matters — every save will keep failing regardless of what we change.

### 2. Remove the cover photo feature entirely
Files:
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx`
  - Delete the cover image card / "Change cover" / "Remove cover" UI block.
  - Delete `coverMutation`, `saveCover`, `handlePickCover`, the `<img src={profile.cover_url}>` preview, and any "Cover photo" entry in the completion checklist (drop the denominator from 8 → 7 accordingly).
  - Stop importing `updateMyCover`.
- `src/lib/profile/dashboard-profile.functions.ts`
  - Delete `updateMyCover`.
  - Remove `cover_url` from the `DashboardProfile` type, from the `select(...)` list, and from the returned object in `getMyDashboardProfile`.
- DB: **leave the `cover_url` column in place** (dormant). Dropping a column needs a migration and approval; the column being unused is harmless. If you want it gone, say so and I'll add a `DROP COLUMN` migration.

### 3. Verify end-to-end as Demo Verified Pro
After the cache clear + cover removal:
- Sign in as `demo-pro@repsuk.org` (the account whose uid `49402cd7…` already has an avatar sitting in storage).
- Type in Full name + a few basic fields → click **Save changes** → expect green "Profile saved" toast, no 500 in sandbox log, and `profiles.full_name` / `professionals.*` updated in DB.
- Click **Change photo** → pick an image → expect "Profile photo updated" toast, signed URL written into `profiles.avatar_url`, and the avatar showing in the TopBar + sidebar footer immediately.
- Confirm there is no cover UI anywhere on the page.

### 4. Out of scope (next step, separately)
- Wiring the saved profile data through to the public `/pro/$slug` page.
- Admin verify → auto-publish loop.
- Re-adding cover photo later if we ever design a public surface that needs it.

## Technical notes
- Stale Vite cache is the actual root cause; the symptoms (Save failed, avatar not appearing) are both downstream of every server fn returning 500.
- `professionals` UPDATE RLS policy with the `is_published / verification / verification_status` subquery WITH CHECK is fine — the upsert doesn't touch those columns, so the locked values are preserved and the policy passes. No RLS change required.
- The `avatars` bucket is private; signed URLs are valid for 1 year. That's correct behaviour; no need to make the bucket public.
