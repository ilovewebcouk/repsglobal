# Verification Module — 10/10 Rebuild Plan

## Brutal truth from the QA pass

Most of the plumbing exists. What's broken is **what the user sees and what happens after they upload**:

1. **Two pages do half the job each.** Qualification uploads live on `/dashboard/cpd`. Identity + Insurance live on `/dashboard/verification`. The Verification page even tells you "go to CPD to manage qualifications." That's not a module — that's a hand-off.
2. **The Stripe Identity loop is broken at the last step.** Stripe verifies the user, the webhook updates `identity_documents`, but it never writes the verified name back to `professionals`. So the name-match gate on certs is dead, and the public profile has no source of truth.
3. **The public profile is 100% mock.** "Verified" chip, "Insurance until 12 Dec 2026", titles — all hardcoded in `c.$slug.tsx`. None of the real data we collect is ever shown publicly. There is no reward for getting verified.
4. **No renewal automation.** The `verification_renewal_nudges` table exists, with the right schema. Nothing reads it. Nothing sends nudges.
5. **No admin review for Identity or Insurance.** Only certificates have an admin queue. ID + insurance can only be reviewed by hand in SQL.
6. **Insurance cover amount is stored wrong.** `1` → `1,000,000` because the save multiplies by 1,000,000 but the read doesn't divide. Silent data corruption.
7. **Cosmetic noise on CPD page:** "Upcoming courses", "AI learning plan", "Activity log" are hardcoded mock blocks. They make CPD look fake.

---

## What "Verification" becomes

**One module. One sidebar entry. One page. Three legs.**

- **Identity** — Stripe-hosted ID check + selfie. Locks legal name on approval.
- **Insurance** — Provider, policy number, cover, expiry, certificate upload. Admin review.
- **Qualifications** — *Read-only mirror* of the CPD-side certs. Status + titles unlocked. "Manage" button links to CPD.

CPD stays the place where certificates are **uploaded and managed**. Verification is the place where the user sees **their trust posture**.

```text
/dashboard/verification
┌───────────────────────────────────────────────────────────┐
│ Verification                                              │
│ Your trust posture on REPs. Three checks. One page.       │
│                                                           │
│ [Trust meter: ID ✓  Insurance ✓  Qualifications ✓ ]       │
│   • Verified status: ACTIVE                               │
│   • Public title: "Personal Trainer (NCFE L3)"            │
│   • Renews: 12 Dec 2026 (insurance) · 31 Mar 2028 (qual)  │
│                                                           │
│ ── Identity ─────────────────── [approved · Katie Gibbs]  │
│   Verified by Stripe Identity on 8 Jun 2026.              │
│   Legal name locked. [View ID details]                    │
│                                                           │
│ ── Insurance ────────────────── [active · expires 12 Dec] │
│   Insure4Sport · £2m PL · Policy IS-12345                 │
│   [Replace certificate]  [Update policy]                  │
│                                                           │
│ ── Qualifications ──────────── [1 approved · 0 pending]   │
│   NCFE Level 3 Certificate in Personal Training · 2024    │
│   Title earned: Personal Trainer                          │
│   [Manage on Education & CPD →]                           │
└───────────────────────────────────────────────────────────┘
```

Sidebar on this route: **only "Back to dashboard"** (locked in already).

---

## The 6 work packages

### 1. Close the Stripe Identity loop (CRITICAL — unblocks everything)

**File:** `src/routes/api/public/payments/webhook.ts` (`identity.verification_session.verified` handler).

On `verified`, after updating `identity_documents`, also write to `professionals`:
- `identity_verified_name` = `verified_outputs.name.first_name + last_name`
- `identity_verified_dob` = `verified_outputs.dob`
- `identity_verified_at` = `now()`
- `identity_status` = `'verified'`
- `stripe_identity_session_id` = session id

On `requires_input` / `canceled`: set `identity_status` accordingly, don't clear the name.

This single change fixes the dead name-match in `submitCertificate` and makes the public profile work.

### 2. Rebuild the Verification page UI

**File:** `src/routes/_authenticated/_professional/dashboard_.verification.tsx`.

Replace the 4-card grid with the layout above. Concretely:

- **Trust meter header** — one card, three ticks (ID, Insurance, Qualifications), live unlock state, public title preview, next renewal date.
- **Identity section** — collapsed by default if approved (shows "approved · Katie Gibbs", expand for details). If `pending`, show the Stripe "in review" empty-state. If `not_started`, show the "Continue ID check" CTA.
- **Insurance section** — same collapse-when-done pattern. If active, show provider/policy/cover/expiry + "Replace certificate" / "Update policy". If missing, show the form inline.
- **Qualifications section** — read-only list of approved certs from `verification_submissions` (full column select — fix the under-selection), plus earned titles. "Manage on Education & CPD" button.

