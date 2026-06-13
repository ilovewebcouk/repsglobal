# Verification QA — Phase 2.1 hardening

Brutally honest read of the verification stack, plus the one obvious fix you just spotted (sidebar tier leak).

## Where you are vs. world-class

**What's actually working:**
- Stripe Identity is wired end-to-end. The webhook (`/api/public/payments/webhook`, lines 124-185) listens to all 5 identity events, maps `verified → approved`, pulls `verified_outputs` (name + DOB), writes them back, stamps `reviewed_at`. So "Continue ID check → In review" means: Stripe runs the check (usually 30s–5min) → webhook fires → your row flips to `approved` automatically → the dashboard polls every 8s and updates. No manual admin step needed for a clean pass.
- The pro card already handles polling, badge states, and a "Restart ID check" path on rejection.

**Where it falls short of 10/10 (in priority order):**

1. **Sidebar tier leak (your finding).** `dashboard_.verification.tsx`, `dashboard.tsx`, `dashboard_.cpd.tsx`, and `dashboard_.settings.tsx` render `<DashboardShell role="trainer">` without passing `tier`. `trainerNav(undefined)` falls through to `PRO_NAV`, so a Verified user sees the full Pro sidebar (Leads / Clients / Calendar / Programs / etc.) the moment they hit any of those pages. Should always be `VERIFIED_NAV` for Verified tier.
2. **No name-match gate on auto-approve.** Stripe confirms the doc is real and the selfie matches the doc — it does NOT check the name on the doc matches the REPS profile name. Today a "John Smith" account could upload a real ID for "Jane Doe" and be auto-approved. This is the single biggest credibility hole.
3. **Admin has no visibility of approved/historical verifications.** `listPendingVerifications` filters to `['submitted','changes_requested']`. Once approved, the case vanishes — no "Approved" tab, no audit trail in the UI, no way to revoke. Identity has no admin index at all (the admin verification page only shows cert submissions; identity is invisible until tied to a cert case).
4. **No admin override for identity.** If a check gets stuck "processing", or Stripe rejects something that's actually fine, there's no manual approve/reject UI.
5. **"In review" copy gives no ETA.** Pros see "In review" with no "usually 1–5 mins" reassurance. Feels broken when it isn't.

Deferred (worth doing, not this pass): email on approve/reject, 24-month re-verification, passport-expiry watcher, webhook env-mismatch logging.

## Plan — step by step

You said "step by step, get verified first". So this plan is scoped to that. Each step is independently shippable.

### Step 1 — Fix the sidebar tier leak (smallest, do first)

Pass `tier` into `<DashboardShell>` from every trainer route that's missing it. Use the existing `useTrainerTier()` hook.

Files:
- `src/routes/_authenticated/_professional/dashboard.tsx`
- `src/routes/_authenticated/_professional/dashboard_.verification.tsx`
- `src/routes/_authenticated/_professional/dashboard_.cpd.tsx`
- `src/routes/_authenticated/_professional/dashboard_.settings.tsx`
- `src/routes/_authenticated/_professional/dashboard_.profile.tsx` (check + fix if same issue)

No UI redesign, no schema change. ~5 lines per file.

### Step 2 — Name-match gate on auto-approve

In `handleIdentityEvent` (webhook), after pulling `verified_outputs.first_name/last_name`:

- Load `profiles.full_name` for the pro.
- Normalise both (lowercase, trim, strip punctuation, drop common titles "Mr/Mrs/Ms/Dr/Prof", collapse whitespace).
- Match rule: pass if first + last on doc both appear as whole words in the profile name (or vice versa). So `"James Wilson"` ↔ `"James Robert Wilson"` ✅, `"Jane Doe"` ↔ `"John Smith"` ✗.
- If mismatch: override `status='needs_more_info'` (NOT `approved`), set `stripe_reason='Name on ID ("<doc name>") does not match your REPS profile name ("<profile name>"). Update your profile to match your legal name, or restart the check with the correct ID.'`.

The existing pro card already renders `stripe_reason` in an amber banner and shows "Restart ID check" — no UI work needed.

Files:
- `src/routes/api/public/payments/webhook.ts` — add `nameMatches()` helper + check inside `handleIdentityEvent`.

### Step 3 — Admin: approved + history view + identity tab

Extend the existing admin verification page:

- Replace the `All / Mine / SLA risk` pills with status pills: `Pending · Approved · Rejected · Changes requested`. Default = Pending (preserves current behaviour).
- Extend the server fn: add `listVerifications({ statuses })`; keep `listPendingVerifications` as a thin alias.
- Workspace pane for an approved case: show reviewer, decision time, granted titles, public profile link, and a `Revoke` action (writes `verification_decisions` with `decision='revoked'`, sets pro back to `unverified`, with a required reason).
- Add a sibling `Identity checks` view (same page, new tab): table of all `identity_documents` rows with name / status / vendor / date, search, status filter, and admin override buttons (approve / reject / mark needs-info — all writing a stamped audit row).

Files:
- `src/lib/verification/verification.functions.ts` — add `listVerifications`, `revokeVerification`.
- `src/lib/verification/identity.functions.ts` — add `listIdentityChecks`, `adminOverrideIdentity` (admin-gated).
- `src/routes/admin_.verification.tsx` — add tabs, status pills, approved workspace block, identity view.

No schema changes — `identity_documents`, `verification_submissions`, `verification_decisions` already have every column needed.

### Step 4 — Pro "in review" copy polish

In the identity card's pending state:
- Add `"Usually takes 1–5 minutes — refresh or check back shortly."` line.
- If pending >10 minutes, surface a `"Taking longer than expected? Contact support."` link.

Files:
- `src/routes/_authenticated/_professional/dashboard_.verification.tsx`

## What to confirm before I touch code

1. **Order:** Step 1 (sidebar) on its own first, then 2 → 3 → 4 in separate passes? Or batch 1+2 together since both are small and high-value?
2. **Name-match strictness:** OK with the "subset match" rule above (so middle names don't false-positive), or do you want strict exact-match?
3. **Revoke action:** should it also remove granted `pro_titles` and clear `primary_title_slug`, or leave titles in place and only flip `verification_status`?