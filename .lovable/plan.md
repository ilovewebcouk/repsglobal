## Deliverable

One long-form doc — **`docs/website-editor-audit-final.md`** — plus a companion **`docs/website-editor-fix-list.md`** with a prioritised P0/P1/P2 bug + polish backlog ready to hand back as the next build turn. No code changes in this pass.

## Scope

Everything under the Website editor umbrella, front-end and back-end, given equal depth per section:

**Front-end surface**
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` (2.3k LOC route)
- `src/components/dashboard/website/` — `WebsiteEditorLayout`, `WebsiteSectionsSidebar`, `PublishConfirmDialog`, `FaqEditDialog`, `PillarEditDialog`, `ResultEditDialog`, `FieldCounter`
- `src/components/dashboard/HeroImageEditor.tsx` (upload + AI restyle flow)
- Shared helpers: `src/lib/dashboard/website-sections.ts`, `readiness.functions.ts`

**Back-end surface**
- `src/lib/website/website.functions.ts` (879 LOC — reads/writes for basics, specialisms, location, contact, socials, languages)
- `src/lib/website/website-content.functions.ts` (549 LOC — plans/method/results/faqs)
- `src/lib/website/publish.functions.ts` (487 LOC — publish snapshot, `getMyPublishState`, discard-to-snapshot per section)
- `src/lib/website/hero.functions.ts` (AI hero generation from upload OR profile photo)
- `src/lib/website/service-image.functions.ts`, `transformation-image.functions.ts`
- `src/lib/website/preview-token.server.ts`
- `src/lib/website/default-services.ts`

**Data layer**
- Tables: `websites`, `services`, `website_transformations`, `website_faqs`, `website_client_results`, `professionals`, `professional_locations`, `professional_photos`
- RLS policies on each, GRANTs to `authenticated` / `service_role` / `anon`
- Storage buckets used by hero / service / transformation uploads
- Live row probe on the demo trainer + 5–10 recent real trainers to catch drift between UI state and DB truth

## What each section gets

For all 9 editor sections — Profile, Basics, Specialisms, Location, Plans, Method, Results, FAQs, Contact — the report has the same 10-part rubric so nothing is skimmed:

1. **Purpose** — one line: what this section stores and where it shows on the public page.
2. **DB shape** — tables/columns touched, defaults, NOT NULLs, FKs, uniqueness.
3. **RLS + GRANTs** — policies, roles, and whether the shape matches how the editor and publish snapshot actually query.
4. **Read path** — server fn(s) that hydrate the editor, validators, error shape, N+1 risks.
5. **Write path** — save/patch server fn(s), input validation (Zod), auth middleware, race conditions, partial-save behaviour.
6. **Dirty detection** — how `dirtyMap[section]` is computed vs. the last-published snapshot; false positives, false negatives.
7. **Discard-to-snapshot** — only 5 sections are discardable (`basics/method/plans/results/faqs`); verify each restores cleanly and the other 4 have a correct reason to be excluded (or file a P1).
8. **Publish snapshot** — what `publish.functions.ts` copies into the snapshot for this section, and whether the public page reads from the snapshot or live rows.
9. **UI states** — empty / partial / done rules from `website-sections.ts`, sidebar pill, dashboard readiness contribution, a11y (labels, focus, keyboard traps in dialogs), mobile behaviour.
10. **Edge cases** — long text, unicode, empty arrays, deleted rows, orphaned images, unpublished draft on a never-published site, image upload failures, AI generation failures/timeouts, concurrent edits in two tabs.

## Cross-cutting audits (equal weight)

- **Publish pipeline end-to-end** — draft → `has_unpublished_changes` flag → publish → `published_at` → public route read. Verify the flag flips correctly on every write path (not just basics), and that `getMyPublishState` matches reality on the demo account + a random sample.
- **Readiness rollup** — trace one full render: editor → `computeWebsiteSections` → `getMyReadiness` → `CompletenessCard` + `NeedsAttention` + sidebar `x/9`. Confirm no drift between sidebar count and dashboard "x of 9 sections" on live data.
- **Hero image + AI restyle** — upload → storage → AI gateway call → replace URL → dirty flag → publish. Check retries, partial-image streaming, file-size limits, MIME allow-list, orphaned uploads.
- **Service / transformation images** — same pipeline, same checks.
- **Preview token** — `preview-token.server.ts` scope, expiry, leakage risk.
- **Auth + role** — every server fn uses `requireSupabaseAuth`; no accidental `supabaseAdmin` in a `.functions.ts` module scope; no public route calling a protected fn in a loader.
- **Client-side state** — React Query keys, invalidation on save/publish/discard, stale reads after publish, optimistic update rollbacks.
- **Type safety** — Zod validators on every input; DTO shape matches DB; no `any` leaking into publish snapshot.
- **A11y + keyboard** — dialogs (Faq/Pillar/Result), focus return, escape behaviour, sidebar radio semantics, screen-reader labels on status pills.
- **Copy + i18n** — button labels, empty-state copy, error toasts (are they human, or "Error: undefined"?).
- **Perf** — route size (2.3k LOC), initial fetch fan-out, image lazy loading, bundle impact of `HeroImageEditor` + AI SDK.

## Live DB probe (read-only, in this pass)

Runs against the live Supabase project using `supabase--read_query` — nothing is written. Findings feed the fix list.

- Row counts + null-rate per column for the 7 editor-owned tables.
- Distribution of `websites.published_at`, `has_unpublished_changes`, `websites.updated_at` for the last 30 days — to size how many trainers are in each publish state.
- Orphan check: `services` / `website_transformations` / `website_faqs` / `website_client_results` rows whose `professional_id` no longer exists.
- Storage-vs-DB drift: image URLs stored in DB that no longer resolve.
- RLS spot-check: run every editor SELECT/UPDATE/DELETE policy against the demo trainer's own row vs. a sibling row to confirm the policy blocks cross-tenant access.
- Sanity: does the demo trainer's stored `has_unpublished_changes` match what the sidebar shows in the preview right now?

## Fix-list format

`docs/website-editor-fix-list.md` — one row per finding:

```
| ID | Sev | Area | Symptom | Root cause | Suggested fix | Files touched |
```

- **P0** = data loss, security (RLS gap, missing GRANT, cross-tenant read), publish/discard corruption, blank editor.
- **P1** = wrong state shown to trainer (dirty flag lies, readiness drift, orphan images), broken AI/upload path, a11y block.
- **P2** = copy, empty-state polish, mobile spacing, perf wins, dead code.

Grouped by section, then by cross-cutting area, so you can grant approval per group.

## Out of scope (this pass)

- No code changes, no migrations, no destructive DB actions.
- Public profile page (`/pro/$slug`) is only touched insofar as it reads from the publish snapshot — its own audit is separate.
- Verification, education, billing, admin — separate surfaces.
- No visual redesign of the editor (the `redesign` skill was invoked, but you asked for a QA audit — I'll flag any visual/UX issues in the fix list as P2s rather than propose a new look).

## Ready to run

On approval I'll produce both docs in a single pass — full section-by-section rubric, cross-cutting audits, live DB probe results embedded inline, and the prioritised fix list.