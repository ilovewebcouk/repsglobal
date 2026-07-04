# Website Editor — Full QA & Audit (final sweep)

_Date: 2026-07-04. Read-only audit. Companion file: `docs/website-editor-fix-list.md` (prioritised P0/P1/P2 backlog)._

## 0. TL;DR

The Website editor is architecturally coherent — a single `websites.published_snapshot` JSON blob is the source of truth for the public `/c/$slug` page, live rows drive the editor, and a per-section diff powers publish/discard. That skeleton works.

Underneath, the audit surfaced **three P0-class issues that ship today**:

1. **Cross-tenant hijack via `upsertMyService` / `upsertTransformation` / `upsertFaq` / `upsertClientResult`.** The service-role handler accepts an arbitrary `id` from the client and upserts by primary key with `professional_id: userId` in the payload. If an attacker submits another trainer's row id, Postgres overwrites that row's ownership and content. RLS is bypassed because the handler uses `supabaseAdmin`.
2. **`websites_public_read` / `website_transformations_public_read` / `website_client_results_public_read` / `website_faqs_public_read` all use `USING (true)`.** With the anon key you can `SELECT` every trainer's `published_snapshot`, draft-only `about`/`hero_image_url`/`method_*`, `has_unpublished_changes`, unpublished transformations, unpublished results, and every FAQ. The publish gate is enforced only inside server functions, not in RLS.
3. **Publish snapshot silently goes stale.** Only edits to the `websites` / `services` / `website_transformations` / `website_faqs` tables flip `has_unpublished_changes`. Every other editor surface — specialisms, delivery mode, languages, phone, social links, avatar, headline, primary profession, delivery availability, location — writes to `professionals` / `profiles` / `professional_locations`. Those writes propagate live to `/c/$slug` (until snapshot is served) with **no dirty flag, no publish button, no confirm dialog**.

Plus two structural gaps that amplify the above:

4. **Zero foreign keys** on `websites`, `services`, `website_transformations`, `website_faqs`, `website_client_results`. Ownership is enforced only by the app layer. There is no `ON DELETE CASCADE`, no referential integrity, no orphan protection if a `professionals` row is ever deleted.
5. **`published_snapshot` is served through a public-read policy AND embeds trust items with `certificate_number` and `policy_number`.** Even the intended public read leaks specific credential IDs of every verified pro.

Live DB probe on 333 pros:
- 331/333 have never published (`published_snapshot IS NULL`); 2 have a snapshot; **0 have `has_unpublished_changes = true`** — the flag never lights up because none of the write paths that matter touch `websites`.
- Only 1 pro has a hero image; 1 has a subtitle. The Basics section is empty across almost the whole base.
- 0 transformations, 0 client results across 333 pros. Results/FAQs sections are unused at scale.
- 332/333 pros sit at exactly 3 services (auto-seeded from `DEFAULT_SERVICE_CARDS`). Only 1 pro edited beyond the seed.
- 0 orphan rows in any table (only because no pro has been deleted yet — nothing structural prevents it).

Everything else is P1/P2 polish; the three P0s and two structural gaps above are the real story.

---

## 1. Scope + surface

### Front-end

| File | LOC | Role |
|---|---|---|
| `src/routes/_authenticated/_professional/dashboard_.website.tsx` | 2 322 | The whole editor route: all 9 sections, dialogs, save/publish/discard wiring, section-status computation. |
| `src/components/dashboard/website/WebsiteEditorLayout.tsx` | 388 | Two-column shell (editor + live iframe preview). |
| `src/components/dashboard/website/WebsiteSectionsSidebar.tsx` | 286 | Sidebar with 9 sections, status pill, dirty dot, per-section discard, Publish button. |
| `src/components/dashboard/website/PublishConfirmDialog.tsx` | 111 | Publish confirm with per-section diff summary. |
| `src/components/dashboard/website/FaqEditDialog.tsx` | 263 | FAQ add/edit with unsaved-changes guard. |
| `src/components/dashboard/website/PillarEditDialog.tsx` | 188 | Method pillar add/edit. |
| `src/components/dashboard/website/ResultEditDialog.tsx` | 341 | Client result add/edit + image editor. |
| `src/components/dashboard/website/FieldCounter.tsx` | 31 | Character counter primitive. |
| `src/components/dashboard/HeroImageEditor.tsx` | 457 | Upload / AI / URL → cropper → base64 upload for hero. |
| `src/lib/dashboard/website-sections.ts` | 161 | Pure section-status compute (shared with dashboard). |
| `src/lib/dashboard/readiness.functions.ts` | 288 | Weighted readiness rollup (Website 50 / Verification 30 / Education 20). |

