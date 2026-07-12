## Goal

Training provider verification becomes a strict **3-step lock-in**. Once each step is submitted it is permanent; the provider can't edit it later. Profile becomes read-only mirror of what was locked in during verification. Nothing else on the dashboard unlocks until all 3 are complete.

**Scope:** Training providers only (`account_type = 'organisation'` / `trainerTier === 'training_provider'`). Individual trainers untouched.

---

## The 3 verification steps (locked, ordered display, any order to complete)

```text
01  Identity            Stripe Identity  → writes profiles.full_name (source of truth)
02  Training provider name  Free-text lock-in → writes profiles.full_name (only if 01 not yet done) OR just confirms 01's name
03  Provider domain     Domain email confirm → writes professionals.website + verified flag
```

**Decision required before build:** what does step 02 actually capture?

Option A — **Stripe identity IS the provider name.** Step 02 becomes a one-time "Confirm this is your trading name" acknowledgement of the Stripe name (a single "Lock in as trading name" button). No free-text. `profiles.full_name` = Stripe identity name, locked forever.

Option B — Step 02 is a **separate free-text trading name** the provider types once, reviewed by admin, then locked. `profiles.full_name` = that trading name (independent of Stripe identity). Stripe identity remains stored on `professionals.identity_verified_name` for admin only.

I recommend **Option B** — a training provider's trading name ("Smart Dog Training") is almost never the director's legal identity ("Scott Cameron McKay"). The existing `provider_name_requests` table already models exactly this, but as an admin-approved *change*. We repurpose it as the one-time **lock-in** at signup.

The rest of the plan assumes Option B. Confirm before I build.

---

## Behaviour

### Verification page (`/dashboard/verification`, provider variant)

Three numbered steps. Each step, once locked, shows:
- Green "Locked" pill
- Locked value (read-only)
- Copy: *"Locked in on {date}. This can't be changed. Contact support if wrong."*

Header count: **"X of 3 — keep going"** / **"Verified — badge live"**.

Remove the "Auto-flagged: name mismatch with profile" banner (already agreed — Stripe is truth for identity; trading name is separate and locked separately).

### Profile page (`/dashboard/profile`, provider variant)

Identity card becomes fully **read-only** for providers. Shows three rows:
- Provider name (from `profiles.full_name`) — read-only, no "Submit name change" button
- Legal identity (from `professionals.identity_verified_name`) — read-only
- Provider domain (from `professionals.website`) — read-only

All three link to `/dashboard/verification` with copy: *"Locked during verification."*

The current "Submit name change" flow is **removed** for providers. (Keep the `provider_name_requests` table + admin queue for support-driven corrections only; expose via support ticket, not self-service.)

### Hard gate until all 3 steps complete

Currently `IdentityGateWall` blocks dashboard when identity isn't approved. Extend to a **provider verification gate**: for `training_provider` accounts, if any of the 3 steps isn't complete → block every `/dashboard/*` route except `/dashboard/verification` and `/dashboard/support*`. Reuse `IdentityGateWall` styling, retitle "Complete verification to unlock your dashboard" with the 3 checkboxes.

### Login prompt dialog

Rewrite `VerificationPromptDialog` for training providers to show the 3 provider steps (not the trainer's identity/insurance/qualifications set). Copy makes the lock explicit: *"Complete all 3 steps to unlock your dashboard. Once locked, these details can't be changed."*

Non-providers keep the existing 3-step trainer dialog.

---

## Files touched

- `src/components/dashboard/organisation/VerificationPage.tsx` — add step 02 (Trading name lock-in), retitle header "X of 3", add "Locked" state per step
- `src/lib/verification/provider-name.functions.ts` — add `lockInProviderName` server fn (first-time only, no admin review); keep existing change-request path for admin use
- `src/components/dashboard/organisation/ProviderProfilePage.tsx` — Identity card → read-only, remove "Submit name change" UI, add "Locked during verification" links
- `src/routes/_authenticated/_professional/route.tsx` — extend gate: providers with <3 steps get gate wall
- `src/components/dashboard/verification/IdentityGateWall.tsx` — provider variant showing 3-step checklist
- `src/components/dashboard/verification/VerificationPromptDialog.tsx` — provider branch with 3 provider steps + locking copy
- `src/lib/verification/trust.functions.ts` — expose `providerNameLocked` boolean + completion count for providers

**No DB migration needed** if we reuse `provider_name_requests` (mark first row as `status='approved', auto_locked=true`). If we want a cleaner column, one migration to add `professionals.provider_name_locked_at timestamptz`.

---

## QA sweep after build

1. Grep: no editable "Provider name" input remains outside `/dashboard/verification` for providers.
2. Provider with 0/1/2/3 steps → correct gate, correct badge, correct profile read-only state.
3. Individual trainer path unchanged (identity/insurance/qualifications flow, Profile still editable where it was).
4. Admin verification panel still shows both `profiles.full_name` (trading) + `identity_verified_name` (Stripe).
5. Playwright screenshots: verification page (0/3, 2/3, 3/3), profile page locked, login dialog for provider.

---

## One question before I proceed

**Option A (Stripe name IS the trading name, one-click lock)** or **Option B (separate typed trading name, admin-reviewed once then locked forever)**?

My recommendation: **Option B** — matches real-world provider naming, matches your screenshot ("Test Profile" ≠ "SCOTT CAMERON MCKAY"), and the plumbing already exists.