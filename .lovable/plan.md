# Admin Professionals — polish pass to 10/10

## Brutal honest truth on each ask

### 1. Sort — yes, this is the missing piece

The list is "newest first" with no way to change it. For an admin register, that's a real gap. Recommended sort set, in priority order:

| Sort | Why it matters | Default direction |
|---|---|---|
| **Joined** | Spot brand-new pros, audit recent activity | Newest first |
| **Name (A→Z)** | Find a specific pro fast when you don't know the slug | Ascending |
| **Plan value** (Studio → Pro → Verified → Free) | See your highest-paying pros first; quick MRR audit | Highest first |
| **Plan MRR (£)** | Same as above but numeric — useful once Studio launches and there are mixed-cycle plans | Highest first |
| **Clients (active count)** | Identify pros with real client books | Highest first |
| **Rating** | Spot top-rated pros and (sorted ascending) anyone with a poor average | Highest first, with ascending option |
| **Status** | Group all Unverified / Flagged together — useful in the All tab | A→Z |

**UX**: shadcn `Select` to the left of the existing Filters/Export buttons (label "Sort"). Click a value → updates `sort` query param. Direction icon (↑/↓) toggle button next to it. Both persist in the URL so admins can share/bookmark "show me all Verified pros sorted by clients desc".

Server-side sort (not client-side) — the list is paginated, so sorting only the current page is wrong. Sorts on `plan`, `plan_mrr_pence`, `clients` and `rating` need a join-aware query — I'll switch `listAdminProfessionals` to a single SQL query via `supabaseAdmin.rpc` to a new SECURITY DEFINER function `admin_list_professionals(...)` that does the joins + sort + pagination in Postgres. Cleaner than juggling 4 client-side aggregations, and ratings/clients sorts actually work.

### 2. Filters — wire them properly

Build a shadcn `Sheet` opened by the Filters button. Filters:

- **Plan** — multi-select chips: Free / Verified / Pro / Studio
- **Profession** — multi-select: PT / Pilates / S&C / Nutrition / Group Ex / Fitness / Yoga
- **Has avatar** — yes / no / any (admin-only quality filter)
- **Identity verified** — yes / no / any
- **City** — async combobox querying distinct `professionals.city`
- **Joined window** — last 7 / 30 / 90 days / custom range
- **Active clients** — slider 0–50+ (min)

"Active filters" pill row appears under the tabs when any are set, with an `× Clear all`. All state lives in URL search params (so tabs + filters compose: e.g. tab=verified + plan=pro + city=Soho).

Tabs become "saved view" presets that pre-set the right filter combo behind the scenes:
- All → no filters
- Verified → `verification=verified`
- Unverified → `verification=pending` (renamed from "Pending" per your call — clearer)
- Flagged → `verification=rejected`
- Suspended → `is_published=false AND status was previously verified`
- Recently joined → `joined=last 30 days`

### 3. Rename "Pending" → "Unverified"

Agreed — Pending is bank-app jargon. Unverified is honest and matches the user-facing /pro/$slug verification badge language. One-line change in the tab list + the `statusClass` map (the status string is just a label).

### 4. Suspend / unpublish — flesh out the dropdown properly

The dropdown's row-level actions become the only place where suspend lives. The flagged tab stays useful because flagged ≠ suspended — a flagged pro is one we've rejected verification on, a suspended pro is one we've actively pulled from the directory.

**Dropdown layout** (revised):
```
View as
  • Open their dashboard           ← primary, orange-tinted

Public surfaces
  • View public profile  ↗
  • View shop-front  ↗              ← only if Pro/Studio

Moderation
  • Suspend / Unsuspend
  • Mark as flagged / Clear flag
```