### Back-end

| File | LOC | Role |
|---|---|---|
| `src/lib/website/website.functions.ts` | 879 | `getMyWebsite`, `getWebsiteBySlug` (public read w/ snapshot gate), `upsertMyWebsite`, `upsertMyService`, `deleteMyService`, default-service seeding, DTO shape. |
| `src/lib/website/website-content.functions.ts` | 549 | Method / venues / results / faqs CRUD + AI drafts (tagline / subtitle / about / method / faqs). |
| `src/lib/website/publish.functions.ts` | 487 | `publishMyWebsite`, `getMyPublishState`, `getMySectionDiff`, `discardMySectionChanges`, `getMyPreviewToken`. |
| `src/lib/website/hero.functions.ts` | 177 | Base64 hero upload + Lovable AI Gateway (`google/gemini-3-pro-image`) with likeness + style anchor. |
| `src/lib/website/service-image.functions.ts` | 153 | Same as hero, square 1:1. |
| `src/lib/website/transformation-image.functions.ts` | 35 | Transformation image upload. |
| `src/lib/website/preview-token.server.ts` | 49 | HMAC-SHA256 signed preview token (4 h TTL) using `WEBSITE_PREVIEW_SECRET`. |
| `src/lib/website/default-services.ts` | 68 | 3 seed service cards used on first-time editor open. |

### Data layer (verified)

| Table | Cols | RLS policies |
|---|---|---|
| `websites` | 20 | 4 (`admin_all`, `owner_insert`, `owner_update`, `public_read USING(true)`). **No owner SELECT policy.** |
| `services` | 17 | 4 (`admin_all`, `owner_all`, `owner_read`, `public_read USING(is_published)`). Correctly gated. |
| `website_transformations` | 13 | 2 (`owner_all`, `public_read USING(true)`). **Leaks unpublished.** |
| `website_faqs` | 8 | 2 (`owner_all`, `public_read USING(true)`). No `is_published` column, so intent unclear. |
| `website_client_results` | 9 | 2 (`owner_all`, `public_read USING(true)`). **Leaks unpublished.** |

Storage buckets: `website-hero`, `website-services`, `website-results` — all public reads, owner writes/deletes scoped by `folder = auth.uid()::text`. Buckets are correct.

Triggers: 10 dirty-mark triggers cover only the four snapshot-tracked tables. `mark_website_dirty_self` (BEFORE UPDATE on `websites`) correctly ignores changes to publish bookkeeping columns and only flips the flag when a real content column moved (verified via `pg_proc`).

**Foreign keys: 0.** None of the five tables have a FK on `professional_id` / `user_id`.

---

## 2. Section-by-section rubric (all 9, equal depth)

Each section uses the same 10-part rubric.

### 2.1 Profile photo (`section id = "profile"`)

1. **Purpose.** Trainer's headshot on the public page (top-left, above the hero copy on the mobile crop, top of the enquire card).
2. **DB shape.** `profiles.avatar_url` (text, nullable). Not owned by any website table.
3. **RLS + GRANTs.** `profiles` policy set is out of scope but writes go through `updateMyDashboardProfile`.
4. **Read path.** `getMyDashboardProfile` populates `profileQuery`, its `avatar_url` feeds `computeWebsiteSections({ hasAvatar })`.
5. **Write path.** `ProfilePhotoPanel` (external component) uploads avatar and PATCHes `profiles`.
6. **Dirty detection.** **None.** Avatar changes do not touch `websites` → `has_unpublished_changes` stays where it was → not surfaced in `getMySectionDiff`.
7. **Discard-to-snapshot.** Not applicable (photo not in snapshot). Correct.
8. **Publish snapshot.** `published_snapshot.website.avatar_url` freezes at publish time. Post-publish avatar swaps are invisible on the public page until republish (silent staleness).
9. **UI states.** Section rule: `hasAvatar ? "done" : "empty"`. No "partial". Simple.
10. **Edge cases.** Blank avatar shows initials monogram on the public page. HEIC uploads handled by browser file input.

