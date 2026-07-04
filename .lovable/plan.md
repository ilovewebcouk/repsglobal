# Website editor — full remediation plan

Fix all 56 audit findings across 6 sequential phases. Phases are ordered so each ships value on its own and the risky changes (DB, publish flow) land after the safety-net changes (error paths, unsaved-work guard).

**Demo preservation rule (applies to all phases):** the existing `isFixture` flag on `/c/$slug` already flags `james-wilson` and any other slug in the `COACHES` fixture map. Every "no more fake fallback / hardcoded copy" change is gated on `!isFixture`, so `/c/james-wilson` keeps its full polished look; real coaches get real-only content.

## Assumed defaults (call out now to reject before Phase 1 lands)

- Never-published sites → `notFound()` (404), no "coming soon" placeholder.
- Hardcoded "100+ clients trained" and "3 of 20 spaces" widgets → **hidden** on real coach pages until a proper editor field ships (not shown as blank/zero).
- Fixture fallback (photos, quotes, FAQs) → real coaches with zero content render **empty sections that self-hide**, not empty shells with headers.
- Atomic discard → implemented via a single Postgres RPC transaction (cleanest fix for #15).
- Section source-of-truth unification → one shared `computeWebsiteSections` helper, extended to include contact + profile in the diff and discard flows.

---

## Phase 1 — Ship-blockers (data loss + trust + security)

1. `dashboard_.website.tsx:432–443` — `publishMut` always calls `saveAll()` and awaits it. `saveAll()` becomes return-awaitable by holding a `Promise` on a ref that child editors resolve after their save mutation completes. Fixes #3, #D-01.
2. `c.$slug.index.tsx:515–518` — `mergeLiveIntoCoach` no longer falls back to fixture arrays for transformations / testimonials / faqs / clients / hero widgets when `!isFixture`. Public page renders empty sections that self-hide. Fixes #1, #22, #23.
3. `website.functions.ts:551–564` — `getWebsiteBySlug` returns `null` when there's no snapshot and no valid preview token; `/c/$slug` loader throws `notFound()`. Fixes #2.
4. `website-content.functions.ts:236,278,319` — add ownership pre-check (`select id where id = data.id and user_id = context.userId`) before every admin-client upsert on transformations / client-results / faqs. Fixes #4.
5. `dashboard_.website.tsx:102–115` — `Field` renders `<label htmlFor>`; all fields pass a stable `id` (via `useId`). Fixes #5, #A-03.

## Phase 2 — Editor ↔ public rendering drift + error/UX safety net

6. Render `accent_hex` — map into `coach.accent` in `mergeLiveIntoCoach` and expose as `--accent-color` CSS var. Fixes #6.
7. Render `services.image_url` on `TierCard`. Fixes #7.
8. Add `isError` branch with retry to all six `useQuery` calls in the editor (skeleton for loading, inline error for failure). Fixes #8, #L-01…L-04.
9. Cache invalidation: every service/content/FAQ/result mutation invalidates `my-website`, `my-website-publish-state`, `my-website-section-diff`. Delete the dead `updatedAt` effect at `dashboard_.website.tsx:498`. Fixes #9, #10, #C-01…C-05.
10. Add `useBlocker` guard tied to a unified `anyLocalDirty` flag exposed by `WebsiteContentEditor`. Fixes #11, #D-02.
11. Replace `CropperModal` bare div with shadcn `Dialog` (title, focus trap, aria). Fixes #12, #A-02.
12. Harden URL-paste in `HeroImageEditor`: `AbortController` timeout (10s), `HEAD` check for `Content-Type: image/*`, 20 MB response cap via streaming reader, `reader.onerror` toast, `data:image/` guard before crop. Fixes #13, #H-01, #H-02, #H-04.
13. Publish dialog awaits `sectionDiffQuery.isFetching === false` before opening, so first-publish copy never flashes. Fixes #33.

## Phase 3 — Publish / discard / diff correctness

14. Unify section source of truth — extend `computeWebsiteSections` return shape and use it in `getMySectionDiff`, `DiscardableSection`, sidebar, and readiness. Fixes #27, #28.
15. `getMySectionDiff` compares `client_results_intro` inside `resultsDirty`, adds `clientResults` to the snap type and comparison. Fixes #25, #26.
16. `DiscardableSection` gains `specialisms`, `location`, `profile`, `contact` with server handlers. Fixes #17, #F-11.
17. `discardMySectionChanges` uses one atomic RPC (Postgres function `discard_website_section` with `BEGIN…COMMIT`) for services / transformations / faqs / client_results; preserves service `id` values via `upsert` + tombstone delete of rows-not-in-snapshot. Fixes #15, #F-04, #47.
18. Discard restores `website_client_results` in `results` section. Fixes #14.
19. Discard explicitly clears `has_unpublished_changes` after re-diff shows clean. Fixes #16, #F-05.
20. `getMyPublishState` returns `has_unpublished_changes: false` when no `websites` row exists. Fixes #38.
21. `publishMyWebsite` separates subscription check from data read so lapsed subscribers see "Your subscription is inactive" instead of "Nothing to publish yet". Fixes #39.

## Phase 4 — DB & security hardening (single migration, reviewed together)

22. Tighten RLS on `website_client_results`, `website_faqs`, `website_transformations` — public SELECT changes from `USING (true)` to `USING (is_published = true)`; owner SELECT policy added for editor reads. Fixes #19, #F-08.
23. Create `public.websites_public_v` view that strips `published_snapshot`, `has_unpublished_changes`, `published_at`; anon policy on the base table swapped to the view. Fixes #20, #F-07.
24. Add `websites.defaults_seeded_at` column; gate `ensureDefaultServices` on it. Fixes #29, #F-13.
25. Add `discard_website_section(section text, snapshot jsonb)` RPC used by Phase 3 item 17.
26. Add `service_email` (or reuse `contact_email`) to `professionals` if needed for #43.

Migration reviewed by user before it runs.

## Phase 5 — Fixture-copy leaks + cosmetic bugs + tokens

27. `AboutSection` H2 (`c.$slug.index.tsx:1262`) becomes coach-name-driven when `!isFixture`. Fixes #21.
28. `ServicesSection` subheading generic when `!isFixture`. Fixes #24.
29. `ServiceEditDialog` — title reflects add-vs-edit; save button copy differs; add `FieldCounter` to all capped inputs. Fixes #34, #V-01, #B-01, #B-02.
30. `PillarEditDialog` requires non-empty body to save. Fixes #37.
31. Replace raw "Loading…" strings with proper `Skeleton` components. Fixes #35.
32. Replace hardcoded `emerald-*` / `amber-*` / `red-*` classes with `--reps-status-done/partial/empty/destructive` tokens in `src/styles.css`; shared `StatusDot` / `StatusPill` component consumed by both `WebsiteEditorLayout` and `WebsiteSectionsSidebar`. Fixes #36, #T-01…T-04.
33. Remove dead `blocked = false` const and `void isPro;` computation. Fixes #B-03, #B-04.

## Phase 6 — Low / nit cleanup

34. `hero.functions.ts` / `service-image.functions.ts` — dynamic-import style anchor + bundle asset as base64 constant (drop `node:fs` + `process.cwd()` from module scope). Fixes #18, #F-03, #F-21.
35. Extract shared `assembleWebsiteDTO()` used by both `getMyWebsite` and `getWebsiteBySlug`; also extract `asVenues`/`asPillars`/`asReach` into `coerce.ts`. Fixes #30, #F-19.
36. Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` header on `/c/$slug` GET; bust via revalidation on publish. Fixes #31.
37. `/c/$slug` client-side `useQuery` preserves `preview` param in `queryKey` + `queryFn`. Fixes #32, #2.2.
38. Emit `robots: noindex,nofollow` in `/c/$slug` `head()` when `deps.preview` is set. Fixes #44, #3.2.
39. Zod `max` on all image `dataUrl` schemas = decoded byte cap × 1.4. Fixes #40, #F-06.
40. Add `"linkedin"` (+`"email"` for real coaches) kind to socials union; `buildSocials` maps LinkedIn correctly. Fixes #41, #43.
41. Remove dead `professionals.headline` from DTO. Fixes #42.
42. `verifyPreviewToken` uses `split(":", 2)` with proper reconstruction; TTL constant re-exported from `preview-token.server.ts`. Fixes #45, #46, #F-15, #F-16.
43. `asVenues` reads stored `kind` when present. Fixes #51, #F-18.
44. Add domain allowlist regex to `image_url` fields (Supabase Storage URLs for this project). Fixes #48, #F-05.
45. Cloudflare Worker cron / scheduled cleanup task deletes hero/service objects with no `image_url` row reference older than 24h. Fixes #49, #F-17.
46. Sticky mobile bar uses `coach.aboutImage`. Fixes #50, #9.1.
47. Replace London-specific `default-services.ts` copy with city-agnostic placeholder. Fixes #53, #F-26.
48. `FieldCounter` uses `aria-live="off"` and announces on blur only. Fixes #54, #A-06.
49. Restructure `SidebarMenuButton` discard trigger to sibling (no button-in-button). Fixes #55, #A-05.
50. Add `FieldCounter` under all capped inputs identified in the audit (Results dialog, Hero AI prompt, Cities). Fixes #56, #V-02, #V-04, #V-05.

## Out of scope (explicit)

- Column-level RLS on `published_snapshot` (view approach used instead).
- Rewriting `/c/$slug.index.tsx` (1968 lines) — only surgical edits per findings.
- Redesign of any section — audit fixes only.
- New editor fields for "clients trained" and "spaces available" — widgets are hidden, not added.

## Delivery order

Each phase ships as one edit batch, verified, then next phase starts. Phase 4 (migration) is presented on its own for review before running. Total ~50 file touches across the 6 phases.