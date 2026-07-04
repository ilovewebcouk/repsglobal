
## Direct answer

**Yes — moving the section list into the main sidebar shell is the right call.** Your current layout is 5 columns of chrome for what's effectively one editing task:

```
[REPS sidebar 240] [Website rail 236] [Editor ~640] [Preview 500]
```

Two nav columns for one page is expensive and confusing — you're the only person who ever needs both at the same time. Collapsing them into one gets us:

- **+236px** back — split between editor (~+140) and preview (~+96), so Client Results / Where I train stop feeling cramped and the desktop iframe scales up to ~50%.
- One nav model. The sidebar answers "what am I doing" (Website / Enquiries / Reviews / Settings), and while inside Website it swaps to answer "what am I editing" (Basics / Plans / How I coach…) with a back arrow.
- Matches your screenshot mental model exactly.

## Plan

### Phase 1 — Move section nav into the sidebar shell

Change `DashboardSidebar` so that while on `/dashboard/website`, the middle nav group renders **"Website sections"** with a `← Website` back-row at the top, instead of the top-level nav. Clicking back restores the normal nav and (default) jumps to `/dashboard`.

- Add a `sidebarMode` context in `DashboardShell` (`"root" | "website"`). Website route sets `"website"` on mount.
- Sections list, active state, status pills, and Publish button all move from `WebsiteEditorLayout` into the sidebar.
- Remove the left rail column from `WebsiteEditorLayout`. New shell = `[Sidebar 240] [Editor flex-1.6] [Preview flex-1 max-w-[640px]]`.
- Publish button lives at the bottom of the sidebar (same slot as today's rail Publish).
- Mobile: the current top pill-nav row stays as-is (unaffected — sidebar collapses to sheet on mobile already).

### Phase 2 — Per-section QA (audit first, build after)

I'll capture each of the 8 sections at the new width, then produce a **findings doc** — one page per section, scoring each on 5 axes and listing concrete fixes. **No code changes in Phase 2 — audit only.** You approve fixes before I touch them.

Sections in scope (in the order they appear in-app):

1. Profile photo
2. Website basics
3. Coaching plans
4. How I coach
5. Specialisms
6. Where I train
7. Client results
8. FAQs

For each section I'll grade:

- **Clarity** — is it obvious what this section controls on the public page?
- **Field hierarchy** — are the most-changed fields at the top? Are optional ones marked?
- **Feedback** — do inputs show counters, validation, save state?
- **Preview redundancy** — does it contain a mini-preview that competes with the live iframe? (Client Results and the Service Edit dialog both do — likely delete-worthy now.)
- **Consistency** — same field patterns, same button placement, same empty states across sections?

Deliverable: a single Markdown audit at `docs/website-editor-audit.md` with a Findings + Recommendations table per section, plus a **prioritized fix list** (P0 breaks trust / P1 friction / P2 polish). We ship fixes as a batch after you pick which P-tier to land.

### Phase 3 — Batch fixes (after audit review)

Whatever you green-light from Phase 2, implemented in one pass with a screenshot diff at the end.

## Order of work

1. Phase 1 shell move (single edit round, screenshot before/after).
2. Phase 2 audit doc — I'll paste the section findings into chat as I go, then commit the full doc.
3. You pick fixes → Phase 3.

## Files touched

**Phase 1**
- `src/components/dashboard/DashboardSidebar.tsx` — accept `mode` prop; render website-sections mode
- `src/components/dashboard/DashboardShell.tsx` — pass `mode` from route context
- `src/routes/_authenticated/_professional/dashboard_.website.tsx` — publish state + section state moved to a shared hook/context
- `src/components/dashboard/website/WebsiteEditorLayout.tsx` — remove left rail column, keep header + preview

**Phase 2** — no code changes (audit doc only)

## Out of scope for now

- Preview iframe blank state (still open — separate bug).
- Public coach page (`/c/$slug`) changes.
- Any redesign of the sections themselves — that's Phase 3 after your audit call.
