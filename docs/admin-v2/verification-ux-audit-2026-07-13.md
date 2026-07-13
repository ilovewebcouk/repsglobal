# Verification queue — UX audit & redesign spec

**Date:** 2026-07-13
**Author:** Trust & Safety / Product
**Status:** Draft — awaiting approval before build
**Owner file after build:** `src/routes/admin_.verification.tsx` (+ new components)
**Related doc:** `docs/admin-v2/06-verification-trust-and-safety.md`

---

## 0. TL;DR — brutal honest read

Opening a **qualification** case today renders the professional's *entire trust profile* — Identity card, Insurance card, Qualification card, plus a Decision panel whose default state is a red "Blocking issues — override required" box and a permanent "override reason ≥8 chars" textarea.

Three problems compound:

1. **Reviewers scan three verticals to approve one thing.** The screen is asking "should this qualification be verified?" but presenting evidence for three separate questions.
2. **The scary UI is the default.** Clean cases show the same red override banner as broken cases. Reviewers habituate to red and stop reading it.
3. **Everything duplicates by row.** Paul Underwood has 8 pending qualifications, so identity + insurance render 8 times. It's the same person.

Doc 06 §2 already says the workspace should separate identity / qualification / insurance and let reviewers "process cases without navigation friction." We're violating both.

---

## 1. What each queue actually reviews

| Queue | Question the reviewer answers | Primary data source | Decision writes to |
|---|---|---|---|
| Qualifications | Is this cert real, and does it belong to this person? | `verification_submissions` (kind = qualification), `qualifications` | `verification_decisions`, `qualifications.status` |
| Identity Checks | Does the document match this person? | Stripe Identity + `identity_documents` | `identity_documents.status` |
| Insurance | Is cover current and does the insured name match ID? | `insurance_policies` | `insurance_policies.status`, `verification_decisions` |
| Provider changes | Should this name / domain / logo / bio change go live? | `provider_change_requests`, `provider_name_requests`, `provider_domain_verifications` | Same tables + `verification_decisions` |
| Regulated permissions | Should this provider be allowed to teach Level X? | `provider_regulated_permissions` | Same table |
| REPS courses | Should this course listing go live? | `reps_courses`, `reps_course_evidence` | `reps_courses.status` |

**Finding 1.1 (Severity 2):** Only Qualifications / Identity / Insurance appear in the current tab strip. The other three queues live under a separate `/admin/verification` sub-tab ("Profile changes") and a Courses tab. Reviewers switch contexts — the top-level shape is inconsistent.

---

## 2. Screen-by-screen findings — Qualifications tab

Reference screenshot: user upload 2026-07-13, `/admin/verification` → Qualifications tab, Paul Underwood row expanded.

### 2.1 Layout (Severity 1)

Current stack in the review pane, top to bottom:

1. Header (name + submitted + SLA + Close)
2. **Identity card** (fully expanded — name on doc, DOB, doc type, expiry, "Open in Stripe")
3. **Insurance card** (fully expanded — provider, policy, cover, expiry, insured-name match, "View certificate", AI check %)
4. **Qualification card** (the actual thing being reviewed)
5. Decision panel with:
   - Red "Blocking issues — override required" banner
   - Reviewer notes textarea
   - Override reason textarea (≥8 chars)
   - Request changes / Reject / Approve qualification / Approve & next

**Problem:** cards 2 and 3 are context, not the decision. They belong in a person drawer, not the review pane.

### 2.2 Redundancy (Severity 1)

Paul has 8 pending qualifications. Clicking each row re-renders identical Identity + Insurance cards. The reviewer's job is comparing one certificate at a time; the person context is invariant across the 8 rows.

### 2.3 Decision panel (Severity 1)

- Red "Blocking issues" banner shows on clean rows. It lists items that are actually **already ticked** (name matches, awarding body recognised, cert number present). The banner reads as "this is broken" when it isn't.
- Two "Approve" buttons: **Approve qualification** and **Approve & next**. Ambiguous primary action.
- Override reason textarea always visible, even when nothing is being overridden.

### 2.4 Missing person context (Severity 2)

- No affordance to open Paul's full profile.
- No visible history of prior decisions ("we already rejected 3 of his certs last month for name-mismatch") — this lives in `verification_decisions` but isn't surfaced.
- No jump to Support tickets / Member timeline (doc 06 §11 requires this cross-link).

