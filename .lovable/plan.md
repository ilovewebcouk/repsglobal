# Phase 2.1 — Verified £99/yr + Pro Founding £59/mo: end-to-end wire-up (10/10)

Locked visual mock-ups are the source of truth. Data wiring only — no redesigns. Ship Sub-pass 0 first (split into 0a–0e), then A→F in order. Every step behind a feature flag with a single-line DoD.

## Success metrics

| Sub-pass | DoD | Target |
|---|---|---|
| 0 Verification | Identity + Quals auto-resolve end-to-end with chip-lit, audit trail, immutable legal name | ≥90% auto-resolve identity; ≥85% auto-approve quals; <4min median chip-lit; <60s admin/decision; **≤£3 Stripe Identity cost per approved pro** |
| A Directory | Anonymous `/find-a-professional?city=...&specialism=...` returns real pros, tier-sorted | P95 <300ms; <8% zero-results |
| B Shop-front | Verified = Lite `/c/$slug`; Pro = Full editor + live | ≥70% Verified pros have `/c/$slug` within 7d |
| C `/pro/$slug` | Real loader, real services, Enquire CTA from mock-up live | 0 placeholder pros visible |
| D Enquiries | Anonymous submit → Resend email → `/dashboard/enquiries` | ≥40% reply rate, <2% spam |
| E Reviews | Collect + display + post-session invite, `/dashboard/reviews` | ≥30% invited→submitted |
| F Bookings | Existing UI wired to live data | Sub-pass-local DoD |
| G Programme Generator (2.2) | Pro-only; if not live: wait-list stub | Wait-list email captured |

## Sub-pass 0 — Verification (split into 5 flag-gated steps, each <½ day)

### 0a — Identity status fix + dry-run backfill
- `webhook.ts:251` writes `identity_status='approved'` (not `'verified'`).
- **Idempotency**: `stripe_event_id` unique index on `verification_decisions`; webhook no-ops on duplicate.
- Dry-run migration first; prod backfill is a separate one-line migration after counts verified.
- **DoD**: webhook replay does not mutate an approved row; backfill report matches expected count.

### 0b — Three-names model + immutable legal name
- `profiles.full_name` (legal, from ID, matches certs — regulated qualifications), `display_name` (public), `business_name` (shop-front/invoices).
- Trigger `tg_lock_full_name_after_identity_approved` + RLS — `full_name` read-only post-approval.
- `forceResetLegalName` server fn = admin-only.
- Slug derived from `display_name`.
- **DoD**: pro cannot edit legal name after approval; admin override writes `identity_name_changes` row.

### 0c — Qualifications hard/soft gates ✅ DONE + adaptive action bar
- **Hard gates** (cannot Approve through): name match ≥0.85, awarding body recognised (Ofqual list, never CIMSPA), not expired, cert number format valid, file fingerprint not duplicate.
- **Soft gates** (typed override reason): OCR-vs-typed name, year plausible, insurance present (Pro-only block).
- **Adaptive action bar**:
  - all pass → "Approve as Pro" + "Approve as Verified"
  - identity+qual pass, insurance missing → "Approve as Verified" + "Request insurance"
  - hard gate fails → "Reject" + "Request changes" only
- Replace checkbox-theatre with auto-derived "Gates passed" panel.
- SLA badge only on Pending. Remove "Send reminder" from Approved. Per-qualification expiry rules engine.
- **DoD**: Scott-Parker cert under Katie-Gibbs account cannot be Approved.

### 0d — OCR + awarding-body verify links ✅ DONE
- OCR cert-holder name from uploaded file (`cpd.functions.ts:extractCertificateFields`); side-by-side with profile name in admin Qualification card (emerald if match, amber if mismatch).
- Stored cert number + qualification number + awarding body + year already persisted on `verification_submissions`; rendered on the card.
- One-click verify buttons: Ofqual Register (when qual number matches `NNN/NNNN/X`) + awarding-body lookup page (`src/lib/verification/awarding-body-verify.ts`).
- **DoD**: each approved cert has stored cert number + verify link rendered in admin row.

### 0e — Observability, flags, full timestamps ✅ DONE
- `verification_decisions` already extended (0a/0c): `stripe_event_id` unique, `gates_snapshot`, `override_reason`.
- `identity_name_changes` audit log live (0b).
- `feature_flags` table seeded with 11 Phase 2.1 flags (0a–0e on, A–G off).
- `TimeAgo` component (`src/components/verification/TimeAgo.tsx`) renders `5m ago` with a full `13 Jun 2026 · 18:42` tooltip everywhere in admin verification.
- Views `v_identity_review_queue` and `v_qualifications_review_queue` (security_invoker) with `resubmission_count` and `submission_count`.
- **DoD**: every state transition has a decisions row with full timestamp; relative time always tooltips an absolute one.

## Pro-side state matrix (locked copy + CTA)