### 2.2 Website basics (`basics`)

1. **Purpose.** Tagline (H1), subtitle (H2 lede), About (2-paragraph bio), hero image (portrait 9:16).
2. **DB shape.** `websites.tagline`, `subtitle`, `about`, `hero_image_url` (all text/nullable).
3. **RLS + GRANTs.** `websites_owner_update`, `owner_insert` gate writes. Reads go through `websites_public_read USING(true)` — a raw anon SELECT returns tagline/subtitle/about/hero even when the trainer hasn't published, plus every other column including `has_unpublished_changes` and the full `published_snapshot`. **P0 leak (§4.2).**
4. **Read path.** `getMyWebsite` server fn (admin client) hydrates the section.
5. **Write path.** `upsertMyWebsite` with `WebsiteUpsertSchema` (Zod validates URL for `hero_image_url`, hex for `accent_hex`, enums for `layout_variant` / `theme`, 200-char cap tagline/subtitle, 4 000-char cap about). Uses `supabaseAdmin.from("websites").upsert(...)` — safe: `professional_id` fixed from `context.userId`, and PK conflict is on `professional_id` so no row-hijack vector here.
6. **Dirty detection.** ✓ `mark_website_dirty_self` catches these fields. Client-side `basicsDirty` compares local state to fetched values.
7. **Discard-to-snapshot.** ✓ `discardMySectionChanges({section: "basics"})` restores tagline/subtitle/about/hero from snapshot. Correct.
8. **Publish snapshot.** ✓ Basics live inside `published_snapshot.website`.
9. **UI states.** All 4 fields present = "done", 0 = "empty", 1-3 = "partial". Live probe: 1/333 pros have hero, 1/333 have subtitle → section is universally "partial/empty".
10. **Edge cases.** AI drafts (`aiDraftTagline`, `aiDraftSubtitle`, `aiDraftAbout`) never commit — trainer must Save. Hero upload cap 2 MB after encoding, 20 MB source. URL mode does client-side `fetch(url)` — will fail on any CORS-locked host with a bare "Couldn't fetch that URL" toast. No orphan-cleanup on hero replacement — old file stays in `website-hero` bucket forever.

### 2.3 Specialisms (`specialisms`)