**Suspend behaviour** (your point about notification email):
1. Confirm dialog: "Suspend James Wilson? Their profile will be removed from the public directory and they'll be notified by email." + required reason textarea (free text, becomes the `reason` in the email).
2. Server fn `setProfessionalSuspension({ professional_id, suspended, reason })`:
   - Admin-gated (re-check role).
   - Sets `professionals.is_published = false`, `professionals.suspended_at = now()`, `professionals.suspension_reason = reason`. Needs a tiny migration to add those two columns + an audit-log row via existing `log_admin_action`.
   - Sends transactional email via `/lovable/email/transactional/send` with a new template `professional-suspended` (recipient = the pro's auth email).
   - Returns the new state; UI invalidates the list query.
3. Unsuspend = same flow in reverse, sends `professional-reinstated` template, no reason required. Restores `is_published = true`.

**Flag/unflag** is lighter — flips `verification` between `verified` and `rejected`. No email. Same audit log.

### 5. Invite professional — ship the full thing today

You asked for the full version. Truth-check: this is genuinely the most-used admin action once you start onboarding pros manually, so it's worth doing properly.

**Invite button** → `Dialog`:
- Email (required)
- Optional name
- Optional pre-selected plan: Verified £99/yr or Pro £59/mo Founding (defaults to Pro)
- "Send invite" → server fn `sendProfessionalInvite({ email, full_name?, plan? })`:
  - Admin-gated.
  - Generates a single-use token, stores row in new tiny table `admin_pro_invites` (id, email, full_name, plan, token_hash, sent_by, sent_at, accepted_at, accepted_user_id, expires_at = now+14d). RLS admin-read-only + service-role-write.
  - Sends transactional email `professional-invite` (new template) with CTA → `https://repsuk.org/auth?invite=<token>&plan=<plan>`.
  - On `/auth`, if `?invite=<token>` is present, the sign-up flow pre-fills the email (read-only), and on successful sign-up writes `admin_pro_invites.accepted_user_id = new uid, accepted_at = now()` and routes the user straight to `/dashboard/syncing` (post-checkout path) — i.e. they skip the pricing screen because the plan is already locked in for them at checkout via the `plan` query param.
- Toast confirms; the button stays open so admins can send a second one without re-clicking.

**Secondary action under the same Invite button** — a small `Copy sign-up link` item in a kebab menu beside the button, which copies `https://repsuk.org/pricing?ref=admin-<adminId>` (no token, just attribution). Useful for putting in a DM.

### 6. Honest tradeoffs / out of scope

- **Bulk invite (CSV upload)** — would be useful but not for today. Defer until BD migration kicks off in earnest.
- **Saved views** (named filter combos like "Studio pros in London") — defer, URL params get us 90% there.
- **Per-tab counts in the tab pills** (e.g. "Verified 9") — small DX win, defer until we see admins actually want them.
- **Server-side ratings/clients sort** requires the new RPC. If you'd rather not add the SQL function this turn, I can do a hybrid: ratings/clients sort falls back to client-side and the badge shows "(this page only)". Strongly recommend doing the RPC properly.

## Files touched

**New SQL migration:**
- Add `suspended_at timestamptz`, `suspension_reason text` columns to `professionals`.
- Create table `admin_pro_invites` + grants + RLS (admin-read, service-role-write).
- Create SECURITY DEFINER `admin_list_professionals(_q text, _tab text, _filters jsonb, _sort text, _direction text, _limit int, _offset int)` returning rows + total count.

**New email templates** (`src/lib/email-templates/`):
- `professional-invite.tsx`
- `professional-suspended.tsx`
- `professional-reinstated.tsx`

**New server fns** (`src/lib/admin/professionals.functions.ts`):
- `setProfessionalSuspension`, `setProfessionalFlag`
- (`src/lib/admin/invites.functions.ts`) `sendProfessionalInvite`

**New server route:** `src/routes/api/admin/professionals.csv.ts` (Export CSV).

**Edited:**
- `src/routes/admin_.professionals.tsx` — sort `Select`, direction toggle, Filters `Sheet`, rename "Pending"→"Unverified", restyled dark dropdown, suspend/flag dialogs, Invite dialog, remove `hidden sm:flex` from Invite button, Export CSV `<a>` link, URL-param state.
- `src/lib/admin/professionals.functions.ts` — swap to RPC, return new fields (`suspended_at`, `is_published`), add sort/filter inputs.
- `src/routes/_authenticated/_professional/route.tsx` — admin-with-impersonation passthrough (carry-over from previous plan, still needed).
- `src/lib/admin/impersonation.functions.ts` — `getImpersonationTarget` server fn.
- ~8 dashboard `*.functions.ts` — middleware swap to `requireSupabaseAuthWithImpersonation` (carry-over).
- `src/routes/auth.tsx` — read `?invite=<token>&plan=<...>` and wire post-signup behaviour.

## Verdict

Sort + filters + suspend-with-email + invite-with-token is the right cluster to ship together — they all share the same "real admin workflow" muscle. After this turn, the Professionals page is genuinely the operational hub for running REPs and we never have to come back to it for v1.

## Confirm before I build

1. **RPC for the list query** — yes, do it properly with the SQL function (recommended)?
2. **Default invite plan in the dialog** — Pro Founding or Verified?
3. **Suspension email tone** — strict ("Your profile has been suspended pending review") or soft ("We've temporarily unpublished your profile — here's why")? Recommend strict.
