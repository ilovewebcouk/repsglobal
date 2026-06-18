## What's actually wrong

Katie's PureGym Great Yarmouth is not deleted — it's hidden by an **impersonation bug**. `getMyGyms` and every other "my…" server fn uses the plain `requireSupabaseAuth` middleware, which leaves `context.userId` as the admin's id while impersonating. So queries like `professional_gyms.eq("professional_id", context.userId)` ask for the admin's gyms, not Katie's, and return empty.

Only a tiny handful of fns (verification trust, dashboard-profile, avatar-ai, location) have been switched to `requireSupabaseAuthWithImpersonation`. The rest of the dashboard surface is silently lying about every impersonated pro.

## Scope of the bug (QA sweep results)

Files with handlers that read/write rows keyed on `context.userId` as the pro id and currently use the wrong middleware:

```
src/lib/gyms.functions.ts                    9 handlers
src/lib/settings/settings.functions.ts       9 handlers
src/lib/cpd/titles.functions.ts              3 handlers (qualifications)
src/lib/verification/identity.functions.ts   5 handlers (ID docs)
src/lib/reviews/reviews.functions.ts         3 handlers
src/lib/enquiries/enquiries.functions.ts     3 handlers
src/lib/leads/leads.functions.ts            10 handlers
src/lib/leads/proposals.functions.ts         3 handlers
src/lib/leads/leads-ai.functions.ts          3 handlers
src/lib/roster.functions.ts                  7+ handlers (clients)
src/lib/programmes/waitlist.functions.ts     2 handlers
src/lib/invites.functions.ts                 2 handlers (client invites)
src/lib/support/tickets.functions.ts        14 handlers
src/lib/support/ai-draft.functions.ts        1 handler
src/lib/support/bulk-tickets.functions.ts    2 handlers
```

**Keep on plain `requireSupabaseAuth`** (must always act as the real admin, never as the impersonated pro):

```
src/lib/admin-audit-list.functions.ts        admin audit reader
src/lib/payments/admin.functions.ts          admin payment ops
src/lib/billing/billing.functions.ts         own subscription / Stripe customer
src/lib/credits/credits.functions.ts         own wallet spend
src/lib/payments/connect.functions.ts        own Stripe Connect onboarding
```

These are tied to the actor's auth identity (Stripe customer id, wallet, admin role). Swapping them would silently mutate Katie's billing while admin is impersonating — that's a worse bug.

## Plan

### Phase 1 — fix the gym issue (the original report)

`src/lib/gyms.functions.ts`: replace `requireSupabaseAuth` import + every `.middleware([requireSupabaseAuth])` with `requireSupabaseAuthWithImpersonation` for all 9 handlers (getMyGyms, addMyGym, removeMyGym, reorderMyGyms, and the 5 staff/admin-claim handlers that scope by `professional_id = context.userId`).

### Phase 2 — sweep the rest of the dashboard

For each file in the "scope" list above, swap the middleware on every handler whose body uses `context.userId` as `professional_id` (or equivalent owner column on rows the pro owns: `pro_titles`, `identity_documents`, `professional_locations`, `reviews.professional_id`, `enquiries.professional_id`, `client_roster.professional_id`, `client_invites.professional_id`, `support_tickets.user_id` when the ticket is owned by the impersonated pro, etc.).

Leave handlers alone where `context.userId` is the actor's own auth identity unrelated to the impersonated pro (e.g. an admin sending a support reply *as themselves*).

### Phase 3 — verification

For each subsystem, while impersonating Katie:
1. Dashboard profile → PureGym Great Yarmouth shows under "Trains at".
2. Qualifications/CPD → her real CPD titles appear.
3. Identity verification → her uploaded ID docs and status appear.
4. Leads / enquiries / proposals → her real pipeline appears, not the admin's.
5. Roster / clients / invites → her clients appear.
6. Reviews → her reviews appear.
7. Programmes waitlist → her waitlist appears.
8. Support tickets → her tickets appear (not the admin's).

Then stop impersonation and confirm the admin's own dashboard is unchanged. Confirm billing/credits/connect still target the admin (Phase 1+2 deliberately don't touch those).

### Phase 4 — guardrail (small follow-up, optional)

Add a one-line ESLint rule or a `rg` pre-commit check that flags new `*.functions.ts` files importing `requireSupabaseAuth` without an explicit `// reason: ...` comment, so future fns default to the impersonation-safe middleware.

## Out of scope

- Public `/pro/$slug` "Trains at" still hardcodes three placeholder London gyms — separate fix, tracked from the previous turn.
- No DB changes, no migrations.
- Public profile / read-only public routes aren't affected (they use a publishable/admin client, not the user's auth context).
