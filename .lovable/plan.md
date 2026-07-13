# Verification queue — QA audit + reviewer workspace rebuild

## Brutal honest read of today's screen

Opening a **qualification** case renders the entire trust profile: Identity card, Insurance card, Qualification card, then a Decision panel that opens with a red "Blocking issues — override required" box and a permanent "override reason ≥8 chars" field. The result:

- Reviewers scan three verticals to approve one thing.
- The scariest UI element (red override box) is the *default* state, even on clean cases.
- Identity + Insurance are duplicated on every qualification row for the same person — 8 queue items = 8 renders of the same identity card.
- "Approve qualification" and "Approve & next" both exist but the primary action isn't obvious.
- No way to jump to the full person view; no history of what's already been decided for this pro.

The docs (`docs/admin-v2/06-verification-trust-and-safety.md`) already say each vertical should be **clearly separated** and reviewers should process cases **without navigation friction**. Current screen violates both.

---

## Deliverable 1 — Audit document

**File:** `docs/admin-v2/verification-ux-audit-2026-07-13.md`

Sections:

1. **What each queue actually reviews** — Qualifications / Identity / Insurance / Provider changes / Regulated permissions / REPS courses. One row per queue with: data source, decision, side effects, notifications, audit trail.
2. **Screen-by-screen findings** — annotated screenshots of today's Qualifications, Identity, Insurance panes. Each finding tagged Severity 1/2/3.
3. **Information hierarchy problems** — the "everything at once" pattern, redundancy across rows, decision-panel dominance, missing person context, no keyboard flow (`j`/`k`/`a`/`r`/`c` from the doc are not wired).
4. **Data model gaps** — e.g. no single "reviewer notes" thread per pro; `verification_decisions` isn't surfaced in the workspace as history.
5. **Redesign spec** (see below).
6. **Acceptance criteria** mapped back to doc 06 §14.

---

## Deliverable 2 — Redesigned reviewer workspace (spec)

### Layout

```text
Queue list (unchanged)   |   Focused review pane
                         |   ┌─────────────────────────────────────┐
                         |   │  Paul Underwood  ›  open person ↗   │  ← name is a link
                         |   │  Identity ✓  ·  Insurance ✓  ·  SLA │  ← trust strip (pills only)
                         |   ├─────────────────────────────────────┤
                         |   │  QUALIFICATION (the only card)      │
                         |   │  W.T.B.A. Instructor Cert L1        │
                         |   │  Awarding body · Cert no · Holder   │
                         |   │  Open certificate · Verify on…      │
                         |   │  Checklist (auto-ticked where poss) │
                         |   ├─────────────────────────────────────┤
                         |   │  [ Approve & next ]  (primary)      │
                         |   │  Request changes · Reject           │  ← reveals notes inline
                         |   └─────────────────────────────────────┘
```

### Rules

- **One card, one decision.** The Identity card and Insurance card are removed from the qualification pane. Their state is reduced to green/amber pills in the trust strip. Clicking a pill expands a compact readout in place (name-on-doc, expiry) — no full card.
- **Person drawer.** Clicking the name (or a "Open person ↗" affordance) opens a right-side drawer with: full identity, full insurance, ALL their qualifications (approved + pending + rejected), decision history from `verification_decisions`, notes thread. This is where "I want to see everything about Paul" lives — not the review pane.
- **Progressive decision.** Default state shows only **Approve & next** (primary) plus secondary **Request changes** / **Reject** text buttons. The reviewer-notes textarea and override-reason field are hidden until the reviewer clicks Request changes or Reject. No red "blocking issues" box on clean cases.
- **Blocking issues only when actually blocking.** The checklist (name match, awarding body recognised, cert number recorded) auto-computes. If all green → Approve is enabled with no warnings. If any fail → an amber inline banner appears with a one-click "Override with reason" affordance that expands the reason field. Red styling reserved for hard-fail (name mismatch across ID & cert).
- **Keyboard.** Wire `j`/`k` (next/prev), `a` (approve & next), `r` (reject), `c` (request changes), `p` (open person drawer), `/` (search), `Esc` (close drawer). Discoverable via `?` help tooltip.
- **De-duplication.** When the same person has 8 pending quals, show them as a stacked group in the queue ("Paul Underwood · 8 qualifications") that expands to individual items. Approving one doesn't reload identity/insurance context — it's already in memory.
- **Consistent shell for all three tabs.** Same layout for Qualifications, Identity, Insurance — only the middle card swaps. Reviewer never re-learns the screen.

### Decision panel micro-copy

- Default: `Approve & next` (primary, brand orange) · `Request changes` (ghost) · `Reject` (ghost, danger on hover).
- On Request changes: inline textarea "What does the professional need to change?" — sent to them by email + verification notification.
- On Reject: inline textarea "Reason for rejection (visible to the professional)" + optional internal note.
- Override reason only appears when a checklist item is unticked AND the reviewer clicks Approve anyway.

### Person drawer contents

1. Header: name, avatar, tier, trust state summary.
2. Trust ticks (Identity / Insurance / Qualifications count) with expiry dates.
3. All qualifications table: title · awarding body · status · decided by · decided at.
4. Decision history (from `verification_decisions`) — every approve/reject/change with reviewer, timestamp, reason.
5. Reviewer notes thread (new lightweight table, optional — flagged in the spec, not built in v1).
6. Links: public profile, member timeline, support tickets.

---

## Technical notes

**Files to touch (build phase, after audit approval):**

- `src/routes/admin_.verification.tsx` (1614 lines — will shrink significantly; splits into `ReviewerShell`, `TrustStrip`, `PersonDrawer`, tab-specific `QualificationCard` / `IdentityCard` / `InsuranceCard`).
- `src/components/admin/verification/AdminProviderQueueTab.tsx` — reuse pattern for provider changes.
- `src/lib/verification/*.functions.ts` — add `getPersonTrustSnapshot(userId)` returning identity + insurance + all quals + decision history in one call, so the drawer is a single query.
- No schema changes required for v1. Reviewer notes thread deferred to v2 (would add `verification_notes` table).

**Out of scope for v1:** keyboard shortcuts help modal (v1.1), reviewer notes thread table (v2), CPD queue redesign (separate pass).

---

## Sequence

1. I write `docs/admin-v2/verification-ux-audit-2026-07-13.md` with screenshots + findings + this spec.
2. You approve or amend the spec.
3. Build phase: `getPersonTrustSnapshot` server fn → `PersonDrawer` → new `ReviewerShell` → migrate Qualifications tab → migrate Identity + Insurance tabs → keyboard shortcuts → QA pass.
