# Profile Gallery Photos — end to end

Right now the "12 photos" badge on `/pro/$slug` is hardcoded and the only real image on the profile is the single avatar/portrait (`pro.image`). There is no separate "hero/cover" — the portrait *is* the cover. So the plan treats the portrait as a standalone field and the gallery as a new, separate collection of additional photos.

## 1. Database & storage

Migration:

- New table `public.professional_photos`
  - `id uuid pk`, `professional_id uuid → professionals(id) on delete cascade`
  - `storage_path text not null` (object key in the bucket)
  - `sort_order int not null default 0`
  - `width int`, `height int`, `byte_size int`, `mime_type text`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - indexes on `(professional_id, sort_order)`
- GRANTs for `authenticated` + `service_role`; `anon` SELECT (public read for profile pages)
- RLS:
  - `select` to `anon`+`authenticated` (gallery is public)
  - `insert/update/delete` only where `professional_id = auth.uid()` (or admin via `has_role`)
- New storage bucket `pro-photos` (public read)
- `storage.objects` policies:
  - public `select` for `bucket_id = 'pro-photos'`
  - `insert/update/delete` where first path segment = `auth.uid()::text`

## 2. Tier limits

- Verified: 3 gallery photos
- Pro / Studio: unlimited (soft cap 50 in UI)
- Enforced in the upload server function via `has_active_tier` + a count query. UI also disables the upload button when at cap and shows an upgrade nudge for Verified.

## 3. Server functions (`src/lib/profile/photos.functions.ts`)

- `listMyPhotos()` — `requireSupabaseAuth`, returns rows for the signed-in pro
- `createPhotoUploadUrl({ filename, mimeType })` — `requireSupabaseAuth`
  - checks tier + current count vs limit
  - generates a path `<userId>/<uuid>.<ext>` and returns a signed upload URL via `supabase.storage.from('pro-photos').createSignedUploadUrl(...)`
- `registerUploadedPhoto({ storage_path, width, height, byte_size, mime_type })` — inserts the row, appended to end of `sort_order`
- `reorderPhotos({ orderedIds })` — `requireSupabaseAuth`, bulk update of `sort_order`
- `deletePhoto({ id })` — removes row + storage object

## 4. Public read path

Extend `public-profile.functions.ts` (`getPublicProfileBySlug`):

- Join/select `professional_photos` ordered by `sort_order`
- Map into `pro.gallery: { id, url, width, height }[]` where `url` is the public storage URL
- Wire `pro.gallery.length` into the portrait badge in `pro.$slug.index.tsx` (line ~454) — hide the badge entirely if `length === 0`

## 5. Public profile lightbox

In `pro.$slug.index.tsx`:

- Make the portrait + badge clickable → opens a shadcn `Dialog` lightbox containing the portrait (`pro.image`) followed by every `pro.gallery` photo
- Lightbox: full-bleed image, prev/next buttons, keyboard arrows, thumbnail strip, photo counter `n / total`, close button
- Pure presentation, no auth required

## 6. Dashboard photo manager

New route: `src/routes/_authenticated/dashboard/photos.tsx` (and a link in the existing dashboard sidebar where Profile lives):

- Grid of current photos with drag-to-reorder (using `@dnd-kit` if already installed, otherwise simple ↑/↓ buttons — confirmed during build)
- "Add photos" button: opens file picker, uploads via signed URL, then calls `registerUploadedPhoto`
- Per-tile delete (confirm dialog)
- Tier banner at top: "Verified: 3 of 3 used — upgrade to Pro for unlimited photos" with link to `/pricing`
- Client-side validation: jpeg/png/webp, max 8 MB, min 800×800

## 7. Out of scope (this pass)

- AI moderation / EXIF stripping (note for later)
- Pro can swap their main portrait photo (`profiles.avatar_url`) — that flow already lives elsewhere; we just feed `pro.gallery` into the new lightbox

## Verification

- Build passes
- `/pro/katie-gibbs` shows correct real count (or no badge if 0), portrait click opens lightbox
- Dashboard upload → photo appears on public profile after refresh
- Verified pro blocked at 3 uploads with upgrade CTA; Pro/Studio unlimited
- Delete removes row + storage object
