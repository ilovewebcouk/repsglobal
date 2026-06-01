## Goal (unchanged)

Coaches build a **client roster** (quick add + CSV import). The portal invite fires **automatically** the first time any of these happens:

1. Coach marks the client **Confirmed**
2. Coach **assigns the first programme**
3. **First payment received** (stubbed until Stripe is live)

Client gets one branded email → secure link → **Set your password** → lands in their portal.

---

## Revisions from review (this is what's new)

### 1. Cleaner identity model

Three distinct concepts, three distinct columns:

| Concept | Table | Meaning |
|---|---|---|
| Roster entry | `client_roster` | The coach's record of this person, exists before signup |
| Coaching record | `clients` | Training/nutrition/health data; created on portal activation |
| Portal identity | `auth.users` / `profiles` | The actual login |

`client_roster` will carry **two** nullable FKs:
- `client_id` → `clients.id` (set when the coaching record is created)
- `auth_user_id` → `auth.users.id` (set when the portal account is created)

Both populate at the same moment (portal activation) but are kept separate so the roster row stays meaningful even if a client record is later archived or a re-invite recreates the auth user.

### 2. Split lifecycle: client status ⟂ invite status

**Client status** (`client_roster.status`) stays simple:
`prospect → confirmed → active → archived`

**Invite status** (derived from `client_invites`, exposed in the UI as a separate badge):
`none → pending → accepted → expired → revoked`

Coach sees both badges on the roster row — e.g. *"Confirmed · Invite pending (sent 2h ago)"* or *"Confirmed · Invite expired (Resend)"*. This is exactly the "Confirmed but no invite yet / Invite sent but not accepted / Active and logged in" visibility you flagged.

### 3. REPs-branded sender (prerequisite)

`notify.dogboss.io` is the current verified domain on this workspace and is fine for **internal smoke tests only**. Before any real client invite goes out, we switch the sender to a REPs-branded subdomain. Concretely:

- **Decide the production domain** — `reps.global`, `reps.co.uk`, or use the existing `repsglobal.com` if you own it. (Quick check needed from you.)
- Set up `notify.<that-domain>` through the email setup flow (NS records, DNS verification — same flow you did for dogboss).
- The `client-invite` template is sender-agnostic; only the `SENDER_DOMAIN` constant changes.
- **Build proceeds now** against the dev sender; we flip the constant + redeploy before launch.

### 4. Hardened invite token

Already partially there in `client_invites`; we lock it down:

- **Stored as SHA-256 hash** (`token_hash` column already exists; raw token never persisted).
- **Generated** with `crypto.randomUUID()` × 2 (256 bits of entropy) — only the hash hits the DB.
- **Single-use**: marked `accepted` atomically inside `accept_client_invite` RPC; second attempt with the same token returns "already used".
- **Server-validated expiry** (14 days, enforced in the RPC — not the client).
- **Revoked on resend**: old invite row marked `revoked` before new one is issued.
- **Tied to email**: if the coach edits the roster email, the pending invite is auto-revoked and must be resent.
- **Rate limited**: `resendInvite` capped at 1 per hour per roster row, 10 per day per coach.

### 5. Password rules done right

