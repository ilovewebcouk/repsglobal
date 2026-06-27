import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { requireRole } from "@/lib/route-gates";

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
  type PeriodKey,
} from "@/lib/admin/overview-period";

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
  from: fallback(z.string().optional(), undefined).default(undefined),
  to: fallback(z.string().optional(), undefined).default(undefined),
});

function overviewQuery(period: PeriodKey, from?: string, to?: string) {
  const range = resolvePeriod(period, { from, to });
  return queryOptions({
    queryKey: ["admin-overview", range.from, range.to],
    queryFn: () => getAdminOverview({ data: { from: range.from, to: range.to } }),
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
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      overviewQuery(deps.period as PeriodKey, deps.from, deps.to),
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
  const { period, from, to } = Route.useSearch();
  const { data } = useSuspenseQuery(overviewQuery(period, from, to));
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
        <OverviewKpis data={data} />
        <RevenueAndMembership data={data} periodLabel={periodLabel} />
        <RegistrationsAndSpecialisms />
        <ActivityQueue />
        <PlatformBreakdown />
        <TopProsTable />
      </div>
    </DashboardShell>
  );
}
