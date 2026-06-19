I was wrong earlier: the profile editor does have an AI headshot validation and crop flow, plus AI portrait regeneration. The gap is that featured cards only consume `profiles.avatar_url`, so they can display any existing/migrated avatar without knowing whether it came through that QA path.

Plan:

1. **Centralise the avatar QA model**
   - Add explicit avatar/headshot metadata to the backend profile data model, e.g. approval status/category/reason, face box/crop metadata, quality score, and whether the image is AI-generated.
   - Preserve the existing `avatar_is_ai_generated` flag.

2. **Update the existing profile upload flow**
   - When `validateAvatar` accepts a photo, persist the AI result and face-box/crop metadata alongside the committed avatar.
   - When it rejects a photo, persist/return the rejection reason as it does now.
   - When AI portrait regeneration is accepted, mark it approved and AI-generated.
   - When a photo is removed, clear the avatar QA metadata.

3. **Apply the same rule to featured cards and directory surfaces**
   - Update `getFeaturedPros`, `getFeaturedProIds`, and the city/profession/home featured-card data path so featured cards only use photos whose avatar QA status is approved.
   - Keep the current fallback image only for static demo/fallback cards; live cards should not use unapproved user photos.
   - Update the public directory search/card path consistently where it renders the same profile avatars.

4. **Keep card alignment consistent with the profile crop**
   - Because uploaded photos are already cropped to a square JPEG using the AI face box, keep the card image square but stop relying on arbitrary `object-top` as the “fix”.
   - Use the processed/approved avatar as the source of truth so city/profession cards inherit the same headshot crop.

5. **Handle migrated legacy photos carefully**
   - Legacy `bd_member_seed.profile_photo_status = 'ok'` exists, but the current app code does not show the AI classifier that set it.
   - Treat existing/migrated avatars without new QA metadata as not eligible for live featured-card headshots unless explicitly marked approved/backfilled by a migration/admin pass.

6. **QA checks after implementation**
   - Verify the dashboard profile photo flow still validates, crops, commits, removes, and regenerates.
   - Verify `/in/$location`, `/professions/$profession`, homepage featured cards, and `/find-a-professional` no longer surface unapproved live avatars as featured headshots.
   - Confirm the REPs Verified badge-only card change remains intact.