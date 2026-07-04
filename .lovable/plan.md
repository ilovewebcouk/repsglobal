# Retire `/dashboard/profile`, fold its pieces into Verification + Website

## Brutal honest truth

You're right — `/dashboard/profile` is a vestigial page. Every card on it already has a better home:

| Card on `/dashboard/profile` today | Better home | Why |
| --- | --- | --- |
| **01 Identity** (legal name + profession) | `/dashboard/verification` | These ARE identity fields — legal name has to match your ID; profession is derived from the qualifications you upload. Users only touch them when Stripe or an admin flags a mismatch. Verification is where they'll look. |
| **02 Your pitch** (tagline + about) | `/dashboard/website` | Already there. `websites.tagline` + `websites.about` are what ship on `/c/$slug`. `professionals.headline` and `professionals.bio` are legacy duplicates. |
| **03 Specialisms** | `/dashboard/website` | Already there ("Specialisms" section in the website editor sidebar). |
| **04 Languages & socials** | `/dashboard/website` | Not there yet — needs to be added, but conceptually correct (both surface on `/c/$slug`). |

On the migration question — **there is nothing to migrate.** I checked:

- **333/333** pros already have `websites.about` populated.
- **333/333** pros already have `websites.tagline` populated.
- **0** pros have a `bio` that isn't already mirrored to `websites.about`.
- **149/333** have drift (someone edited one field but not the other). For these, **`websites.about` is already what ships publicly**, so nothing gets lost — we just stop letting the old copy get out of sync.

No data migration, no admin action needed.

## What to build

### 1. Move Identity into Verification

In `src/routes/_authenticated/_professional/dashboard_.verification.tsx`, add a new card at the top **above** the three trust steps:

- **Name & profession** — legal name (respecting `profile.legal_name_locked`), `EarnedTitlePicker` for profession.
- Uses the same `upsertMyDashboardProfile` server fn; no schema change.
- Small explainer: *"Your legal name must match your government ID and your qualification certificates. Profession is unlocked by the qualifications you upload below."*

### 2. Add the missing website surfaces

In the website editor, add three new sections to the sidebar so the field parity is complete before we delete the profile page:

- **Languages spoken** — reuse existing `LanguagePicker`.
- **Social links** — reuse existing `SocialLinksPicker`.
- **Contact phone** — small single input.

These write to the same `professionals` columns they always have (`languages`, `social_*`, `contact_phone`) — website editor becomes the sole editor for those columns. Each gets its own status pill in the completeness rail.

### 3. Delete `/dashboard/profile`

- Delete `src/routes/_authenticated/_professional/dashboard_.profile.tsx`.
- Remove "Public Profile" from `VERIFIED_NAV` and `PRO_NAV` in `src/components/dashboard/nav-data.ts`.
- Rewrite every remaining `to: "/dashboard/profile"` link:

  | Site | Currently points to `/dashboard/profile` | Repoint to |
  | --- | --- | --- |
  | `WelcomeBanner` "Finish profile" CTA | `/dashboard/profile` | `/dashboard/website` |
  | `NeedsAttention` "Polish" row | `/dashboard/profile` | `/dashboard/website` |
  | `NeedsAttention` "Publish" row | `/dashboard/profile` | `/dashboard/website` |
  | `CompletenessCard` "Edit profile" footer | `/dashboard/profile` | `/dashboard/website` |
  | `DashboardDemoContent` "View profile" | `/dashboard/profile` | `/dashboard/website` |
  | `TrustBlock` "Complete your profile" | `/dashboard/profile` | `/dashboard/verification` |
  | Reviews page CTA | `/dashboard/profile` | `/dashboard/website` |

### 4. Deprecate the legacy columns quietly

- `professionals.bio` and `professionals.headline` stay in the schema — old rows still hold data, and some public reads may still fall back to them — but nothing in the app writes to them any more.
- Audit which public reads still use them (`/c/$slug`, `/pro/$slug`, directory cards) and switch to `websites.about` / `websites.tagline` as the primary source with the legacy column as fallback. This is a one-file check and swap.

## Out of scope (say so if you want it added)

- The dashboard-home "Needs your attention" / "Profile completeness" merge from the previous message — I'll do that as a separate pass once this is landed, because the completeness score will need to be redefined against the new field homes.
- No SQL migration.
- No admin tool to reconcile the 149 drifted `bio` vs `about` rows — `websites.about` already ships, so silently keeping the newer copy is correct.

## Files touched

- `src/routes/_authenticated/_professional/dashboard_.verification.tsx` — add Name & profession card at top.
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` — add Languages / Socials / Contact phone sections and their sidebar entries.
- `src/components/dashboard/nav-data.ts` — remove "Public Profile" from both nav constants.
- `src/components/dashboard/hub/index.tsx`, `src/components/dashboard/DashboardDemoContent.tsx`, `src/components/dashboard/verification/TrustBlock.tsx`, `src/routes/_authenticated/_professional/dashboard_.reviews.tsx` — repoint links.
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx` — delete.
- Public-facing reads that still consume `professionals.bio` / `.headline` — one grep + swap.
