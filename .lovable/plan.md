## Goal

Add a **Profile** sidebar item to the training-provider dashboard where providers edit their identity, contact, company, socials, and public description in one place.

## Sidebar

`src/components/dashboard/nav-data.ts` — add to `TRAINING_PROVIDER_NAV` under the "Account" group, just under Dashboard:

```
{ icon: Building2, label: "Profile", to: "/dashboard/profile" }
```

## Route

New: `src/routes/_authenticated/_professional/dashboard_.profile.tsx` — provider-only route that renders a new `ProviderProfilePage` component inside `DashboardShell tier="training_provider" active="Profile"`.

## Page component

New: `src/components/dashboard/organisation/ProviderProfilePage.tsx`. Single form using shadcn `FieldGroup` / `Field` primitives, grouped into cards:

1. **Identity** — Provider name (`profiles.business_name`), Logo upload (`profiles.avatar_url`), Hero image upload (`websites.hero_image_url`).
2. **About** — Public description / About (`websites.about`, textarea, multi-line, ~2000 chars), Tagline (`websites.tagline`).
3. **Contact** — Website URL (new), Contact email (new), Telephone (`professionals.contact_phone` via `PhoneField`).
4. **Company** — Year established (new, integer 1800–current year), Company number (new, optional string).
5. **Socials** — Instagram, LinkedIn, YouTube, TikTok, X — reuse existing `professionals.social_*` columns via `SocialHandleInput`.

Loading + saving is done through one new server-fn module:

- `src/lib/profile/provider-profile.functions.ts` with `getMyProviderProfile` + `updateMyProviderProfile` (`requireSupabaseAuthWithImpersonation`). Reads/writes across `profiles`, `professionals`, and `websites` in one call. Reuses the existing `uploadAvatarFromBase64` and hero upload helper for image handling.

## Data model

New migration adds the missing columns (all nullable):

- `professionals.website_url text`
- `professionals.contact_email text` (public-facing, distinct from auth email)
- `professionals.year_established smallint`
- `professionals.company_number text`

Add a `CHECK` on `year_established` (1800 ≤ x ≤ extract(year from now())) and a light regex check on `website_url` (`^https?://`). No new GRANTs needed — existing `professionals` grants + RLS cover it.

## Public surface

Wire the new fields into `getWebsiteBySlug` / `WebsiteDTO` so `/t/$slug` can render website URL, contact email, phone, year established, and company number in the provider footer/about area. (Rendering polish can follow — this plan focuses on the editor.)

## Out of scope

- Redesigning the public `/t/$slug` page beyond exposing the new fields.
- Any changes to trainer (non-provider) profile editing.
- Domain verification flow (already exists on Verification page).
