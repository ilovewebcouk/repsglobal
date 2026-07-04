## Draft vs Published for the website editor

### The honest current state
- Editor writes go straight to live rows. The `?preview=1` on the iframe today does nothing — the public `/c/$slug` page reads the same rows the editor mutates. So every keystroke you save is already live.
- The only "published" flag today is per-row `is_published` on transformations/client_results — a hide/show toggle, not a draft/live split.
- To do what you're asking properly we need real content versioning, not a UI relabel.

### Recommended model: Draft + Published snapshot per section

Add two content states for every editable website table:
- **Draft** — what the editor reads and writes into. Iframe (with `?preview=1`) reads this when the viewer is the owner.
- **Published** — what `/c/$slug` reads for the public.

A single "Publish website" button copies Draft → Published atomically. A per-section "Discard changes" reverts Draft → Published for that section.

### Approach (Option A — shadow columns, one migration per table)

For each content table (`website`, `services`, `transformations`, `client_results`, `website_faqs`, `website_pillars`, `specialisms` join, `training_locations`) add:
- `status text not null default 'draft'` — `'draft' | 'published'`
- `published_at timestamptz null`
- `published_snapshot jsonb null` — last published version of the row's content columns
- Row-level "dirty" is derived: `status = 'draft' OR json_diff(current, published_snapshot)`.

Read paths:
- **Editor server fns** (`getMyWebsiteContent`, `getMyServices`, …) — unchanged, return current rows (= draft).
- **Public `getWebsiteBySlug`** — reads `published_snapshot` for each row where it exists; skips rows without one (never published yet). Rows with `published_snapshot = null` are hidden from public until first publish.
- **Iframe preview** — when `?preview=1` AND the current authenticated user owns the slug, `getWebsiteBySlug` returns the draft (current row values). Otherwise same as public.

Write paths:
- Any editor mutation sets `status = 'draft'` and updates the row's content columns. `published_snapshot` untouched.
- **`publishMyWebsite` server fn** — inside a single transaction, for every content row of the caller: set `published_snapshot = <current content columns as jsonb>`, `published_at = now()`, `status = 'published'`.
- **`discardMySectionDraft(section)` server fn** — for rows in that section, overwrite content columns from `published_snapshot` and set `status = 'published'`. Rows created after last publish (no snapshot) are deleted.

### Editor UI changes
- Header status pill (top of editor):
  - "All changes published" (emerald) when no row is dirty.
  - "N unsaved changes · Preview only" (amber) when any row is dirty, with **Publish website** button (orange) and **Discard all** (ghost).
- Per-section sidebar status gains a third dot: existing (Done / In progress / Add) stays, plus a small amber "•" when that section has unpublished changes.
- Live-preview header:
  - "Preview (draft)" chip when viewing dirty content.
  - "Preview (live)" chip when clean.
  - Reload button stays.
- Publish confirm dialog: summary of changed sections + Publish / Cancel.
- Toast on publish: "Your website is live" with link to `/c/$slug`.

### Iframe behaviour
- `WebsiteEditorLayout` iframe src becomes `/c/${slug}?preview=1&v=<nonce>` where `nonce` bumps on every editor save so preview reflects unsaved-since-last-nonce state instantly.
- `getWebsiteBySlug` accepts `preview: boolean` in input; when true, verifies `requireSupabaseAuth` + ownership of the slug before returning draft data. Missing auth or ownership silently falls back to published.

### Migration + backfill
- Migration adds columns with defaults so existing rows read as `status='published'`, `published_snapshot = jsonb_build_object(...current values...)`. Zero-downtime: everyone's current live content becomes their first "published" snapshot; no visual change on `/c/$slug` for anyone.
- GRANTs re-affirmed per project rules.

### Out of scope (call out now)
- Version history / rollback UI (only "last published" is kept, not a timeline).
- Draft scheduling.
- Per-field diffs in the publish dialog (just section names + counts).
- Draft copy of `professionals`/`profiles` fields (photo, tagline). These stay live-write for this pass — most trainers already treat those as fine to publish immediately. If you want photo + tagline draftable too, say so and I'll add them to the migration.

### Files
- **Create**:
  - `supabase/migrations/<ts>_website_draft_publish.sql`
  - `src/lib/website/publish.functions.ts` (`publishMyWebsite`, `discardMySectionDraft`, `getMyDirtySections`)
  - `src/components/dashboard/website/PublishBar.tsx` (top status bar + Publish/Discard)
  - `src/components/dashboard/website/PublishConfirmDialog.tsx`
- **Edit**:
  - `src/lib/website/website.functions.ts` — `getWebsiteBySlug` reads `published_snapshot`, honours `preview` for owner.
  - `src/lib/website/website-content.functions.ts` — every upsert stamps `status='draft'`.
  - `src/routes/_authenticated/_professional/dashboard_.website.tsx` — mount `PublishBar`, wire nonce bump, sidebar dirty dot, discard actions.
  - `src/components/dashboard/website/WebsiteEditorLayout.tsx` — preview chip (draft/live), src nonce.
  - `src/routes/c.$slug.index.tsx` — pass `preview` from search params to loader/query.
  - `docs/website-editor-audit.md` — document the model.

### Verification
- Build + typecheck pass.
- Migration applied; existing `/c/$slug` for a seeded pro renders identically before/after.
- Playwright: edit a field → sidebar shows amber dot → public `/c/$slug` unchanged in second tab → click Publish → public tab reload shows the change. Also: edit + Discard reverts editor to last published.

---

### Two questions before I build

1. **Scope of "draftable" content**: keep photo + tagline (profile-level) as live-write for this pass, or include them in the draft/publish flow? (Including them is more consistent but touches `professionals`/`profiles` and their existing surfaces.)
2. **Discard granularity**: per-section only (Discard changes in "Client results"), or also global Discard all? I've included both in the plan — say if you want to drop one.