- Min 10 chars, must include a non-letter (no arbitrary symbol classes — they don't help).
- **HIBP via Supabase's native k-anonymity check** — enabled by toggling `password_hibp_enabled: true` on the auth config. The password never leaves Supabase Auth in plaintext; the SHA-1 prefix goes to HIBP, the rest is matched locally. We do **not** roll our own HIBP integration.
- Standard zxcvbn-style strength meter in the UI for feedback only.

### 6. CSV import preview (richer categorisation)

Before any insert, show a 6-bucket review table:

| Bucket | Action |
|---|---|
| ✅ New & valid | Will be added as Prospect |
| ⚠️ Already on your roster (active) | Skip |
| ⚠️ Already on your roster (archived) | Offer "Restore to Prospect" toggle |
| ⚠️ Invalid email format | Skip + show row number |
| ⚠️ Duplicate within this CSV | Dedupe to first occurrence |
| ⚠️ Conflicting email (different name on existing row) | Flag for manual review, do not import |

Hard cap 500 rows. Coach confirms counts before anything is written.

### 7. Payment trigger explicitly stubbed

`markFirstPaymentReceived({ rosterId, paymentRef })` is wired into `ensureInviteSent` but **not exported to any UI or webhook yet**. The function exists so when Stripe goes live, the Stripe webhook handler is one wire-up away — no schema changes needed.

---

## Approved end-to-end flow

```
1. Coach adds / CSV-imports clients → status: prospect, invite: none
2. Coach confirms OR assigns programme OR (later) payment lands
3. ensureInviteSent (idempotent, row-locked):
   - if pending/accepted invite exists → no-op
   - else: insert hashed-token invite row, enqueue branded email
4. Client receives email from notify.<reps-domain>
5. Clicks link → /portal/accept-invite?token=…
6. Server validates hash + expiry + single-use
7. Set Password form (HIBP via Supabase native)
8. supabaseAdmin.auth.admin.createUser → auth.users + profiles row
9. clients row created, coach_client link inserted
10. client_roster updated: status=active, client_id + auth_user_id populated
11. Session set → redirect to /portal
```

---

## What changes structurally (technical)

**Migration**
- `client_roster` table with the two-FK model above + RLS (coach manages own, admin manages all) + grants.
- `client_invites`: add `roster_id` FK, `auto_sent` bool, `trigger_reason` enum, `revoked_at`, `email_at_issue` (snapshot for email-change revocation).
- Composite unique index `(professional_id, lower(email))` on `client_roster`.
- `accept_client_invite` RPC tightened: atomic claim + revoke-on-email-change check.

**Server functions** (`createServerFn` + `requireSupabaseAuth`)
- `addRosterClient`, `importRosterCSV` (with the 6-bucket preview as a dry-run mode `{ preview: true }`).
- `confirmRosterClient`, `assignProgrammeToClient`, `markFirstPaymentReceived` (stub) — all call `ensureInviteSent`.
- `ensureInviteSent` — internal-only helper (not exposed to client), row-locked.
- `resendInvite` — rate-limited, revokes prior token.
- `completeInviteSignup` — token validation + `supabaseAdmin.auth.admin.createUser` + roster activation, all in one transaction.

**UI**
- Dashboard → Clients refactored into roster view with dual badges (status + invite).
- "+ Add client" modal (zod-validated: name 1–100, email RFC + max 255).
- "Import CSV" flow with `papaparse` + the 6-bucket preview.
- Programme builder: "Assign to client" now hits `assignProgrammeToClient`.

**Public route**
- `src/routes/portal_.accept-invite.tsx` — token validation, password form, success redirect.
- `Invite expired / already used / unknown token` screens, each with a "Ask your coach to resend" CTA.

**Auth config**
- `password_hibp_enabled: true` set via the auth config tool.

**No new client-visible dependencies** beyond `papaparse` (~6kb, gold standard for browser CSV).

---

## Open question before I build

**Which REPs domain should host the sender subdomain?** Options:

- `reps.global` (matches the published URL `repsglobal.lovable.app`)
- `reps.co.uk`
- Something else you already own

Pick one and I'll set up `notify.<that>` as part of the build. If you don't have one registered yet, we can build everything against `notify.dogboss.io` for now and swap the `SENDER_DOMAIN` constant + redeploy the moment the REPs domain is verified — zero code changes needed at that point.

---

## Build order

1. Migration (roster table + invite hardening + RPC tightening)
2. Server fns + `ensureInviteSent` idempotency tests
3. Roster UI (Quick Add + CSV preview + dual badges)
4. Wire **Confirm** and **Assign programme** triggers
5. `/portal/accept-invite` page + `completeInviteSignup`
6. Enable HIBP in auth config
7. Smoke test on `notify.dogboss.io`: add → confirm → email → set password → portal
8. Switch sender to REPs domain when you've picked one

Payment trigger stays stubbed; Stripe wiring is its own task.
