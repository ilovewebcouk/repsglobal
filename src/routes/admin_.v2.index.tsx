// Admin v2 — Overview.
//
// Mirror-first KPI surface rendered inside the existing branded admin shell
// (`DashboardShell role="admin"`). Same locked sidebar / topbar / user card
// as legacy /admin — only the page body changes.

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  PoundSterling,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MemberFinder } from "@/components/ops/MemberFinder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { getAdminOverview } from "@/lib/admin/overview.functions";
import { resolvePeriod, forecastWindowFor } from "@/lib/admin/overview-period";

export const Route = createFileRoute("/admin_/v2/")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Overview — REPs Admin v2" }] }),
  component: AdminV2Overview,
});

function fmtGBP(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}
function fmtInt(n: number) {
  return new Intl.NumberFormat("en-GB").format(n);
}

function AdminV2Overview() {
  const fetchOverview = useServerFn(getAdminOverview);

  const range = useMemo(() => resolvePeriod("last_30d"), []);
  const fcast = useMemo(() => forecastWindowFor("next_30d"), []);

  const q = useQuery({
    queryKey: ["admin-v2-overview", range.from, range.to, fcast.from, fcast.to],
    queryFn: () =>
      fetchOverview({
        data: {
          from: range.from,
          to: range.to,
          forecastFrom: fcast.from,
          forecastTo: fcast.to,
        },
      }),
  });

  return (
    <DashboardShell
      role="admin"
      active="Overview"
      title="Platform Overview · v2"
      subtitle="Active paying members, revenue received (30d), projected cash due (30d). Stripe-mirror sourced — matches /admin by construction."
    >
      <div className="flex flex-col gap-6">
        {q.error && (
          <Alert variant="destructive">
            <AlertTitle>Failed to load overview</AlertTitle>
            <AlertDescription>{(q.error as Error).message}</AlertDescription>
          </Alert>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiTile
            icon={Users}
            label="Active members"
            value={q.data ? fmtInt(q.data.totalMembers) : null}
            loading={q.isLoading}
            accent
          />
          <KpiTile
            icon={PoundSterling}
            label="Revenue (30d)"
            value={q.data ? fmtGBP(q.data.revenuePence) : null}
            loading={q.isLoading}
          />
          <KpiTile
            icon={Wallet}
            label="Projected (30d)"
            value={q.data ? fmtGBP(q.data.forecastPence) : null}
            loading={q.isLoading}
          />
          <KpiTile
            icon={TrendingUp}
            label="Net growth"
            value={
              q.data
                ? `${q.data.netMemberGrowth >= 0 ? "+" : ""}${q.data.netMemberGrowth}`
                : null
            }
            loading={q.isLoading}
          />
          <KpiTile
            icon={CreditCard}
            label="Joined (30d)"
            value={q.data ? fmtInt(q.data.joinedInPeriod) : null}
            loading={q.isLoading}
          />
          <KpiTile
            icon={Activity}
            label="Churned (30d)"
            value={q.data ? fmtInt(q.data.churnedInPeriod) : null}
            loading={q.isLoading}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">New members · last 30 days</CardTitle>
              <CardDescription className="text-white/55">
                Per-day net additions to the active mirror.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {q.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Sparkline data={q.data?.signupsSeries ?? []} />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
            <CardHeader>
              <CardTitle className="text-white">Tier mix</CardTitle>
              <CardDescription className="text-white/55">
                Active subscriptions, by tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {q.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <TierRow
                    label="Verified"
                    value={q.data?.mix.verified ?? 0}
                    total={q.data?.totalMembers ?? 0}
                  />
                  <TierRow
                    label="Pro"
                    value={q.data?.mix.pro ?? 0}
                    total={q.data?.totalMembers ?? 0}
                  />
                  <TierRow
                    label="Studio"
                    value={q.data?.mix.studio ?? 0}
                    total={q.data?.totalMembers ?? 0}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
          <CardHeader>
            <CardTitle className="text-white">Find a member</CardTitle>
            <CardDescription className="text-white/55">
              Email · cus_ · sub_ · BD id — opens Member 360.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberFinder target="/admin/v2/members/$userId" />
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DeepLinkCard
            title="Memberships"
            description="Per-member cockpit — billing health, lifecycle, disputes."
            to="/admin/memberships"
            label="Open memberships cockpit"
          />
          <DeepLinkCard
            title="Reconciliation"
            description="Mirror vs legacy union — must agree before Phase D cutover."
            to="/admin/reconciliation"
            label="Open reconciliation"
          />
        </section>
      </div>
    </DashboardShell>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-xs uppercase tracking-wide text-white/55">
          {label}
        </CardDescription>
        <Icon className={accent ? "size-4 text-reps-orange" : "size-4 text-white/45"} />
      </CardHeader>
      <CardContent>
        {loading || !value ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="font-display text-2xl font-semibold tabular-nums tracking-tight text-white">
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TierRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-white/80">{label}</span>
        <span className="text-sm tabular-nums text-white/55">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-reps-orange" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: { day: string; value: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-white/55">
        No data in window.
      </div>
    );
  }
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" hide />
          <RechartsTooltip
            contentStyle={{
              background: "var(--reps-panel)",
              border: "1px solid var(--reps-border)",
              borderRadius: 10,
              fontSize: 12,
              color: "white",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.55)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--reps-orange)"
            strokeWidth={2}
            fill="url(#sparkOrange)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeepLinkCard({
  title,
  description,
  to,
  label,
}: {
  title: string;
  description: string;
  to: string;
  label: string;
}) {
  return (
    <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-white/55">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-reps-orange"
        >
          {label} <ArrowUpRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
