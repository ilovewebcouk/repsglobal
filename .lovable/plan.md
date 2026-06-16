# Wire up `/admin/professionals` + ship "View as"

## Brutal honest truth first

**1. Admins.** You're right — only `cruz.pt@icloud.com` has admin in the live DB. `pros@repsuk.org` is in an old seed migration intent but doesn't exist as a user. I'll drop the reference from project memory and not re-seed. **One admin = `cruz.pt@icloud.com`.**

**2. The page already exists** as a static mock at `src/routes/admin_.professionals.tsx` (237 lines, hardcoded fixture data, no DB). It's a really nice layout — let's keep the design **pixel-identical** and wire the data through. No redesign.

**3. The columns aren't all right.** Reviewing each one honestly:

| Column | Verdict | Action |
|---|---|---|
| Professional (avatar + name + handle) | ✅ Perfect | Wire `profiles.full_name`, `profiles.avatar_url`, `professionals.slug` |
| Location | ✅ Perfect | Wire `professionals.city` (fall back to `professional_locations.town`) |
| **Tier** | ❌ **Wrong** — currently shows "Level 4 PT" / "Nutrition L4" which is *profession+qualification*, not the REPs business tier | **Rename to "Plan"** → shows `Verified` / `Pro` / `Studio` / `Free` from `subscriptions.tier`. Add a separate compact **Profession** column for "PT / Nutritionist / Pilates" etc. |
| Status | ⚠️ Half right | Drive from `verification` enum (`pending` / `verified` / `rejected`) + `is_published` flag. Add `Suspended` and `Unpublished` states. Tabs (All/Verified/Pending/Flagged/Suspended/Recently joined) wire to this. |
| Rating | ✅ Keep | `avg(reviews.rating)` joined per pro. `—` when no reviews. |
| Clients | ✅ Keep | `count(coach_client where status='active')` per pro. |
| **MRR** | ⚠️ **Misleading as labelled** — £8,420 implies what the trainer bills their clients (which REPs has no insight into and doesn't take a cut of). Honest meaning here is "what they pay REPs". | **Rename to "Plan MRR"** = monthly value of their REPs subscription (£0 / £8.25 [Verified £99÷12] / £59 / £149). Keeps the column useful (revenue per pro) without lying about scope. |
| Joined | ✅ Keep | `professionals.created_at` formatted as `MMM YYYY`. |
| ⋯ menu | ❌ Currently dead | This becomes the **View as** entry point + 5 more actions. |

So the columns become:
**Professional · Location · Profession · Plan · Status · Rating · Clients · Plan MRR · Joined · ⋯**

Profession is a compact pill ("PT", "Pilates", "Nutrition", "S&C"), Plan is a coloured pill (Verified emerald / Pro orange / Studio violet / Free white-tint).

**4. KPIs at top** — all 4 are computable from real data, no fakery:
- Active professionals = `count(*) from professionals where is_published`
- Verified = `count where verification='verified'` + % of base
- Avg rating = `avg(rating) from reviews` (last 12 months)
- New signups (30d) = `count where created_at > now()-30d` + WoW delta

**5. The `⋯` dropdown** becomes the View-as launcher + admin actions:
- **View as on dashboard** (impersonate → `/dashboard`)
- View public profile (`/pro/<slug>`)
- View shop-front (`/c/<slug>`, only if Pro/Studio)
- View enquire page (`/pro/<slug>/enquire`)
- ─
- Send admin message
- Suspend / unpublish

The "View as" still uses the secure cookie + 30-min auto-expire + orange banner approach from the earlier plan — just launched from this row instead of a separate picker page.

## Implementation

### Database (one migration)

- **Seed migration cleanup**: drop the unused `pros@repsuk.org` admin seed entirely. `cruz.pt@icloud.com` stays as the sole admin (no change needed, already there).
- **`admin_impersonation_sessions` table** (admin_id, professional_id, started_at, ends_at, ended_at, ended_reason) — RLS admin-only, includes service_role grant.
- **`public.acting_professional_id(_admin_id uuid)` SECURITY DEFINER function** returning the live impersonation target (NULL if expired/none). Used by RLS *and* the middleware.
- **Extend RLS** on `professionals`, `enquiries`, `services`, `shop_fronts`, `bookings`, `clients`, `coach_client`, `client_roster`, `reviews`, `professional_locations`, `professional_gyms`, `pro_titles`, `verification_submissions`, `identity_documents`, `insurance_policies`, `subscriptions`, `notification_preferences`, `support_tickets`, `support_messages` with `OR id/professional_id = public.acting_professional_id(auth.uid())` on USING + WITH CHECK. Lets impersonating admins read *and* write through normal RLS without bypassing it via service-role.

### Server functions (new file `src/lib/admin/professionals.functions.ts`)

- **`listAdminProfessionals({ q, tab, page, pageSize })`** — admin-gated. Returns paginated rows joining `professionals` + `profiles` + `subscriptions` (latest active) + avg `reviews.rating` + `count(coach_client)`. Computes plan MRR from tier. Supports search by name/slug/handle/email and tab filter. Default 25/page.
- **`getAdminProfessionalsKpis()`** — 4 KPIs above with 30-day deltas.
- **`startImpersonation({ professional_id })`** — sets HttpOnly cookie `reps_impersonate` (maxAge 1800), writes audit row + session row, logs via `log_admin_action`. Returns `{ redirect: '/dashboard' }`.
- **`stopImpersonation()`** — clears cookie + closes session row.
- **`getImpersonationStatus()`** — for the persistent banner.
- **`exportProfessionalsCsv({ q, tab })`** — wires the "Export CSV" button (streams from a server route under `/api/admin/professionals.csv` so headers/streaming work).

### Middleware swap

- New `requireSupabaseAuthWithImpersonation` drop-in replacement for `requireSupabaseAuth`. Injects `context.actingProfessionalId` (either cookie value, after re-verifying admin role, or `context.userId`). `context.userId` stays as the real admin for audit writes.
- Refactor ~10 dashboard server-fn files to read `context.actingProfessionalId` instead of `context.userId` for the "current pro" filter. List: `dashboard.functions.ts`, `enquiries.functions.ts`, `dashboard-profile.functions.ts`, `settings.functions.ts`, `cpd.functions.ts`, `verification/trust.functions.ts`, `shop-front/shop-front.functions.ts`, `bookings/*`, `clients/*`, `services/*`.

### UI changes to `src/routes/admin_.professionals.tsx`

- Convert hardcoded `KPIS` + `ROWS` to TanStack-Query loader (`ensureQueryData` + `useSuspenseQuery`) calling the new server fns.
- Replace `Tier` column with `Profession` + `Plan` (shadcn `Badge` for both, semantic colour map).
- Replace status pills with the new 5-state map (Verified / Pending / Flagged / Suspended / Unpublished) — uses `bg-emerald-500/15 text-emerald-300` for Verified per the status-colour rule in project memory.
- Wire tabs to `tab` query param (TanStack Router `useSearch`).
- Wire search input top-right to a debounced `q` param.
- Wire pagination to `page` param.
- Replace `⋯` button with shadcn `DropdownMenu` containing the 6 actions above.
- "View as on dashboard" calls `startImpersonation` then `navigate({ to: '/dashboard' })`.

### Persistent impersonation banner

- `src/components/admin/ImpersonationBanner.tsx` — sticky orange bar above `TopBar` inside `DashboardShell`. Shows target avatar/name, "Started HH:MM · Expires HH:MM", **Exit view** button. Polls `getImpersonationStatus` every 60s; auto-hides when expired.
- Mounted once inside `DashboardShell` so it shows on every authenticated page (dashboard *and* admin) — admin sees it everywhere until they exit.

## Files touched

- **New SQL migration** (1) — impersonation table, function, RLS extensions.
- **New** `src/lib/admin/professionals.functions.ts`, `src/lib/admin/impersonation.functions.ts`, `src/integrations/supabase/auth-middleware-impersonation.ts`, `src/components/admin/ImpersonationBanner.tsx`, `src/routes/api/admin/professionals.csv.ts`.
- **Edited** `src/routes/admin_.professionals.tsx` (data wiring + column changes + dropdown + impersonation trigger), `src/components/dashboard/DashboardShell.tsx` (mount banner), ~10 dashboard `*.functions.ts` (userId → actingProfessionalId).

## Out of scope (call out for follow-up)

- Suspend / unpublish actions in the dropdown wire to existing pro mutations; if those mutations don't yet exist for admin-on-behalf, I'll stub the button as disabled with a tooltip rather than half-build it.
- "Send admin message" needs a small modal — happy to ship it in this turn or defer. Recommend defer to keep the PR focused.
- Memory update: I'll rewrite the Phase 2.0 memory line so it no longer claims `pros@repsuk.org` is an admin seed.

## Verdict

Yes, ship it. The mock-up's design is genuinely 9/10 — it just needs the Tier rename (huge clarity win), the Profession split, the honest MRR label, and the dropdown wired. That plus the impersonation cookie machinery gets you a 10/10 admin console with the View-as flow embedded exactly where it belongs.