Delete the "TierUnlockCard" — its info is folded into the trust meter.

### 3. Public profile badges (the payoff)

**File:** `src/routes/c.$slug.tsx`.

Stop using the hardcoded `coach` object for verification data. Add a server fn `getPublicVerificationBadges(proId)` that returns:
- `identity: { verified: boolean, verified_at }`
- `insurance: { active: boolean, expires_at, provider }`
- `qualifications: [{ title, awarding_body, year }]`
- `primary_title: { slug, label }`
- `verified_since: <earliest approval date>`

Wire the shield chip, "verified since 2023" copy, and qualifications list to this fn. **This is the moment "verification" stops being decorative.**

(Other locked profile pages — `pro.$slug` — get the same treatment in the same PR.)

### 4. Insurance cover-amount bug fix + admin review

- **Fix the storage bug.** Pick one convention. Recommend: store **pounds as integer** (no multiplier). Migration to divide existing rows by 1,000,000. Update save + display.
- **Admin review surface.** Extend `admin_.verification.tsx` (or add a tab) so admins can approve/reject `insurance_policies` rows the same way they review `verification_submissions`. Sets `status = 'active' | 'rejected'`, writes `admin_note`, `reviewed_by`, `reviewed_at`.
- **Admin review for identity** — same pattern, but only for `vendor = manual` rows (Stripe-verified rows are auto-approved by the webhook).

### 5. Renewal automation (the "world-class" bit)

- **Daily cron** via Lovable's published cron URL hitting a new server route `api/public/cron/verification-nudges`. Verify a shared secret header.
- Logic: for every `insurance_policies` row with `status = 'active'` and `expiry_date` within 60 / 30 / 7 days, insert a row in `verification_renewal_nudges` (UNIQUE handles dedup) and enqueue an email via the existing `enqueue_email` function.
- On expiry day: flip insurance `status = 'expired'`, drop Pro entitlements that depend on insurance, surface a banner on `/dashboard/verification`.
- Same pattern for qualification `expiry_date` where present.

### 6. CPD page clean-up (scope minimum)

Hide the three mock blocks until they're real:
- Remove "Upcoming courses" panel.
- Remove "AI learning plan" card.
- Remove "Activity log" sidebar.

Keep: verification ring, EarnedTitlesPanel, certificates list with upload dialog, REPS membership card (after we wire its Insurance/DBS/First-aid rows to real data).

The CPD page becomes focused: **upload certs, see titles, see what's pending**. No fake content.

---

## Sidebar consolidation

- **VERIFIED_NAV:** Dashboard, **Verification**, Education & CPD, Public Profile, Settings. (Verification first after Dashboard — it's the activation gate.)
- **PRO_NAV:** keep Verification in "Money & Admin"; keep Education & CPD in "Grow". The two stay distinct because they are now distinct: Verification = trust posture; CPD = lifelong learning.

---

## Order of execution (small PRs, each shippable)

| # | PR | Risk | Unblocks |
|---|---|---|---|
| 1 | Webhook writeback to `professionals` | Low | Public badges, name-match |
| 2 | Verification page rebuild (trust meter + 3 collapsed sections) | Low | UX is 10/10 |
| 3 | Public profile reads real verification data | Medium (touches locked page — needs your nod) | Payoff for the pro |
| 4 | Insurance cover-amount migration + admin review | Medium | Data integrity, admin ops |
| 5 | Renewal nudges cron + email enqueue | Medium | Lifecycle automation |
| 6 | CPD page strip the three mock panels | Low | Removes fake-app smell |

---

## Out of scope (deliberately)

- DBS / first-aid check (mentioned on CPD as "Not yet provided"). Add as a separate phase — needs partner selection.
- Veriff fallback. Stripe Identity covers it; the schema orphans stay as future-proofing.
- Migrating the existing locked `/c/$slug` design — only the data plumbing changes; visual layout stays.

---

## Confirm before I start

- **PR 3 touches `/c/$slug`**, which is on the locked-coach-shopfront list. Visual layout stays identical — only the data source for the chips, "verified since", and qualifications list changes. Confirm OK.
- **Insurance bug fix** changes how cover is stored. I'll run a migration to convert existing rows. Any insurance rows you've added in testing will get divided by 1,000,000 — confirm OK.
- **Cron** runs on the published URL only (preview has no scheduler). Confirm OK.

Say "ship it" and I'll start with PR 1 (webhook writeback) and PR 2 (page rebuild) in parallel, since they don't touch the same files.