1. **Purpose.** The trainer's specialism chips (public page + directory filter).
2. **DB shape.** `professionals.specialisms text[]`.
3. **RLS + GRANTs.** Handled by professional-level RLS. Not in this audit's scope, but importantly **snapshot does not track this table**.
4. **Read path.** `SpecialismsDeliveryPanel` reads from `getMyDashboardProfile`.
5. **Write path.** `SpecialismsDeliveryPanel` mutates `professionals` directly.
6. **Dirty detection.** **Broken (P0 §4.3).** No trigger on `professionals`. Adding a specialism doesn't flip `has_unpublished_changes`.
7. **Discard-to-snapshot.** Not implemented (`specialismsEqual` exists in `getMySectionDiff` but there's no `discardMySectionChanges({section:"specialisms"})` branch — the enum in `DiscardableSection` is `basics|method|plans|results|faqs` only).
8. **Publish snapshot.** Snapshot writes `website.specialisms` at publish time from the live `professionals.specialisms`. So the public page eventually reflects the change only when the trainer republishes.
9. **UI states.** `specialismCount > 0 ? "done" : "empty"`. No partial state.
10. **Edge cases.** Trainer with 20 specialisms — no UI cap enforced beyond what `SpecialismsDeliveryPanel` restricts.

### 2.4 Where I train (`location`)

1. **Purpose.** Primary postcode + delivery mode (in-person / online) + gym list.
2. **DB shape.** `professional_locations.postcode`, `professionals.in_person_available`, `online_available`, `trains_at_home_studio`, `trains_at_clients_home`; gyms via `professional_gyms` → `gyms` join.
3. **RLS.** Same "not in scope" caveat as specialisms. Same dirty-tracking gap.
4. **Read path.** `getMyPrimaryLocation` + `getMyDashboardProfile` + `loadProfessionalGymVenues` (server-side).
5. **Write path.** `saveMyPrimaryPostcode`, `updateMyTrainingBase`, `GymPicker` writes to `professional_gyms`.
6. **Dirty detection.** **Broken (P0 §4.3).**
7. **Discard-to-snapshot.** Not implemented (enum excludes `location`; the diff logic exists but is dead code because the flag never flips).
8. **Publish snapshot.** Freezes `website.venues` + `coaching_reach` at publish time.
9. **UI states.** `postcode && delivery ? "done" : postcode||delivery ? "partial" : "empty"`.
10. **Edge cases.** Gym venues are computed live from `professional_gyms` in `getWebsiteBySlug`, but `venuesEqual` in `getMySectionDiff` compares live-computed vs snap-frozen — false-positives possible if a gym is renamed in the `gyms` table. Not seen in live data yet.

### 2.5 Coaching plans (`plans`)

1. **Purpose.** Three tier cards (Online / Hybrid / 1-to-1) on the public page.
2. **DB shape.** `services` (17 cols): `title` (28-char cap), `description`, `price_pence` / `price_label` / `price_unit`, `duration_minutes`, `mode` enum, `sort_order`, `is_published`, `is_featured`, `bullets text[]`, `cta_label`, `image_url`.
3. **RLS + GRANTs.** ✓ 4 policies with `USING(is_published=true)` for anon reads — the only fully-correct public gate in this module.
4. **Read path.** `getMyWebsite` returns services array; auto-seeds 3 default cards if empty via `ensureDefaultServices` (which also rewrites the legacy "Personal Training at home" cards silently — potential surprise for anyone who deliberately set those).
5. **Write path.** `upsertMyService` (**P0 hijack §4.1**) + `deleteMyService` (safe, has ownership check).
6. **Dirty detection.** ✓ Trigger on `services` fires. `servicesEqual` compares by content (sorted); featured/bullets/image_url included.
7. **Discard-to-snapshot.** ✓ Delete-then-insert from snapshot. **New row IDs** — any URL that referenced the old service `id` is broken after a discard.
8. **Publish snapshot.** ✓ Full array of published rows.
9. **UI states.** `serviceCount >= 3 ? "done" : > 0 ? "partial" : "empty"`. Live: 332/333 = "done".
10. **Edge cases.** "Single Most popular" invariant enforced client-side by clearing `is_featured` on siblings before upsert — but as separate mutations. If one succeeds and the next fails, trainer briefly has 0 or 2 featured. `is_published` UI toggle exists but isn't surfaced in the sidebar count — a trainer with 3 unpublished services still shows "done".

### 2.6 How I coach (`method`)

1. **Purpose.** Method name + intro + up to 6 numbered pillars (target 3).
2. **DB shape.** `websites.method_name` (text), `method_intro` (text), `method_pillars jsonb DEFAULT '[]'::jsonb`.
3. **RLS.** Same as basics — leaks via `websites_public_read USING(true)`.
4. **Read path.** `getMyWebsiteContent` returns `content.method_*`.
5. **Write path.** `saveMyWebsiteContent` upserts with `SaveContentSchema` (60-char title, 400-char body, max 6 pillars).
6. **Dirty detection.** ✓ Trigger + `methodDirty` uses `pillarsEqual`.
7. **Discard-to-snapshot.** ✓ Restores `method_name` / `method_intro` / `method_pillars` from `snap.website`.
8. **Publish snapshot.** ✓ Included in `website` snapshot.
9. **UI states.** `methodName && pillarCount>=3 ? "done" : methodName||pillarCount>0 ? "partial" : "empty"`. Live: 0/333 pros have method — universally empty.
10. **Edge cases.** `aiDraftMethod` returns 3 pillars max but backend allows 6 — no consistency between AI output and manual max. Pillar dialog uses `BODY_MAX = 200` while Zod allows 400 — client cap can be raised.

### 2.7 Client results (`results`)

1. **Purpose.** Proof-card grid with client photo, metric, quote, duration.
2. **DB shape.** `website_transformations` (13 cols, note `user_id` not `professional_id` — inconsistent naming).
3. **RLS + GRANTs.** `public_read USING(true)` — **leaks unpublished results (P0 §4.2)**.
4. **Read path.** `getMyWebsiteContent`.
5. **Write path.** `upsertTransformation` (**P0 hijack §4.1**), `deleteTransformation` (safe).
6. **Dirty detection.** ✓ Trigger on the table. `transformationsEqual` includes `is_published` — toggling visibility marks section dirty (arguable UX).
7. **Discard-to-snapshot.** ✓ Delete-then-insert — new IDs.
8. **Publish snapshot.** ✓ Full array.
9. **UI states.** `transformationCount >= 1 ? "done" : "empty"`. No "partial". Live: 0/333.
10. **Edge cases.** `ResultEditDialog.canSave` allows either `metric` OR `client_first_name` — headline is optional despite label. Image editor writes to `website-results` bucket; no orphan cleanup on replace.

### 2.8 FAQs (`faqs`)

1. **Purpose.** Q/A list on the public page.
2. **DB shape.** `website_faqs` (8 cols, `user_id`, `question` NOT NULL, `answer` NOT NULL, `source` — "manual" or "ai").
3. **RLS + GRANTs.** `public_read USING(true)` — leaks. No `is_published` column at all, so "hidden FAQ" is not a concept, which is fine but the public policy is still open.
4. **Read path.** `getMyWebsiteContent`.
5. **Write path.** `upsertFaq` (**P0 hijack §4.1**), `deleteFaq` (safe).
6. **Dirty detection.** ✓ Trigger. `faqsEqual` compares by content.
7. **Discard-to-snapshot.** ✓ Delete-then-insert.
8. **Publish snapshot.** ✓ Full array.
9. **UI states.** `faqCount >= 1 ? "done" : "empty"`.
10. **Edge cases.** `aiDraftFaqs` returns up to 8; client saves one at a time via `upsertFaq`. If the trainer closes the tab mid-batch, partial state remains — no transaction.

### 2.9 Languages & socials (`contact`)

1. **Purpose.** Language list, social handles (IG/TikTok/YT/X/LI), internal contact phone.
2. **DB shape.** `professionals.languages[]`, `social_instagram|tiktok|youtube|x|linkedin` (text), `contact_phone`.
3. **RLS.** On `professionals`, out of scope, but importantly **not snapshot-tracked**.
4. **Read path.** `ContactSocialsPanel` via `getMyDashboardProfile`.
5. **Write path.** Direct `professionals` mutations.
6. **Dirty detection.** **Broken (P0 §4.3)** — same as specialisms/location.
7. **Discard-to-snapshot.** Not implemented; not diffed.
8. **Publish snapshot.** Socials are baked into `published_snapshot.website.socials` at publish time (via `buildSocials` in `getWebsiteBySlug`). So the public page shows frozen socials until republish — but the flag never lights, so the trainer never knows to republish.
9. **UI states.** `contactFilled == 3 ? "done" : 0 ? "empty" : "partial"`.
10. **Edge cases.** Phone is described in copy as "internal" but appears nowhere on the public page — genuinely internal-only. Language/socials/phone all rolled into one status even though phone is invisible on the public page — cosmetic.

---

## 3. Cross-cutting audits

### 3.1 Publish pipeline

- `publishMyWebsite` → mints owner preview token → calls `getWebsiteBySlug` with preview to bypass snapshot → serializes via `JSON.parse(JSON.stringify(live))` → writes `published_snapshot` + `published_at = now` + `has_unpublished_changes = false`. Trigger `mark_website_dirty_self` correctly leaves the flag alone because only bookkeeping columns changed.
- Live probe: 331/333 rows have `published_snapshot IS NULL` — the public page falls through to the tolerant live read (see 3.2). Only 2 pros have ever pressed Publish.
- **Bug:** `getMyPublishState` returns `has_unpublished_changes: !!(data?.has_unpublished_changes ?? true)`. If the websites row exists, the fetched boolean wins; DB default is `true`, but every row in production is currently `false` (probably from a seed migration or from a first publish/discard). So new trainers who edit their basics *are* correctly flagged, but any pro whose flag drifted to `false` without publishing shows "clean" until they touch a websites-tracked column again.

### 3.2 The publish gate is soft

The public page (`getWebsiteBySlug`) has this shape:
```
if (!previewOk) {
  if (snap && snap.website) return snap;
  // no snapshot → fall through to live read (backwards-compat)
}
```
The comment says "backwards-compatible" — in practice this means **331/333 pros are serving their live draft to the public through the server fn** because they've never published. Combined with the P0 RLS leak (§4.2), draft data is also directly reachable via the anon Data API. The "Publish before public" model is aspirational, not enforced.

### 3.3 Discard-to-snapshot

- `DiscardableSection` enum = `basics|method|plans|results|faqs` only. Sidebar `DISCARDABLE` set matches. So `specialisms` and `location` show a dirty dot (via `getMySectionDiff`) but no discard action — the enum can never accept them. That's actually fine given both would edit `professionals` (a mismatched table for a "discard section" operation).
- Delete-then-insert for services/transformations/faqs generates **new row IDs**. Any external link that referenced the old id (rare, but possible in analytics) breaks. No re-key from snapshot; the ids in the snapshot are ignored.
- Discard does **not** clear `has_unpublished_changes`. Comment even admits it. UI still shows "Unpublished changes" after a full-clean discard until the trainer manually re-publishes or edits another section.

### 3.4 Readiness rollup

- `computeWebsiteSections` is shared between the editor sidebar and the dashboard's `getMyReadiness` — good, no drift risk. Verified by reading both call sites.
- Weight: Website 50 / Verification 30 / Education 20; site-live counts as an 11th sub-step so 100% requires publish + no unpublished flag + all 9 sections done. Correct.
- Because §3.1's dirty flag stays false for edits to `professionals`, a trainer can hit 100% readiness while still serving stale specialisms/socials/phone to the public. Real bug.

### 3.5 Hero + service AI image pipeline

- Both hero (`generateHeroFromAi`) and service (`generateServiceImageFromAi`) fetch the style anchor via `readFile(path.resolve(process.cwd(), "src/assets/coach-james-coaching.jpg"))`. Cloudflare Workers has a virtual FS that may not resolve `src/assets/*` in production. The try/catch swallows the failure and continues with no anchor — silent quality drop, no telemetry.
- No content-safety filtering on the free-text prompt (`min: 3, max: 400`). Trainer can prompt-inject; upstream Gemini has its own safety filter but there is no application-level check.
- No orphan cleanup: every `Upload` writes a new object to `website-hero/{userId}/hero-<ts>.jpg`. Replacing hero 20 times leaves 20 objects. Storage cost grows linearly.
- AI ref/upload allow HEIC on hero but not on service card (`handleFile` allows HEIC on hero via `image/heic|heif` regex; service card only accepts `jpeg|png|webp`). Inconsistent.
- Reference photo cap: 6 MB on hero AI reference; 8 MB via Zod upstream. Two-tier limit is confusing.

### 3.6 Preview token

- HMAC-SHA256, 4 h TTL, scoped to slug. Verify uses `timingSafeEqual` on equal-length buffers. Correct.
- `WEBSITE_PREVIEW_SECRET` is required at token mint/verify time. Not set → 500 on `/dashboard/website` load. Should be surfaced as a config check.
- Token lives in the React Query cache and travels in a URL query param (`?preview=...`); anyone with a screenshared iframe URL can bypass the snapshot for 4 h.

### 3.7 Auth + role

- All private server fns use `requireSupabaseAuthWithImpersonation`. ✓
- `supabaseAdmin` imported dynamically inside handlers only — no module-scope import leak. ✓
- Public read path `getWebsiteBySlug` is unauth by design.
- **`/api/public/*`** — no public API surface touched by this module.

### 3.8 Client-side state (TanStack Query)

- Cache keys: `["my-website"]`, `["my-website-content"]`, `["my-website-publish-state"]`, `["my-website-section-diff"]`, `["my-website-preview-token"]`, `["my-dashboard-profile"]`, `["my-primary-location"]`.
- Invalidation on save/publish/discard is thorough (see `saveMutation.onSuccess`, `publishMut.onSuccess`, `discardMut.onSuccess`).
- One subtle bug: the `React.useEffect` at line 499 that invalidates `publish-state` / `section-diff` runs on `websiteUpdatedAt` and `contentUpdatedAt`, but reads `websiteUpdatedAt` as `(data as unknown as { updatedAt?: number }).updatedAt` — `data` doesn't have `updatedAt` (React Query stores that on the query state, not the payload). So this dependency is always `undefined`; the effect fires only on `contentUpdatedAt` and `services.length`. Not fatal but the intent doesn't match reality.
- No optimistic updates; every mutation is a round-trip. UX is safe but the editor feels lagged on saves.

### 3.9 Type safety

- Every server-fn input has a Zod validator ✓.
- `WebsiteDTO`, `ServiceDTO`, `TransformationDTO`, `FaqDTO`, `ClientResultDTO` well-typed.
- `snap: any` in `getMySectionDiff` casts + `key = (s: any) =>` in `servicesEqual`. Snapshot JSON is untyped by design because it's cross-version. Reasonable trade-off; document it.

### 3.10 A11y + keyboard

- Dialogs (Faq/Pillar/Result) all block Escape and outside-click when dirty and show a "Discard unsaved changes?" alert dialog. Good.
- Dialogs hide the built-in close button (`[&>button.absolute]:hidden`) — trainer can only close via Cancel/Save/Delete. Intentional but means power users lose the "×" affordance.
- Sidebar section buttons don't declare `aria-current="true"` for active; `data-active` is used for styling. Screen readers won't announce active section.
- Status pill copy ("Done" / "In progress" / "Add") is only text; the coloured dot has no `aria-label`.
- Iframe preview has `title="Public page preview"` ✓ but `sandbox="allow-same-origin allow-scripts allow-forms"` on a same-origin frame is a documented sandbox escape — the iframe can reach parent origin. Since it's the trainer's own preview of their own page, not exploitable, but it does mean the iframe has full parent DOM access via `window.parent`.

### 3.11 Copy + errors

- Toast copy is human across the module (`"Website saved"`, `"Website published — your public page is live."`).
- Some error surfaces are raw: `Upload failed: ${uploadError.message}` reflects Supabase's message directly.
- URL-mode hero editor: `"Couldn't fetch that URL"` when CORS-blocked — no hint that CORS is the actual cause.
- Publish confirm dialog first-run copy is fine but doesn't warn that publishing snapshots trust info (cert numbers, insurance numbers) into a publicly-readable JSON.

### 3.12 Perf

- `dashboard_.website.tsx` is 2 322 LOC in a single file. Vite splits per route so this is one chunk; the initial editor load fetches 6 queries in parallel (fine) but bundle-size wise the whole thing is on the critical path. Move `HeroImageEditor` (imports `react-easy-crop`) behind a dynamic import → measurable JS drop.
- `ensureDefaultServices` runs on every `getMyWebsite` call. For 332 pros already at 3 services it's a wasted `SELECT` + no-op branch. Cheap but constant.
- Iframe reload uses `key={reloadNonce}` — a full frame remount on every publish; acceptable.

---

## 4. The three P0s in detail

### 4.1 Cross-tenant row hijack (upsert-by-id)

Every `upsert*` server fn in this module has the same shape:
```
const patch = { ...data, professional_id: userId };   // or user_id: userId
await supabaseAdmin.from(table).upsert(patch).select().single();
```
Because `supabaseAdmin` bypasses RLS and Zod accepts `id: z.string().uuid().optional()`, an attacker with any authenticated session can:

1. `POST` `upsertMyService` with `{ id: <victim-service-uuid>, title: "hijacked", ... }`.
2. Postgres upsert matches on the PK, updates the row, and rewrites `professional_id` to the attacker's `userId`.
3. Victim's service card is gone; attacker owns it.

Affected: `upsertMyService`, `upsertMyWebsite` (safe — PK is `professional_id`, always the caller's), `upsertTransformation`, `upsertClientResult`, `upsertFaq`, `saveMyWebsiteContent` (safe — PK is `professional_id`).

**Fix (any of):**
- Verify existing row ownership before the upsert: `select professional_id where id = data.id`; reject on mismatch.
- Split into `insertMyX` and `updateMyX({ id, ... })`, and use `.eq('id', id).eq('user_id', userId)` on updates like `deleteMyService` does.
- Drop `supabaseAdmin` for these paths and use `context.supabase` (RLS as the user) so the `owner_all USING (auth.uid()=user_id)` policy enforces it.

### 4.2 Draft + unpublished data leaked via anon Data API

Current policies:

```
websites               public_read  USING (true)
website_transformations public_read USING (true)
website_client_results  public_read USING (true)
website_faqs            public_read USING (true)
```

With just the publishable anon key, anyone can:
- `select * from websites` → every draft `about`, `hero_image_url`, `method_pillars`, and the entire `published_snapshot` JSON (including trust items with cert / policy numbers), plus `has_unpublished_changes` (a signal of who has drafts pending).
- `select * from website_transformations where is_published = false` → every unpublished (i.e. still-being-drafted or intentionally hidden) client result including quotes, photos, names.
- `select * from website_client_results` → same.
- `select * from website_faqs` → every FAQ, drafts included.

**Fix:**
- `websites`: replace `public_read USING (true)` with a narrow view (or policy) that returns only the safe columns of `published_snapshot` for rows where a snapshot exists AND the paired `professionals.is_published = true` AND publicly visible per `isProPubliclyVisible`. Or drop the public policy entirely and route the public page through the server fn only (current live read path already does this).
- The three `website_*` public reads should gate on `is_published = true` (add the column to `website_faqs` if the product allows hidden FAQs).
- Redact `trust.items[].id` (cert / policy numbers) from the published snapshot before it's stored; keep them only in `verification_submissions` / `insurance_policies` (owner-scoped tables).

### 4.3 Publish snapshot silently goes stale

`mark_website_dirty_*` triggers exist only on `websites`, `services`, `website_transformations`, `website_faqs`. Every other editor surface writes to different tables:

| Editor section | Writes to | Trigger? |
|---|---|---|
| Profile photo | `profiles.avatar_url` | ✗ |
| Specialisms | `professionals.specialisms` | ✗ |
| Where I train (postcode) | `professional_locations` | ✗ |
| Where I train (delivery mode) | `professionals.*_available` | ✗ |
| Where I train (gyms) | `professional_gyms` | ✗ |
| Languages / socials / phone | `professionals.*` | ✗ |

Effect:
- Trainer edits any of the above → `has_unpublished_changes` stays whatever it was → sidebar shows no dirty dot → publish button shows no attention.
- Public page keeps serving whatever the snapshot contains — which was frozen at last publish and does not update until republish.
- 100% readiness card is achievable while public page is materially stale.
- Publish confirm dialog's per-section diff (`getMySectionDiff`) also misses these because `snap.website.*` includes them but the "dirty" flag isn't set — the diff runs only when the flag is set (well, actually it runs any time it's called; but the `has_unpublished_changes` UI signal that prompts the trainer to publish never fires).

**Fix:**
- Add triggers on `professionals`, `professional_locations`, `professional_gyms` that set `websites.has_unpublished_changes = true` for the matching `professional_id` when relevant columns change (or a single "any content changed" trigger with a narrow column list).
- Extend `getMySectionDiff` / `SectionDiff` to cover `profile`, `contact` sections.

### 4.4 (Structural amplifier) Zero foreign keys

No FKs on any of the 5 tables. Consequence:
- If a `professionals` or `auth.users` row is deleted, all their services / transformations / faqs / results / websites row dangle forever.
- Nothing at the DB layer prevents `user_id`/`professional_id` from pointing to a non-existent user (app layer trusts `context.userId`).
- Amplifies §4.1 — the hijack can point at rows whose ownership was already broken.

**Fix:** Add `REFERENCES public.professionals(id) ON DELETE CASCADE` (or `SET NULL` on `websites` if we want to keep the snapshot) to all five tables in one migration.

---

## 5. Live DB probe results (embedded)

Full CSV in `docs/website-editor-fix-list.md`. Highlights:

| Metric | Value |
|---|---|
| `websites` rows | 333 |
| `services` rows | 1 001 (332 pros × 3 seed + 1 pro × 5) |
| `website_transformations` rows | 0 |
| `website_faqs` rows | 5 (across 1–2 pros) |
| `website_client_results` rows | 0 |
| Pros ever published | 2 / 333 |
| Pros with `has_unpublished_changes = true` | 0 / 333 |
| Pros with `hero_image_url` set | 1 / 333 |
| Pros with `subtitle` set | 1 / 333 |
| Pros with `method_name` set | 0 / 333 |
| Pros with ≥ 3 method pillars | 0 / 333 |
| Pros with exactly 1 `is_featured=true` service | 333 / 333 ✓ |
| Orphan rows (all 5 tables) | 0 |

Reading: the module has correct plumbing (default seed, single-featured invariant, no orphans yet) but is barely used because trainers hit the empty state and don't fill it. That's a product problem, not a code one — but it means every bug above is masked in the live data.

---

## 6. Sign-off

The editor is safe to keep shipping to trainers **as an editing surface**. It is **not** safe as it stands for opening up the anon Data API, and it should not be advertised as "your website only updates when you publish" until §4.3 is fixed. §4.1 is a straight security bug and should be closed before the next public launch.

See `docs/website-editor-fix-list.md` for the actionable backlog.