### 2.5 Keyboard (Severity 2)

Doc 06 §3 specifies `j` / `k` / `a` / `r` / `c` / `/` / `Esc`. None are wired.

### 2.6 Queue list (Severity 3)

- 8 rows for the same person, each showing his name in full. Could stack.
- SLA "6h left" is prominent but not colour-graded — a 30-minutes-left row looks the same as a 6-hours-left row until you read the number.

---

## 3. Identity and Insurance tabs

Same shell reused, but the "hero" card changes:

- Identity tab: hero is Identity, then Insurance + Qualification appear as context. Same pattern, same problem.
- Insurance tab: hero is Insurance, then Identity + Qualification appear as context. Same pattern, same problem.

**Finding 3.1 (Severity 2):** All three tabs share the "render everything" pattern. Fixing one requires fixing the shell.

---

## 4. Information hierarchy problems

- **Everything-at-once:** the review pane treats "context you might need" and "the thing you're deciding" as equal-weight.
- **Decision-panel dominance:** the tallest, most colourful element is the decision panel, before the reviewer has looked at the evidence.
- **No progressive disclosure:** notes / override / reasons are always visible.
- **No person-level view:** there's no home for "everything about Paul" — it's smeared across every row.

---

## 5. Data model gaps

- `verification_decisions` exists but isn't surfaced in the workspace as a per-person history.
- No `verification_notes` thread (free-form reviewer notes about a professional across cases). Would be useful, but out of scope for v1.
- Queue is derived per-item; no "group by professional" query exists yet. Trivial to add (`ORDER BY user_id, submitted_at`).

---

## 6. Redesign spec

### 6.1 Layout

```text
Queue list                 |   Focused review pane
(grouped by person)        |   ┌─────────────────────────────────────────┐
                           |   │ Paul Underwood ›  [Open person ↗]       │
                           |   │ Identity ✓ · Insurance ✓ · SLA 6h left  │  ← trust strip (pills)
                           |   ├─────────────────────────────────────────┤
                           |   │ QUALIFICATION (the only card)           │
                           |   │  W.T.B.A. Instructor Cert L1            │
                           |   │  Awarding body · Cert no · Holder       │
                           |   │  Open certificate · Verify on…          │
                           |   │  Auto-checklist:                        │
                           |   │    ✓ Name matches across ID + cert      │
                           |   │    ✓ Awarding body recognised (Ofqual)  │
                           |   │    ✓ Certificate number recorded        │
                           |   ├─────────────────────────────────────────┤
                           |   │ [ Approve & next ]                      │  ← primary
                           |   │ Request changes · Reject                │  ← reveal notes inline
                           |   └─────────────────────────────────────────┘
```

### 6.2 Rules

1. **One card, one decision.** Identity / Insurance / Qualification are never all rendered as full cards on the same pane. The tab decides which is the hero; the other two collapse to pills in the trust strip.
2. **Trust strip.** Green/amber pills for Identity, Insurance, and Qualifications count. Clicking a pill opens a compact popover with the 3 most useful fields (name-on-doc, expiry) — not the full card.
3. **Person drawer.** Clicking the name (or the "Open person ↗" affordance) slides in a right-side drawer with:
   - Identity (full)
   - Insurance (full)
   - All qualifications (approved / pending / changes / rejected) in a single table
   - Decision history from `verification_decisions`
   - Cross-links to public profile, member timeline, support tickets
   The drawer is where "I want to see everything about Paul" lives.
4. **Progressive decision.** Default state shows only:
   - **Approve & next** (primary, brand orange)
   - **Request changes** (ghost)
   - **Reject** (ghost, danger-on-hover)
   Notes / override / reason fields are hidden until the reviewer clicks Request changes or Reject (or clicks Approve while an auto-checklist item is red).
