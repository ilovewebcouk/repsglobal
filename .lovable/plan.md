# Admin Overview — real data KPIs + charts

Rebuild `/admin` Platform Overview so the four KPI cards, the period selector, the sparklines and the charts all read from local synced tables. No Stripe API calls on render, no mock numbers.

## 1. Period selector

Replace the static `RangePill` with a real shadcn `Select` (+ inline `Calendar` popover for custom range), values:

- today, yesterday, last_7d, last_30d (default), mtd, prev_month, qtd, ytd, custom

Period bounds computed in **Europe/London** (helper in `src/lib/admin/overview-period.ts` using `Intl.DateTimeFormat` offsets — no new deps).

State stored as a URL search param via `validateSearch` on `src/routes/admin.tsx` so it survives reload and is server-readable for the loader.

## 2. Server function: `getAdminOverview`

New file `src/lib/admin/overview.functions.ts`, single `createServerFn` with `requireSupabaseAuth` + admin role check (mirrors existing admin fns). Input: `{ from: string, to: string }`. Returns one DTO used by the whole page.

### KPI definitions (local data only)

| KPI | Source | Rule |
|---|---|---|
| **Total members** | `subscriptions` | `environment = 'live'` AND `status IN ('active','trialing')` AND `tier IN ('verified','pro','studio')`. "Core scheduled" = rows where `cancel_at_period_end = false` and `current_period_end > now()` (already covered by active). One row per `user_id` (DISTINCT). Excludes sandbox, canceled, incomplete, past_due-without-period, deleted users (LEFT JOIN profiles, drop nulls). |
| **Revenue received** | `payment_events` where `event_type IN ('invoice.payment_succeeded','charge.succeeded')` and `processed_at` (fallback `created_at`) inside period. Sum `payload->>'amount_paid'` (invoice) or `payload->>'amount'` (charge), pence → £. De-dupe by `stripe_event_id`. |
| **Forecast revenue (next 30d)** | `subscriptions` active/trialing with `current_period_end` in `[now, now+30d]` + price lookup from `src/lib/billing.ts` tier→amount. Plus `bd_migration` / scheduled renewal rows with `scheduled_charge_at` in window and `status` in approved/ready states. |
| **New registrations** | `profiles` joined to `auth.users` via a **SECURITY DEFINER RPC** `count_confirmed_signups(from, to)` returning daily buckets + total. Uses `email_confirmed_at IS NOT NULL AND email_confirmed_at BETWEEN from AND to`. Excludes invite shells (no confirmation). |

### Net change (Total members)

`members_at(to) - members_at(from)` using `subscriptions.created_at` ≤ boundary AND (canceled_at IS NULL OR canceled_at > boundary). Approximation acceptable; if status history isn't tracked, fall back to `+N joined this period` derived from `created_at` deltas and flag in code comment.

### Daily series (for sparklines + charts)

Returned alongside totals:

- `members_series`: cumulative active members by day across period
- `revenue_series`: £ received per day in period
- `signups_series`: confirmed signups per day in period
- `forecast_series`: £ due per day for next 30 days (always 30d, ignores period)
- `mix`: `{ verified, pro, studio }` current counts

If a series has zero non-null data points, return `null` so the UI hides the sparkline.

## 3. UI changes

`src/components/admin/sections/OverviewKpis.tsx` — rewrite:

- Accept `data` prop from loader (no more hardcoded values).
- Tiles: Total members, Revenue received, Forecast revenue, New registrations.
- Subtexts as spec'd ("Verified, Pro and Studio", "Selected period", "Next 30 days", "Confirmed signups").
- Net change chip uses `trend` + signed delta; hidden when period is "today" and delta is 0.
- Sparkline: replace hand-rolled SVG with shadcn `ChartContainer` + Recharts `AreaChart` (h-10, no axes, no tooltip). Hidden when series is null/empty.

`src/components/admin/sections/RevenueAndMembership.tsx` — rewrite as four real shadcn charts:

1. **Member growth** — `AreaChart` cumulative members + bar overlay of new signups (or 2 stacked charts).
2. **Revenue received** — `BarChart` £/day for selected period.
3. **Forecast revenue (next 30d)** — `BarChart` £/day, labelled "Next 30 days · projected cash due".
4. **Member mix** — small `BarChart` (horizontal) of Verified/Pro/Studio current counts. Link "View full forecast →" to `/admin/memberships`.

All charts use `accessibilityLayer`, `ChartTooltip`/`ChartTooltipContent`, `var(--chart-1..4)` colors, fixed heights (`h-[220px]`).

Remove `RegistrationsAndSpecialisms`, `PlatformBreakdown`, `TopProsTable` from `/admin` page render path **only if** they also use fake data — to confirm during build; out of scope to rewrite this turn, leave them in place but flag.

## 4. Route wiring

`src/routes/admin.tsx`:

- Add `validateSearch` for `{ period, from?, to? }`.
- Add `loaderDeps` + `loader` calling `getAdminOverview` via `ensureQueryData`.
- Component uses `useSuspenseQuery` to read the DTO and passes slices into `OverviewKpis` / chart sections.
- Replace `<RangePill />` actions slot with new `<PeriodSelector />` (writes to URL via `useNavigate`).

shadcn `chart` component: already present at `src/components/ui/chart.tsx` (verify in build; install via `bunx shadcn@latest add chart` only if missing).

## 5. Migration

One migration:

```sql
create or replace function public.count_confirmed_signups(_from timestamptz, _to timestamptz)
returns table(day date, signups int, total int)
language sql security definer set search_path = public as $$
  with rows as (
    select date_trunc('day', u.email_confirmed_at at time zone 'Europe/London')::date as day
    from auth.users u
    where u.email_confirmed_at is not null
      and u.email_confirmed_at >= _from and u.email_confirmed_at < _to
  )
  select day, count(*)::int as signups, sum(count(*)) over ()::int as total
  from rows group by day order by day;
$$;
grant execute on function public.count_confirmed_signups(timestamptz, timestamptz) to authenticated;
```

(Caller-side admin role check still gates exposure; function only reads aggregate counts, no PII.)

## 6. Acceptance report (delivered after build)

Will report: live numbers, exact filters used, which sparklines hid due to no data, shadcn components used, confirmation no Stripe SDK calls / no Stripe writes added.

## Technical notes

- No new npm deps.
- All work behind `requireSupabaseAuth` + `has_role('admin')`; no service-role reads needed (subscriptions/payment_events are admin-readable via existing RLS — verify during build, otherwise route through the existing admin RPC pattern).
- Forecast uses `src/lib/billing.ts` price catalog — single source of truth.
- Period boundaries always passed as ISO strings; conversion to Europe/London handled in helper, not in SQL, to keep RLS predicates index-friendly.
- Files touched: `src/routes/admin.tsx`, `src/components/admin/sections/OverviewKpis.tsx`, `src/components/admin/sections/RevenueAndMembership.tsx`. New: `src/lib/admin/overview.functions.ts`, `src/lib/admin/overview-period.ts`, `src/components/admin/PeriodSelector.tsx`, one migration.
