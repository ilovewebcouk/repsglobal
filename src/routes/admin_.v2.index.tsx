// Admin v2 — Overview.
//
// Mirror-first KPI surface. Uses the same `getAdminOverview` server function
// as legacy /admin (already refactored onto the Stripe mirror in Phase A4b-1),
// so the headline numbers reconcile to /admin by construction.

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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { getAdminOverview } from "@/lib/admin/overview.functions";
import { resolvePeriod, forecastWindowFor } from "@/lib/admin/overview-period";

export const Route = createFileRoute("/admin_/v2/")({
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Active paying members, revenue received (last 30d), and projected cash
          due (next 30d). Sourced from the Stripe mirror — matches /admin by
          construction.
        </p>
      </header>

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
          label="Projected (next 30d)"
          value={q.data ? fmtGBP(q.data.forecastPence) : null}
          loading={q.isLoading}
        />
        <KpiTile
          icon={TrendingUp}
          label="Net growth"
          value={q.data ? `${q.data.netMemberGrowth >= 0 ? "+" : ""}${q.data.netMemberGrowth}` : null}
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
        <Card className="lg:col-span-2 rounded-[16px]">
          <CardHeader>
            <CardTitle>New members · last 30 days</CardTitle>
            <CardDescription>Per-day net additions to the active mirror.</CardDescription>
          </CardHeader>
          <CardContent>
            {q.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Sparkline data={q.data?.signupsSeries ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[16px]">
          <CardHeader>
            <CardTitle>Tier mix</CardTitle>
            <CardDescription>Active subscriptions, by tier.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {q.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <TierRow label="Verified" value={q.data?.mix.verified ?? 0} total={q.data?.totalMembers ?? 0} />
                <TierRow label="Pro" value={q.data?.mix.pro ?? 0} total={q.data?.totalMembers ?? 0} />
                <TierRow label="Studio" value={q.data?.mix.studio ?? 0} total={q.data?.totalMembers ?? 0} />
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="rounded-[16px]">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Memberships</CardTitle>
              <CardDescription>Per-member cockpit — billing health, lifecycle, disputes.</CardDescription>
            </div>
            <Badge variant="secondary">Legacy</Badge>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/memberships"
              className="inline-flex items-center gap-1 text-sm text-foreground hover:text-[var(--brand-orange)]"
            >
              Open memberships cockpit <ArrowUpRight className="size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-[16px]">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Reconciliation</CardTitle>
              <CardDescription>Mirror vs legacy union — must agree before Phase D cutover.</CardDescription>
            </div>
            <Badge variant="secondary">Audit</Badge>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/reconciliation"
              className="inline-flex items-center gap-1 text-sm text-foreground hover:text-[var(--brand-orange)]"
            >
              Open reconciliation <ArrowUpRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | null;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="rounded-[16px] shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-xs uppercase tracking-wide">{label}</CardDescription>
        <Icon
          className="size-4"
          style={{ color: accent ? "var(--brand-orange)" : "var(--muted-foreground)" }}
        />
      </CardHeader>
      <CardContent>
        {loading || !value ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="font-display text-2xl font-semibold tabular-nums tracking-tight">
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
        <span className="text-sm">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "var(--brand-orange)",
          }}
        />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: { day: string; value: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
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
              <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" hide />
          <RechartsTooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--brand-orange)"
            strokeWidth={2}
            fill="url(#sparkOrange)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
