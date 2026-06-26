## Admin Verification — QA pass + simplification

### What's wrong today (Jordon Gumbley case)

Looking at `src/routes/admin_.verification.tsx` against the screenshot:

1. **Three competing summaries.** Identity / Insurance / Qualification cards say one thing, then "Cross-checks" repeats half of it, then "Gates" repeats it again with a different visual. The reviewer can't tell which is the source of truth.
2. **Insurance shows "pending" but isn't reviewable in this screen.** The card only displays the data; there is no "approve / reject insurance" action, and the failing gate ("Insurance current — Expired") is buried at the bottom in Gates. Jordon's policy expires 2026‑04‑01, which is what's blocking Pro, but the UI never says that plainly next to Insurance.
3. **Qualification "Manual" is a dead end.** The card shows the qual + an Ofqual Register link + an awarding‑body link, but doesn't tell the reviewer *what to do* ("open the awarding body site, confirm the cert number, tick this box"). The big "Review certificate" button opens a drawer with another copy of the cross‑checks.
4. **Approve fails with a `window.alert`.** When the Ofqual gate is failing, clicking Approve throws a blocking browser alert ("Cannot approve — failing checks… Provide an override reason ≥8 chars"). The override input only appears *after* you read the alert. That's the "funny little box" the user described.
5. **Identity tab is a totally separate table** with its own approve/reject flow that uses `window.prompt` for the reason. Two different review UIs for one person.
6. **Decision bar has 4 buttons** ("Request changes", "Reject", "Approve as Pro", "Approve as Verified") whose enable/disable rules depend on hidden gate logic. Reviewer can't predict which will be active.

### Goal

One linear, opinionated review screen per professional: **ID → Insurance → Qualification → Decision.** Each step shows status, the evidence, the failing reasons, and an inline action. No browser alerts. No duplicated cross‑check grids.

### New layout (right‑hand workspace)

```text
┌─ Jordon Gumbley · Telford · SLA 22h left ──────────── [Close] ┐
│                                                                │
│  STEP 1 · IDENTITY                       [✓ Approved — Stripe] │
│  Name JORDON GUMBLEY · DOB — · Doc —                           │
│  [ Open in Stripe ↗ ]   [ Override → reject ]                  │
│                                                                │
│  STEP 2 · INSURANCE                     [✗ Expired 2026-04-01] │
│  Insure4Sport · £1.5m · Policy 14S792365                       │
│  [ View certificate ↗ ]                                        │
│  ⚠ Cannot approve as Pro — policy expired.                     │
│  [ Request new certificate ]   [ Mark approved (override) ]    │
│                                                                │
│  STEP 3 · QUALIFICATION                       [⚠ Manual check] │
│  IAO Level 3 Diploma in Fitness Instructing and PT             │
│  Innovate Awarding · Qual 601/3866/X · Cert 00168459           │
│  OCR holder: Jordon Gumbley  ✓ matches profile                 │
│  Verify on: [ Ofqual Register ↗ ] [ Innovate Awarding ↗ ]      │
│  [ Open certificate ↗ ]                                        │
│  ☐ I've confirmed this certificate on the awarding body site   │
│                                                                │
│  ── DECISION ────────────────────────────────────────────────  │
│  Will approve at: PRO (ID ✓ · Insurance ✗ · Qual confirmed)    │
│  Reviewer notes [                                            ] │
│  Override reason (only shown when something is failing)        │
│  [ Request changes ]  [ Reject ]   [ Approve ▾ ]               │
│                                          ├ Approve as Pro      │
│                                          └ Approve as Verified │
└────────────────────────────────────────────────────────────────┘
```

Key UX rules:

- **One status pill per step**, derived from the same `evaluateGates` output we already compute. No second "Gates" card.
- **Failing gate text rendered inline under the relevant step**, in plain English ("Policy expired 2026‑04‑01", "Awarding body not on Ofqual register").
- **Manual qualification = one explicit confirm checkbox.** Ticking it acts as the override and prefills the override reason ("Confirmed on Innovate Awarding site, cert 00168459"). Reviewer can edit before submitting.
- **No `window.alert` / `window.prompt` anywhere.** Override + revoke reasons become inline `Textarea`s with character counter, validated before the mutation runs.
- **Single Approve button with a dropdown** for Pro vs Verified — disabled state has a tooltip explaining exactly which step is failing.
- **Identity tab folds into the main case view.** The standalone `AdminIdentityTab` table stays as a filter ("show me only people with pending ID"), but clicking a row opens the same per‑pro workspace so admins never juggle two flows.

### Files to change

- `src/routes/admin_.verification.tsx`
  - Extract the right‑hand workspace into `<CaseWorkspace />` (same file, cleaner JSX).
  - Replace `Identity` + `Insurance` + `Qualification` + `Cross-checks` + `Gates` cards with three `<ReviewStep />` cards that own their own status, evidence, override hook.
  - Replace alerts/prompts with inline form state (`overrideReason`, `manualQualConfirmed`, `revokeReason`).
  - Collapse the decision bar to: `Request changes` · `Reject` · `Approve ▾`.
- `src/components/verification/CertDrawer.tsx`
  - Trim drawer to: doc viewer + name‑match line + Approve/Reject. Remove the second cross‑check grid (it's already on the case view now).
- No DB / server‑fn changes. `reviewVerification` already accepts `override_reason`, so the new checkbox + textarea just feed the same field.

### Out of scope for this pass

- Insurance approval flow as a first‑class object (currently insurance status is a read of `insurance_policies`; making admins approve/reject individual policies is a separate scope).
- Changing the SLA, queue stats, or claim/release logic.
- Identity provider integrations (Stripe webhook auto‑approval stays as is).

### Verification after build

1. Load `/admin/verification`, open Jordon Gumbley.
2. Confirm 3 steps render with correct pills (ID ✓, Insurance ✗ expired, Qual ⚠ manual).
3. Try Approve without ticking the manual‑qual checkbox → button disabled with tooltip.
4. Tick the checkbox → override reason auto‑fills, "Approve as Verified" enables (insurance still blocks Pro).
5. Type a reviewer note + submit → no `window.alert`, mutation succeeds, queue refreshes.
6. Open the Identity tab → clicking a row opens the same workspace, not a separate dialog.
