import { createFileRoute } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { requireRole } from "@/lib/route-gates";


import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PeriodSelector } from "@/components/admin/PeriodSelector";

import { OverviewKpis } from "@/components/admin/sections/OverviewKpis";
import { RevenueAndMembership } from "@/components/admin/sections/RevenueAndMembership";



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
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
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
      subtitle="The business in 30 seconds — revenue, forecast, and members at a glance."
      actions={<PeriodSelector value={period} />}
    >
      <div className="space-y-6">
        <OverviewKpis data={data} fcastHorizon={fcast} />
        <RevenueAndMembership data={data} periodLabel={periodLabel} />
      </div>


    </DashboardShell>
  );
}

