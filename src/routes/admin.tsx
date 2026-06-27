import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { requireRole } from "@/lib/route-gates";
import { listPaymentFailedSubs } from "@/lib/admin/payment-recovery.functions";
import { getPlatformHealth } from "@/lib/admin/platform-health.functions";


import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PeriodSelector } from "@/components/admin/PeriodSelector";

import { OverviewKpis } from "@/components/admin/sections/OverviewKpis";
import { RegistrationsAndSpecialisms } from "@/components/admin/sections/RegistrationsAndSpecialisms";
import { ActivityQueue } from "@/components/admin/sections/ActivityQueue";
import { RevenueAndMembership } from "@/components/admin/sections/RevenueAndMembership";
import { PlatformBreakdown } from "@/components/admin/sections/PlatformBreakdown";
import { TopProsTable } from "@/components/admin/sections/TopProsTable";

import { getAdminOverview } from "@/lib/admin/overview.functions";
import {
  PERIOD_OPTIONS,
  resolvePeriod,
  forecastWindowFor,
  type PeriodKey,
} from "@/lib/admin/overview-period";
import type { ForecastHorizon } from "@/lib/admin/metrics-definitions";

const searchSchema = z.object({
  period: fallback(
    z.enum([
      "today",
      "yesterday",
      "last_7d",
      "last_30d",
      "mtd",
      "prev_month",
      "qtd",
      "ytd",
      "custom",
    ]),
    "last_30d",
  ).default("last_30d"),
  from: z.string().optional(),
  to: z.string().optional(),
  // Independent forecast horizon — never reuses period/from/to.
  fcast: fallback(
    z.enum([
      "remaining_this_month",
      "next_month",
      "next_30d",
      "current_quarter",
      "current_year",
      "custom",
    ]),
    "next_30d",
  ).default("next_30d"),
  fcastFrom: z.string().optional(),
  fcastTo: z.string().optional(),
});

