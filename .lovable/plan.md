
# Admin v2 — World-Class Rebuild + Stripe Source of Truth

## Brutal honest truth

The current admin is a working **operations console bolted onto a migration**. It got us safely through BD → Stripe, but it carries scar tissue everywhere:

- **3 parallel "is this person paying?" sources** (`subscriptions`, `legacy_stripe_link`, `bd_member_seed`) deduped by a helper. Every KPI starts with a reconciliation step instead of a query.
- **Internal aliases** (`verified_annual`) stored where Stripe Price IDs belong, so revenue forecasting is hand-computed.
- **Metadata typos** (`migrated_from === "bd"` vs `bd_legacy`) silently break flags.
- **17 disputes** sit in `payment_events` but never landed in `public.disputes` — two event tables, one truth.
- **Sidebar grew by accretion** (Churn, Ops, Reconciliation, Migration, Webhook Recovery, Health…) — operators can't find anything in one hop.
- **Same label, different math** across pages (Active Paying Members, Paid Pros, Failed Payments).

The fix isn't "polish the dashboard." It's: **make Stripe the single source of truth for money, Supabase the single source of truth for identity/trust, and rebuild admin as a thin, opinionated read layer on top — entirely on shadcn/ui primitives.**

---

## The model (non-negotiable foundation)

```text
Money / billing state           →  Stripe (subscriptions, customers, invoices, disputes)
Identity / verification / RBAC  →  Supabase (auth.users, professionals, verification_*, user_roles)
Engagement / content / ops      →  Supabase (reviews, enquiries, support_tickets, bookings)
```

Rule: **if Stripe knows it, we don't store a second copy of the truth.** We cache for speed; every read has a "reconcile with Stripe" path; the canonical answer always wins.

---

## UI rule (locked across all phases)

Admin v2 is **shadcn/ui-first**. Every primitive comes from the registry — no bespoke divs where a component exists.

- **Charts** → `Chart` (`ChartContainer` / `ChartTooltip` / `ChartTooltipContent` / `ChartLegend`) wrapping Recharts. `accessibilityLayer`, chart config with human labels, CSS variables via `var(--chart-1..n)`. No raw `<ResponsiveContainer>` outside `ChartContainer`.
- **Tables** → `Table` + shadcn DataTable patterns. Row actions via `DropdownMenu`.
- **KPI tiles** → full `Card` composition (`CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`) — never dump everything into `CardContent`.
- **Forms** → `FieldGroup` + `Field` + `FieldLabel` + `FieldDescription`; `InputGroup` + `InputGroupAddon` for inline buttons; `ToggleGroup` for 2–7 option sets. No raw `div` + `space-y-*`.
- **Overlays** → `Dialog` for modals, `Sheet` for side panels (Timeline detail, email lifecycle, verification certificate), `Drawer` on mobile, `AlertDialog` for every destructive action (always with `DialogTitle`).
- **Feedback** → `sonner` `toast()`, `Alert` for callouts, `Skeleton` for loading, `Empty` for empty states, `Spinner` + `data-icon` for loading buttons. No custom `animate-pulse`.
- **Nav** → `Sidebar` + `NavigationMenu` + `Breadcrumb`. Cmd-K via `Command` inside `Dialog`.
- **Badges** → `Badge` variants for tier (Core / Pro / Studio) and status (Active / Past due / In recovery / Churned / Verified). Never colored spans.
- **Spacing/sizing** → `flex` + `gap-*` (no `space-y-*`), `size-*` for square. Icons in buttons via `data-icon`, no `size-4` classes.
- **Colors** → semantic tokens only (`bg-primary`, `text-muted-foreground`, brand orange via existing token). Reuse dashboard UI kit in `src/components/dashboard/ui/` for the dark authenticated surface.

Workflow: before building any page, run `npx shadcn@latest search` + `docs <component>`, install missing primitives with `add`, and verify composition against the rules.

---

## Phased plan

### Phase A — Foundation cleanup (1 sprint, no UI work)

1. **Fix the 4 P0s** from the post-BD audit:
   - Webhook metadata typo (`migrated_from === "bd"` → `bd_legacy`) in `webhook.ts` + `webhook-replay.functions.ts`.
   - Backfill `migrated_from_bd = true` on the 340 affected rows.
   - Replace internal price aliases (`verified_annual`) in `subscriptions.stripe_price_id` with real `price_…` IDs from Stripe.
   - Backfill the 17 missing rows into `public.disputes` and make the webhook write atomically (or drop one table).

2. **Single billing read API** — one module `src/lib/billing/stripe-mirror.server.ts` owning `getSubscriptionByUser`, `getCustomerByUser`, `listInvoices`, `listDisputes`, `listPaymentMethods` (60s cache). Every admin page reads through this. Nothing else calls `stripe.subscriptions.*` directly.

