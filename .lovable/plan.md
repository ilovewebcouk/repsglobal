## The problem

The dashboard has two "am I done?" widgets that disagree with the actual Website editor:

- **Profile completeness** (`src/lib/dashboard/profileCompleteness.ts`) checks 7 polish items only: name/city, About (>80 chars), avatar, specialisms, languages, phone, one social. It never looks at Website basics (tagline/subtitle/hero), Coaching plans, How I coach, Client results, FAQs, or whether the site has ever been published. It also never looks at verification (identity/insurance/qualifications) or education (certs uploaded). Result: a trainer with a 6/9 IN PROGRESS, never-published website sees **100% – "Looking great"**.
- **Needs your attention** (`NeedsAttention` in `src/components/dashboard/hub/index.tsx`) checks `isPublished` from `professionals.is_published`. That flag is set to `true` at signup by defaults / legacy code (`website.functions.ts` lines 444, 461, 484) and is unrelated to whether the trainer has clicked **Publish** in the Website editor. Real publish state lives on `websites.published_at` / `websites.has_unpublished_changes` (see `getMyPublishState`). Result: the "Your listing is still a draft" card never fires, even for sites that were never published.
- Neither widget shows *which* section is broken, so a trainer sees "All caught up" and has no cue to open the editor.

Verified via DB: every recent professional row has `is_published=true`, but many have `has_hero=false`, `has_method=false`, `pillar_ct=0`, etc. The two widgets are wallpapering over real gaps.

## What "100%" should mean

Redefine the trainer's overall readiness as three equally-weighted pillars, matching what actually determines whether their public page works and ranks:

1. **Website** — every editor section done (Profile photo, Website basics, Specialisms, Where I train, Coaching plans, How I coach, Client results, FAQs, Languages & socials) **AND** the site has been published at least once with no unpublished changes.
2. **Verification** — 3 REPS ticks: identity, insurance, qualifications (already computed by `getTrustState`).
3. **Education / CPD** — at least one qualification certificate uploaded (`professionals.cert_uploaded_at`). This is the "education" pillar the trainer mentioned; it overlaps with Verified qualifications but is surfaced separately so unverified members still see the ask.

Percentage = weighted roll-up (Website 50%, Verification 30%, Education 20%), so "100%" only appears when the public page is genuinely ready to send traffic to.

## Plan

### 1. New shared readiness computation

Create `src/lib/dashboard/readiness.ts`:

- `computeWebsiteSections(profile, website, services, publishState)` — reuses the exact same 9-section rules already in `dashboard_.website.tsx` (lines 511–582) so the sidebar and the dashboard agree byte-for-byte. Extract them into this helper and import from both places (kills a real drift bug — today the two lists can diverge).
- `computeReadiness({ profile, website, services, publishState, trust })` returns:
  ```ts
  {
    pct: number,                 // weighted overall
    website:  { pct, done, total, sections: [{ id, label, status, to }], everPublished, hasUnpublished },
    verification: { pct, ticks, missing: ("identity"|"insurance"|"qualifications")[] },
    education:    { pct, hasCert },
  }
  ```

### 2. Rework Profile completeness card

Rename card to **"Your REPS readiness"** and rewrite `CompletenessCard`:

- Ring shows overall weighted pct.
- Three stacked rows (Website / Verification / Education) each with mini pct + one-line status ("6 of 9 sections", "Identity + Insurance done, add qualifications", "Add a certificate").
- Each row is a link deep into the right editor.
- Keep it visually the same shape as today (one ring + a checklist below), just three grouped rows instead of 7 polish items.

### 3. Rework Needs your attention

In `NeedsAttention`:

- Drop the current `profilePct < 100` catch-all row.
- Add per-website-section attention items generated from the shared readiness helper, e.g.:
  - "Add your hero image and About copy" → `/dashboard/website` (basics)
  - "Add your 3 coaching plans" → `/dashboard/website` (plans)
  - "Describe how you coach" → `/dashboard/website` (method)
  - "Add at least one client result" → `/dashboard/website` (results)
  - "Answer common FAQs" → `/dashboard/website` (faqs)
  - "Add languages, phone or a social link" → `/dashboard/website` (contact)
  - Only surface sections that are `partial` or `empty`; cap total site-related rows at 3 to avoid a wall of noise; a "+N more" chip links to the editor for the rest.
- Replace the current publish check (`isPublished` from `professionals.is_published`) with `getMyPublishState`:
  - If `ever_published === false`: **"Your website has never been published"** → Publish now.
  - Else if `has_unpublished_changes === true`: **"You have unpublished website changes"** → Review & publish.
  - Otherwise no row.
- Keep enquiries / review replies / insurance / verification / support rows as they are.

### 4. Wire the new data

- Add `getMyPublishState` to `useHubData` (already exists in `publish.functions.ts`) and pass it into both cards.
- Pass `hub.website.data` (services, transformations, faqs, method_*) into the readiness helper — `useHubData` already fetches it, it just isn't used by these cards.
- Extract and share the section-status logic between `dashboard_.website.tsx` and the new helper so the sidebar's "6/9 IN PROGRESS" and the dashboard's "6 of 9 sections" are guaranteed to match.

### 5. Backward-safe DB check

No migration required — every field is already tracked. As a small correctness fix, stop trusting `professionals.is_published` as the "website is live" signal anywhere on the dashboard; use `websites.published_at` via `getMyPublishState` instead. `professionals.is_published` stays as-is for directory eligibility (that's a separate concern owned by admin/verification flow).

### 6. QA / verification pass

After the change, verify on the current demo account (Charlotte Evans, `about_len=695`, `has_hero=false`, `has_method=false`, `pillar_ct=0`, `ever_published=true`, `has_unpublished_changes=false`):

- Readiness ring should read roughly ~65–75% (Website partial, Verification varies, Education varies), NOT 100%.
- Needs-your-attention should surface Website basics (hero missing), How I coach (empty), FAQs (empty), and whichever verification / education tick is missing.
- Sidebar `6/9` and dashboard "6 of 9 sections" must match exactly.
- A brand-new sign-up should see ~0% and a full checklist.
- A trainer with all sections done + published + all 3 ticks + cert uploaded should be the only path to 100%.

### Technical notes (implementation)

- Weights (Website 50 / Verification 30 / Education 20) live in a single constant in `readiness.ts` so they can be tuned later without hunting.
- `computeWebsiteSections` returns the same `SectionStatus` union (`done` / `partial` / `empty`) already used by the sidebar; the sidebar and dashboard both consume the same shape.
- Deep-links use existing `activeSection` support in the website editor via `/dashboard/website` + section anchor / stored active tab (already handled by that route).
- No changes to Verified badge logic — `getTrustState` remains the single source of truth.
- Legacy `profileCompleteness.ts` stays exported for one release but delegates to `computeReadiness().website.pct` so any stray consumers keep working; remove in a follow-up.