function overviewQuery(
  period: PeriodKey,
  fcast: ForecastHorizon,
  from?: string,
  to?: string,
  fcastFrom?: string,
  fcastTo?: string,
) {
  const range = resolvePeriod(period, { from, to });
  const fcastRange = forecastWindowFor(fcast, { from: fcastFrom, to: fcastTo });
  return queryOptions({
    queryKey: [
      "admin-overview",
      range.from,
      range.to,
      fcastRange.from,
      fcastRange.to,
    ],
    queryFn: () =>
      getAdminOverview({
        data: {
          from: range.from,
          to: range.to,
          forecastFrom: fcastRange.from,
          forecastTo: fcastRange.to,
        },
      }),
    staleTime: 60_000,
  });
}

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({
    period: search.period,
    from: search.from,
    to: search.to,
    fcast: search.fcast,
    fcastFrom: search.fcastFrom,
    fcastTo: search.fcastTo,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      overviewQuery(
        deps.period as PeriodKey,
        deps.fcast as ForecastHorizon,
        deps.from,
        deps.to,
        deps.fcastFrom,
        deps.fcastTo,
      ),
    ),
  head: () => ({
    meta: [
      { title: "Admin Dashboard — REPS" },
      {
        name: "description",
        content:
          "REPS Admin Dashboard — platform overview, registrations, verifications, revenue and system status.",
      },
      { property: "og:title", content: "REPS Admin Dashboard" },
      {
        property: "og:description",
        content:
          "Real-time overview of the REPS platform and key operational metrics.",
      },
      { property: "og:url", content: "/admin" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { period, from, to, fcast, fcastFrom, fcastTo } = Route.useSearch();
  const data = Route.useLoaderData();
  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Last 30 days";
  return (
    <DashboardShell
      role="admin"
      active="Overview"
      title="Platform Overview"
      subtitle="Real-time overview of the REPS platform and key operational metrics."
      actions={<PeriodSelector value={period} />}
    >
      <div className="space-y-6">
        <PlatformHealthBanner />
        <PaymentFailedBanner />
        <OverviewKpis data={data} fcastHorizon={fcast} />
        <RevenueAndMembership data={data} periodLabel={periodLabel} />
        <RegistrationsAndSpecialisms />
        <ActivityQueue />
        <PlatformBreakdown />
        <TopProsTable />
      </div>

    </DashboardShell>
  );
}

function PaymentFailedBanner() {
  const fn = useServerFn(listPaymentFailedSubs);
  const q = useQuery({
    queryKey: ["admin-overview", "payment-failed-count"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  const count = q.data?.length ?? 0;
  if (!q.data || count === 0) return null;
  return (
    <div className="rounded-[14px] border border-rose-400/40 bg-rose-500/10 p-4 text-[13px] text-rose-100">
      <strong>{count}</strong> subscription{count === 1 ? "" : "s"} stuck in payment-failed / incomplete — these members are silently missing from Active Members.{" "}
      <Link to="/admin/reconciliation" hash="payment-failed" className="underline">
        Review and recover
      </Link>
      .
    </div>
  );
}

// ---- Platform health banner ----
// Pings `/admin/health`'s snapshot RPC every 60s and flashes red when any signal
// crosses the `crit` threshold (cron failures, stuck queues, DLQ, orphan subs,
// stuck payment_events, failed payments). Amber for warnings.
const CRIT = {
  cron_failures_24h: 1,
  queue_transactional: 200,
  queue_auth: 200,
  dlq_emails_7d: 10,
  orphan_subscriptions: 1,
  stuck_payment_events: 1,
  dlq_webhook_events_7d: 1,
  failed_payments_active: 1,
} as const;
const WARN = {
  queue_transactional: 50,
  queue_auth: 50,
  dlq_emails_7d: 1,
  suppressions_7d: 25,
} as const;

function PlatformHealthBanner() {
  const fn = useServerFn(getPlatformHealth);
  const q = useQuery({
    queryKey: ["admin-overview", "platform-health"],
    queryFn: () => fn(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  if (!q.data) return null;
  const d = q.data;
  const crits: string[] = [];
  if (d.cron_failures_24h >= CRIT.cron_failures_24h) crits.push(`${d.cron_failures_24h} cron failure${d.cron_failures_24h === 1 ? "" : "s"} in 24h`);
  if (d.queue_transactional >= CRIT.queue_transactional) crits.push(`${d.queue_transactional} transactional emails queued`);
  if (d.queue_auth >= CRIT.queue_auth) crits.push(`${d.queue_auth} auth emails queued`);
  if (d.dlq_emails_7d >= CRIT.dlq_emails_7d) crits.push(`${d.dlq_emails_7d} emails in DLQ`);
  if (d.orphan_subscriptions >= CRIT.orphan_subscriptions) crits.push(`${d.orphan_subscriptions} orphan subscription${d.orphan_subscriptions === 1 ? "" : "s"}`);
  if (d.stuck_payment_events >= CRIT.stuck_payment_events) crits.push(`${d.stuck_payment_events} stuck payment_events`);
  if (d.dlq_webhook_events_7d >= CRIT.dlq_webhook_events_7d) crits.push(`${d.dlq_webhook_events_7d} webhook event${d.dlq_webhook_events_7d === 1 ? "" : "s"} dead-lettered`);
  if (d.failed_payments_active >= CRIT.failed_payments_active) crits.push(`${d.failed_payments_active} failed payment${d.failed_payments_active === 1 ? "" : "s"}`);

  const warns: string[] = [];
  if (!crits.length) {
    if (d.queue_transactional >= WARN.queue_transactional) warns.push(`${d.queue_transactional} transactional emails queued`);
    if (d.queue_auth >= WARN.queue_auth) warns.push(`${d.queue_auth} auth emails queued`);
    if (d.dlq_emails_7d >= WARN.dlq_emails_7d) warns.push(`${d.dlq_emails_7d} emails in DLQ`);
    if (d.suppressions_7d >= WARN.suppressions_7d) warns.push(`${d.suppressions_7d} suppressions in 7d`);
  }

  if (!crits.length && !warns.length) return null;

  const isCrit = crits.length > 0;
  const items = isCrit ? crits : warns;
  const cls = isCrit
    ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
    : "border-amber-400/40 bg-amber-500/10 text-amber-100";
  const label = isCrit ? "Platform health: critical" : "Platform health: warning";

  return (
    <div className={`rounded-[14px] border p-4 text-[13px] ${cls}`}>
      <strong>{label}</strong> — {items.join(" · ")}.{" "}
      <Link to="/admin/health" className="underline">Open Platform Health</Link>.
    </div>
  );
}
