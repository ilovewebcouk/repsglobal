
# Verification Module — 10/10 Rebuild

## Mental model (locked)

- **Tier** = what you pay for. Verified (£99/yr) = verification module only. Pro (£59/mo) = verification module **+ software**. Studio later.
- **Verification module** = the same product surface for Verified and Pro. Three sub-checks: **Identity**, **Qualifications**, **Insurance**.
- The module is the **single source of truth** for:
  1. Public profile **status chips** (ID-checked, Credentialed, Insured)
  2. **Legal name on the register** (name on ID → name on profile, locked)
  3. **Titles** a pro can pick (unlocked by approved qualifications via `pro_titles.source_submission_id`)
  4. **Publish gate** for the public listing

Tier never changes what the module does. Pro just additionally unlocks the software workspace (leads, clients, messaging, bookings, etc.).

## What's actually broken today

1. Sidebar leaks the full Pro nav on `/dashboard/verification` for Pro users (16 items) — should be the same minimal context for both tiers while inside the module.
2. "Continue ID check" is a plain `<a href>` to Stripe — no in-app state, no recovery, no polling feedback. Returns to the same page with `?stripe_identity=complete` and looks identical.
3. Name-on-ID never gets written back to `profiles.full_name` / `professionals.legal_name`. Pro can pass ID as "Joseph Smith" then rename to "Big Joe Fitness" and the register lies.
4. Single "verified ✓" boolean instead of three independent status chips — consumers can't tell which checks passed.
5. No renewal nudges wired (`verification_renewal_nudges` exists but unused). Insurance expires silently. ID never re-attests.

## Target architecture

### One module, one URL, two tiers

```
/dashboard/verification         ← Verified + Pro, identical UI
  ├─ Identity      (Stripe Identity)
  ├─ Qualifications (Ofqual-regulated awarding bodies → unlocks titles)
  └─ Insurance     (upload + expiry)
```

Single vertical page with three section cards stacked (not tabs — tabs hide progress). Top of page = composite progress: "2 of 3 checks complete · Insurance expires in 14 days".

Sidebar inside the module collapses to **module-only nav** for both tiers (Overview, Identity, Qualifications, Insurance, Back to dashboard). No Pro software links while in `/dashboard/verification/*`. Pro users return to full software nav on any other route.

### Three independent status chips (not one badge)

On every public profile + search card:

```
✓ ID-checked     ✓ Credentialed     ✓ Insured
```

Each chip is independent. A "Fully verified" composite badge sits above when all three are green. Directory filters: `?id_checked=1&credentialed=1&insured=1`.

Stored on `professionals` as three booleans derived from the latest approved record in each table (computed on read, or denormalised with a trigger — TBD in build).

### Name-on-ID = name-on-register (locked)

1. Stripe Identity webhook approves → writes `identity_documents.name_on_doc`
2. Same webhook upserts `profiles.full_name` AND `professionals.legal_name` from the verified name
3. Once `identity_documents.status = 'approved'`, **`legal_name` becomes read-only** in the dashboard — only re-running ID check can change it
4. Public profile renders `legal_name` as the canonical name. `trading_name` stays freely editable and shows as the headline; legal name appears under it as "Verified as: …"
5. Add `professionals.legal_name TEXT` (nullable, locked-after-approval enforced at the function layer)

### Qualifications unlock titles (already partially wired)

- `verification_submissions.status = 'approved'` → creates/updates a row in `pro_titles` with `source_submission_id`
- Title chooser in the profile editor only lists titles backed by an approved, non-expired submission
- When a submission expires or is revoked, the dependent `pro_titles` row is auto-archived and the title falls off the public profile

### Stripe Identity flow (proper)

- "Start ID check" / "Continue ID check" becomes a button, not an `<a>`
- Click → `createStripeIdentitySession` server fn → opens hosted page in a **new tab**
- Original tab switches to **"Waiting for Stripe…"** card with: live 8s poll, Cancel button, Restart button, last-updated timestamp
- Webhook updates `identity_documents.status` → poll detects → card flips to Approved / Needs more info / Rejected with next-step CTAs
- `?stripe_identity=complete` return path shows an inline status block instead of silently stripping the query

### Renewals (table already exists)

Wire `verification_renewal_nudges` for real:

- Insurance: cron checks `valid_until`; enqueues email at T-30 / T-14 / T-7 / T-1; auto-drops "Insured" chip the day after expiry
- Qualifications: same nudges if `expiry_date` is set
- ID: re-attest annually (Stripe Identity is point-in-time)

Drop chip → not deletion. Submission stays, chip flips grey "Expired — renew", profile keeps the other green chips.

## Sub-checks summary

| Check         | Source              | Approval writes to                     | Drives                              |
| ------------- | ------------------- | -------------------------------------- | ----------------------------------- |
| Identity      | Stripe Identity     | `identity_documents`, `profiles.full_name`, `professionals.legal_name` | "ID-checked" chip, legal name lock  |
| Qualifications| Admin review        | `verification_submissions`, `pro_titles` | "Credentialed" chip, title chooser  |
| Insurance     | Upload + admin review | `insurance_policies`                  | "Insured" chip, T-30/14/7 nudges    |

## Build order (5 steps, no scope creep)

1. **Sidebar refactor** — `DashboardShell` switches to module-only nav whenever route matches `/dashboard/verification/*`, regardless of tier. Lock with a doc comment.
2. **Verification page rebuild** — single vertical page, three section cards, composite progress header, identical render for Verified and Pro. Remove the `useTrainerTier()` branch.
3. **Stripe Identity flow** — new-tab + waiting state + poll + Cancel/Restart + explicit `createStripeIdentitySession` recovery fn + inline return-status block.
4. **Name-on-ID writeback + lock** — migration adds `professionals.legal_name`; webhook writes verified name to `profiles.full_name` and `professionals.legal_name`; dashboard locks the field once approved; public profile renders `trading_name` headline + "Verified as: legal_name" sub-line.
5. **Three chips + renewal nudges** — derive `id_checked` / `credentialed` / `insured` on the public profile + search card; wire `verification_renewal_nudges` cron for insurance + qualification expiry; auto-drop chip the day after expiry.

## Deferred (explicitly out of v1)

- Auto-insurance lookup via Hiscox / Insure4Sport APIs
- DBS / background check as a fourth pillar
- Public suspension state on profiles
- Studio-tier verification differences (Studio uses the same module unchanged)

## Open questions (need answers before step 2 starts)

1. **Public profile name display:** trading name headline + "Verified as: legal_name" underneath (Airbnb-style), **OR** legal name only and no trading name field at all (strictest)?
2. **Access during pending ID review:** Verified-tier user is paying £99/yr but ID isn't approved yet. Do we (a) let them see the verification module and a read-only "your profile will go live when ID is approved" preview, or (b) block everything except the module until approved?