| State | Pro sees on `/dashboard/verification` | CTA |
|---|---|---|
| **Pending identity** | Info card: "We're verifying your ID with Stripe. Usually takes under 2 min." | "Open Stripe Identity" |
| **Pending quals** | Info card with SLA: "Submitted [HH:MM]. Reviewed within 24h." | None (waiting) |
| **Soft-gate warn — name mismatch** | Fix-it card: "Your ID says X. Your profile says Y." | "Use my ID name" + "Restart with a different ID" |
| **Soft-gate warn — insurance missing** | Fix-it card: "We can approve you at Verified now, or wait for insurance to unlock Pro." | "Approve me at Verified" + "Upload insurance" |
| **Rejected** | Reason card + retry policy: 3 attempts / 30 days then admin-only unlock | "Re-submit" (counter visible) |
| **Approved** | Green chip lit, expiry date if applicable, "Renew" 30d before | "View public profile" |

## Abuse / re-submission limits

- Identity: cap 3 re-submissions / 30 days, then admin-only unlock (Stripe Identity is billable per check).
- Qualifications: cap 5 re-submissions per cert slot.
- Enquiries (Sub-pass D): honeypot + Cloudflare Turnstile + per-IP and per-pro caps. *(Note: backend has no standard rate-limit primitive — Turnstile + DB-counter ad-hoc limit only, confirmed tradeoff.)*

## Notification spec (Resend templates exist before 0 ships, not D)

| Trigger | Channel | Template |
|---|---|---|
| Identity approved | email + in-app toast | `identity-approved` |
| Identity rejected | email + in-app | `identity-rejected` |
| Identity needs fix | email + in-app | `identity-fix-it` |
| Qual approved | email + in-app | `qual-approved` |
| Qual rejected/changes | email + in-app | `qual-changes` |
| Qual/insurance expiring in 30d | email | `expiry-30d` |
| Qual/insurance expired | email + in-app | `expired` |

## Demo account seed (`demo-verified@repsuk.org`)

Scripted seed migration: identity approved · 1 qual approved · 1 qual expiring in 14d · 1 qual rejected · insurance current. Every state screenshot-able without faking data.

## Sub-pass order (after 0)

```
0a–0e Verification (split, flag-gated)          ✅ DONE
A  Migration + RLS for new tables               ✅ DONE (shop_fronts, services, enquiries, reviews, programmes_waitlist)
B  searchProfessionals server fn + /find-a-professional wired (P95<300ms)
C  Shop-front: Lite (Verified, auto-seeded) + Full editor (Pro) + live /c/$slug  ✅ DONE (auto-seed trigger; getShopFrontBySlug overlays mock on /c/$slug; /dashboard/shop-front editor live)
D  /pro/$slug real loader + Enquire CTA live    ✅ DONE (pro.$slug.index already loads via getPublicProfileBySlug; enquire page wired to submitEnquiry server fn + toast)
E  Anonymous submitEnquiry + Lovable Emails + /dashboard/enquiries tab  ✅ DONE (enquiry-notification template via queue; inbox route with read/replied/archived actions; nav item in Verified + Pro)
F  Reviews: collect + display + post-session invite + /dashboard/reviews tab  ✅ DONE (submitReview/listMyReviews/respondToReview server fns; /pro/$slug/review collection route; live reviews + reply composer overlay on dashboard reviews page)
G  Phase 2.2 — Programme Generator (Pro-only). If not shipped: "Coming this month" stub + wait-list.  ✅ DONE (joinProgrammeWaitlist + isOnProgrammeWaitlist server fns; "Coming this month" banner with email + first-build note capture at top of /dashboard/programs)
```

`/dashboard/enquiries` and `/dashboard/reviews` are new sidebar tabs in `DashboardShell.tsx` — empty-state + first-row demo for seed accounts.

## Risks + rollback
- Each sub-pass behind `feature_flags`; flip off without redeploy.
- Webhook idempotency via `stripe_event_id` unique index.
- Backfill dry-run → counts verified → prod migration.
- Resend domain auth + bounce/complaint wired before Sub-pass 0 ships.
- Locked screens in `mem://design/locked-*` may not change visually — data wiring only.

## Technical references
`webhook.ts:251`, `webhook.ts:217-228`, `cross-checks.ts`, `trust.functions.ts:14-30`, `admin_.verification.tsx`, `useTrainerTier.ts`, `DashboardShell.tsx`, `src/lib/billing.ts`, locked mock-ups in `src/mockups/`. New tables: `shop_fronts`, `enquiries`, `reviews`, `services`, `programmes_waitlist`, `identity_name_changes`, `feature_flags`; extend `verification_decisions` with `stripe_event_id`. Views: `v_identity_review_queue`, `v_qualifications_review_queue`. Trigger: `tg_lock_full_name_after_identity_approved`.

Approve to switch to build mode and ship 0a first.
