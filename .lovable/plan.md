## Goal

On the provider dashboard home, let a training provider upload two images inline on the `WelcomeBanner`:

- **Logo** — replaces their avatar everywhere (dashboard chrome, `/find-a-training-provider` card, `/t/$slug` provider page logo chip).
- **Background** — used as the cover on the `/find-a-training-provider` card and as the hero background on `/t/$slug`.

Both are already stored in the DB (`professionals.avatar_url` and `websites.hero_image_url`) and rendered by those surfaces — this change is purely a new upload entry point on the dashboard home. No schema changes, no changes to directory or public page rendering.

## Scope

Provider accounts only (`accountType === "organisation"` / `tier === "training_provider"`). Trainer dashboard is untouched.

## UI

In `src/components/dashboard/hub/index.tsx`, extend `WelcomeBanner` (organisation branch only) so it becomes a shallow "cover card":

```text
┌──────────────────────────────────────────────────────────┐
│  [ background image or gradient placeholder ]            │
│  ┌──────┐                                                │
│  │ LOGO │  Provider name           [ Edit branding ▾ ]   │
│  │  ⇧   │  Training provider                             │
│  └──────┘                                                │
└──────────────────────────────────────────────────────────┘
```

- The cover fills the banner background at ~160px tall, with the existing dark wash on top so text stays legible.
- The logo sits in a rounded-[16px] tile bottom-left, overlapping the cover edge, with an "Upload" hover overlay (camera icon).
- "Edit branding" opens a small popover with two rows — **Logo** and **Background** — each with Upload / Replace / Remove.
- Empty state: cover shows the current gradient; logo tile shows initials + camera hint. Copy: "Add a logo and cover so your provider card stands out."

No changes to the trainer WelcomeBanner branch.

## Wiring

Reuse existing server functions — no new endpoints:

- **Logo** → `updateMyAvatar` in `src/lib/profile/dashboard-profile.functions.ts` (writes to `avatars` bucket + `professionals.avatar_url`). This is the same fn the profile editor already uses.
- **Background** → `uploadHeroFromBase64` in `src/lib/website/hero.functions.ts` (writes to `website-hero` bucket + `websites.hero_image_url`). Same fn the website editor uses.

Both accept base64; the new component will read the file with `FileReader.readAsDataURL`, validate type (`image/jpeg|png|webp`) and size (≤5 MB), then call the server fn via `useServerFn` + `useMutation` and invalidate `["dashboard-status"]` and the directory queries.

Remove flow: for both fields, set the DB column to `null` via a tiny new server fn (or reuse an existing "clear" path if one exists — will confirm on implementation).

## Files touched

- `src/components/dashboard/hub/index.tsx` — extend the organisation branch of `WelcomeBanner`; add a `ProviderBrandingEditor` subcomponent (popover + two `ImageUploadTile`s).
- `src/components/dashboard/organisation/DashboardHome.tsx` — pass `logoUrl` and `coverUrl` (from `data.identity.avatar_url` and existing website hero, already fetched by `useHubData`) into `WelcomeBanner`. Add a `websiteHero` fetch to `useHubData` if it isn't already there.
- No route, schema, RLS, or public-page changes.

## Out of scope

- Trainer dashboard uploads.
- Any redesign of `/t/$slug` or the directory card.
- AI logo/cover generation (existing `generateHeroFromAi` stays where it is, in the website editor).
- Cropping UI — v1 uses the raw upload; the existing `object-cover` on the consuming surfaces handles framing.
