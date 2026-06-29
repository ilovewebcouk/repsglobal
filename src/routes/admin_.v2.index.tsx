// Admin v2 — Overview.
//
// Mirrors the legacy /admin layout exactly (OverviewKpis + RevenueAndMembership
// + reconciliation strip) inside the branded admin shell. Adds Lifetime
// Revenue and a tier-mix card. Period & forecast horizon are URL-driven.

import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PeriodSelector } from "@/components/admin/PeriodSelector";
import { OverviewKpis } from "@/components/admin/sections/OverviewKpis";
import { RevenueAndMembership } from "@/components/admin/sections/RevenueAndMembership";
import { MemberReconciliationStrip } from "@/components/admin/sections/MemberReconciliationStrip";
import { MemberFinder } from "@/components/ops/MemberFinder";
import { AdminCard } from "@/components/admin/AdminCard";

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
      "admin-v2-overview",
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

export const Route = createFileRoute("/admin_/v2/")({
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
  head: () => ({ meta: [{ title: "Overview — REPs Admin v2" }] }),
  component: AdminV2Overview,
});

function AdminV2Overview() {
  const { period, fcast } = Route.useSearch();
  const data = Route.useLoaderData();
  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Last 30 days";

  const mixTotal = data.mix.verified + data.mix.pro + data.mix.studio;

  return (
    <DashboardShell
      role="admin"
      active="Overview"
      title="Platform Overview · v2"
      subtitle="Active members, revenue, projected cash due and all-time revenue — Stripe-mirror sourced."
      actions={<PeriodSelector value={period} />}
    >
      <div className="space-y-6">
        <OverviewKpis data={data} fcastHorizon={fcast} />
        <RevenueAndMembership data={data} periodLabel={periodLabel} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AdminCard className="lg:col-span-2">
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/55">
              Find a member
            </div>
            <div className="mt-1 mb-3 text-[11px] text-white/45">
              Email · cus_ · sub_ · BD id — opens Member 360.
            </div>
            <MemberFinder target="/admin/v2/members/$userId" />
          </AdminCard>

          <AdminCard>
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/55">
              Tier mix
            </div>
            <div className="mt-1 mb-3 text-[11px] text-white/45">
              Active subscriptions, by tier.
            </div>
            <div className="flex flex-col gap-3">
              <TierRow label="Verified" value={data.mix.verified} total={mixTotal} />
              <TierRow label="Pro" value={data.mix.pro} total={mixTotal} />
              <TierRow label="Studio" value={data.mix.studio} total={mixTotal} />
            </div>
          </AdminCard>
        </div>

        <MemberReconciliationStrip activePayingMembers={data.totalMembers} />
        <DrillStrip />
      </div>
    </DashboardShell>
  );
}

function TierRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-white/80">{label}</span>
        <span className="text-[12px] tabular-nums text-white/55">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-reps-orange" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DrillStrip() {
  const targets: { label: string; to: string; sub: string }[] = [
    { label: "Members", to: "/admin/v2/members", sub: "Member 360 · billing · lifecycle" },
    { label: "Billing", to: "/admin/v2/billing", sub: "Payments · disputes · refunds" },
    { label: "Reconciliation", to: "/admin/v2/reconciliation", sub: "Row-level audit of every KPI" },
    { label: "Ops", to: "/admin/v2/ops", sub: "Webhooks · alerts · health" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {targets.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className="rounded-[14px] border border-reps-border bg-reps-panel/60 p-4 transition-colors hover:border-reps-orange/40"
        >
          <div className="text-[13px] font-semibold text-white">{t.label}</div>
          <div className="mt-0.5 text-[11px] text-white/55">{t.sub}</div>
        </Link>
      ))}
    </div>
  );
}
