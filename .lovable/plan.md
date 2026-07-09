## Trading name lifecycle — QA walkthrough

No code changes proposed; this documents the current behaviour so you can confirm it's what you want. If anything is wrong, tell me which step to change.

### 1. Where the name lives

- **Single source of truth:** `profiles.business_name` (one column, per user).
- **Pending changes** live in `provider_name_requests` with `status = 'pending' | 'approved' | 'rejected'`. Not shown publicly.

### 2. How a name is added (first time)

Dashboard → `/dashboard/verification` → **Trading name** card.

1. If `profiles.business_name` is empty, the card renders in amber "action needed" state with an input + **Set name** button.
2. On submit, `submitProviderNameChange({ requested_name })` runs:
   - Checks for an existing pending request → rejects if one exists.
   - Sees `current` is empty → **writes directly to `profiles.business_name`** (via `supabaseAdmin`), regenerates the provider slug, and returns `{ applied: true }`.
   - **No admin approval on first set.** Name goes live immediately.
3. UI refetches `getMyProviderNameStatus`; card flips to locked state.

### 3. When the card becomes "locked"

As soon as `profiles.business_name` is non-empty (`hasName === true`), the card shows:

- Green check icon
- The approved name in a read-only pill
- Copy: *"Locked. Contact REPs support to change your trading name."*
- **No input, no button, no "Request change" affordance.**

The `submitProviderNameChange` server fn still exists but is no longer reachable from the provider dashboard.

### 4. How a locked name changes

Only two paths, both admin-side:

- **Support / admin** edits `profiles.business_name` directly (or approves a `provider_name_requests` row created out-of-band).
- The `approveProviderNameRequest` admin fn (in the same file) writes the new name to `profiles.business_name` and marks the request approved.

Providers themselves have no UI to trigger a change.

### 5. Downstream effects of setting/changing the name

- **Provider slug** (`professionals.slug`) is regenerated from the new name on first-set and on admin approval.
- **Submission gate:** `submitRegulatedPermission(Batch)` and `submitCpdCourse` throw `"Set your trading name…"` when `business_name` is empty **and** `professionals.account_type = 'organisation'`. Individual trainers are not gated.
- **Admin verification queues** and hero labels read `profiles.business_name` as the display name; fall back to `"Unnamed provider"` when null.

### Confirm or change

If any of the following should be different, say which and I'll plan the change:

- (a) Should first-set also require admin approval? Currently it's instant.
- (b) Should providers see a "Request change" flow at all, or is contact-support the final answer? Currently: contact-support only.
- (c) Should individual (non-organisation) providers also be gated by trading name? Currently: no.