5. **Auto-checklist replaces "blocking issues" banner.** Three checks auto-compute. All green → Approve enabled, no warning. Any red → amber inline note next to the specific check + an "Override with reason" button that reveals the reason field. Red panel only for hard-fail (name mismatch across ID + cert).
6. **Keyboard.** Wire `j` / `k` (next / prev), `a` (approve & next), `r` (reject), `c` (request changes), `p` (open person drawer), `/` (search), `Esc`, and `?` (shortcut help tooltip).
7. **Queue grouping.** Group by person when >1 pending item. Header row shows "Paul Underwood · 8 qualifications · SLA 6h" and expands to individual rows. Approving one auto-advances to the next in the group.
8. **Consistent shell across tabs.** Qualifications / Identity / Insurance / Provider changes / Regulated / Courses share the same shell. Only the hero card swaps. Reviewer never re-learns the screen.

### 6.3 Decision micro-copy

- Default state: `Approve & next` · `Request changes` · `Reject`.
- On Request changes click: inline textarea `"What does the professional need to change?"`. Sent by email + verification notification.
- On Reject click: inline textarea `"Reason for rejection (visible to the professional)"` + optional collapsible internal note.
- On Approve while a checklist item is red: reason field appears, labelled `"Override reason (recorded permanently)"`.

### 6.4 SLA colour scale

- `>24h`: neutral white/60.
- `4–24h`: emerald.
- `1–4h`: amber.
- `<1h` or breached: rose.

### 6.5 Person drawer contents

1. Header: name, avatar, tier, trust state summary.
2. Trust ticks with expiry dates.
3. All qualifications table (title · body · status · decided by · decided at).
4. Decision history from `verification_decisions` — every approve/reject/change with reviewer + timestamp + reason.
5. Reviewer notes thread — **v2**, flagged only.
6. Cross-links: public profile · member timeline · support tickets.

---

## 7. Technical plan

**New server fn:** `getPersonTrustSnapshot({ userId })` → returns `{ identity, insurance, qualifications[], decisions[] }` in one call. Powers the drawer.

**File split of `src/routes/admin_.verification.tsx` (currently 1614 lines):**

- `src/components/admin/verification/ReviewerShell.tsx` — layout, trust strip, decision panel, keyboard.
- `src/components/admin/verification/PersonDrawer.tsx` — right-side drawer.
- `src/components/admin/verification/cards/QualificationCard.tsx`
- `src/components/admin/verification/cards/IdentityCard.tsx`
- `src/components/admin/verification/cards/InsuranceCard.tsx`
- Route file becomes a thin orchestrator (~200 lines).

**Queue grouping:** client-side reduce by `user_id`. No SQL change required.

**No schema changes for v1.** `verification_notes` deferred to v2.

**Out of scope for v1:**
- Keyboard shortcut help modal (v1.1).
- Reviewer notes thread table (v2).
- CPD queue redesign (separate pass — doc 06 §9 says CPD is preview-only until it has real data).
- Provider changes / regulated / courses tab migration (v1.2 — same shell, phased).

---

## 8. Acceptance criteria (mapped to doc 06 §14)

Verification workspace is complete when:

- [ ] Qualification tab shows one hero card (qualification) plus a trust strip. No inline Identity or Insurance cards.
- [ ] Identity and Insurance tabs mirror the same shell with their respective hero card.
- [ ] Clicking the person's name opens a drawer with full identity, insurance, all quals, and decision history.
- [ ] Default decision state shows one primary action (Approve & next) plus two ghosts. No red banner on clean cases.
- [ ] Auto-checklist drives approve enablement; override reason only appears when overriding.
- [ ] Same person's pending items are grouped in the queue list.
- [ ] SLA pill is colour-graded.
- [ ] Every decision writes `verification_decisions` with reviewer id, timestamp, reason, notes (doc 06 §10).
- [ ] Every trust surface links to Member Timeline (doc 06 §11).
- [ ] Keyboard `j` / `k` / `a` / `r` / `c` / `/` / `Esc` are wired and discoverable.

---

## 9. Build sequence (after this doc is approved)

1. `getPersonTrustSnapshot` server fn + query.
2. `PersonDrawer` component.
3. `ReviewerShell` + trust strip + progressive decision panel.
4. Migrate Qualifications tab into the new shell.
5. Migrate Identity + Insurance tabs.
6. Queue grouping by person.
7. Keyboard shortcuts + `?` help tooltip.
8. QA pass against §8 acceptance criteria.

Provider changes / regulated / REPS courses migration to the new shell = separate v1.2 PR.