3. **Retire the 3-source dedupe.** `legacy_stripe_link` + `bd_member_seed` become read-only archives. Canonical "active paying member" = `Stripe subscription in (active, trialing, past_due) AND auth.users row exists`. One query, no dedupe.

4. **Metric registry enforcement.** Every KPI imports its definition from `docs/11_admin_metric_registry.md` via a typed const. Same-label/different-math becomes a typecheck error.

### Phase B — Admin v2 shell at `/admin-v2` (parallel namespace per Doc 12)

5. **IA collapse — 14 routes → 6 sections:**
   ```text
   /admin-v2            Dashboard    (30-second business view)
   /admin-v2/members    Members      (Professionals + 360° timeline spine)
   /admin-v2/revenue    Revenue      (Stripe-mirrored subs, invoices, disputes, forecast)
   /admin-v2/trust      Trust        (Verification + Reviews + Support unified)
   /admin-v2/ops        Operations   (Billing health, webhooks, crons, alerts, email)
   /admin-v2/settings   Settings     (Team, flags, integrations, audit log)
   ```
   Migration / Reconciliation / Churn / Webhook Recovery become panels inside Ops.

6. **Shared shadcn-based primitives** in `src/components/admin-v2/primitives/`:
   `PageShell` (header + actions + tabs slot), `KPICard` (Card + delta Badge + Recharts sparkline via `ChartContainer`), `HealthStatusStrip` (Badge row), `DataTable` (shadcn Table + filters), `MemberTimeline` (Sheet + Card list), `MemberFinder` (Command palette in Dialog), `ChartPanel` (`ChartContainer` + `ChartTooltip` + `ChartTooltipContent` + `accessibilityLayer`), `ConfirmActionDialog` (AlertDialog), `EmptyState` (Empty), `AlertBanner` (Alert). All shadcn-first, semantic tokens only.

7. **Member 360 as the spine.** Every row in every table → `Open Timeline` → one page (identity, verification, live Stripe subscription, invoices, disputes, reviews, support, enquiries, audit log). Currently 5 pages to answer one question.

### Phase C — Page-by-page rebuild

8. **Dashboard v2** — 4 canonical `KPICard`s + revenue `AreaChart` + needs-attention queue via `DataTable`.
9. **Revenue v2** — Stripe is the table. `DataTable` + filters + `Sheet` for dispute detail; MRR/ARR live from Stripe; forecast `BarChart` via shadcn `Chart`.
10. **Members v2** — Professionals `DataTable` + invite flow (`Dialog` + `FieldGroup`) + cross-link to Timeline.
11. **Trust v2** — Verification 3-step workspace + Reviews moderation + Support tickets in one `Tabs` surface (they're the same job: respond to a human).
12. **Ops v2** — Billing health, webhook recovery, cron status, email deliverability, alerts; Migration + Reconciliation as historical panels.

### Phase D — Cutover & freeze

13. Side-by-side QA: open `/admin` and `/admin-v2`, every KPI must match or be intentionally renamed.
14. Operator trial week; record friction.
15. Make `/admin-v2` the default `/admin`; keep v1 at `/admin/v1` for 30 days.
16. Delete v1; **freeze sidebar, metric registry, page ownership** per Doc 12 §10.

---

## What "Stripe = source of truth" actually changes

- **No more ghost subscriptions** — if Stripe doesn't have it, we don't show it.
- **Dispute lifecycle is real** — `disputes` becomes a Stripe cache, not a parallel registry.
- **Price changes happen in Stripe**, app reads them — no hardcoded `verified_annual` aliases.
- **Reconciliation becomes a diff view** — "0 rows differ from Stripe" is the success state.
- **Renewal/trial logic moves to Stripe** (`trial_end`, `cancel_at_period_end`) — finish what the BD rail swap started.

---

## Technical notes

- All new server logic: `createServerFn` + `requireSupabaseAuth` + `has_role(_, 'admin')` gate. Stripe SDK only inside `*.server.ts` files loaded via `await import()` in handlers.
- Stripe webhook is the **only** writer to the `subscriptions` cache. App code reads, never writes, billing state.
- `stripe_event_id` idempotency key on every webhook-triggered write.
- New tables: none in Phase A/B. Phase C may add a thin `member_timeline_event` append-only log for fast Timeline reads.
- Locked marketing/UI memories untouched — this is admin-only.

---

## What I need from you before building

1. **Approve the IA collapse** (14 → 6). Biggest single decision.
2. **Approve "Stripe is canonical, retire dedupe"** — `legacy_stripe_link` + `bd_member_seed` become read-only archives.
3. **Confirm parallel `/admin-v2` namespace** vs feature-flag on `/admin`.
4. **Phase A first, or skip to redesign?** Strong recommendation: Phase A first — redesigning on the current dedupe mess bakes in the mess.

Greenlight and I start Phase A (4 P0 fixes + single billing read API) — invisible to operators, biggest trust unlock. Then the shadcn-native redesign on clean foundations.
