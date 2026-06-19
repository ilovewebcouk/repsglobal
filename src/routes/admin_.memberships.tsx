import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Crown,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  getMembershipMetrics,
  getRevenueForecast,
  getMembershipActivity,
  type MembershipMetrics,
  type RevenueForecast,
} from "@/lib/admin/memberships.functions";
import { formatMonthLabel, gbp, quarterFor } from "@/lib/admin/billing-metrics";

export const Route = createFileRoute("/admin_/memberships")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminMembershipsPage,
});

function AdminMembershipsPage() {
  const router = useRouter();

  const metricsQ = useQuery({
    queryKey: ["admin", "membership-metrics"],
    queryFn: () => getMembershipMetrics(),
  });
  const forecastQ = useQuery({
    queryKey: ["admin", "membership-forecast"],
    queryFn: () => getRevenueForecast(),
  });
  const activityQ = useQuery({
    queryKey: ["admin", "membership-activity"],
    queryFn: () => getMembershipActivity(),
  });

  return (
    <DashboardShell
      role="admin"
      active="Memberships"
      title="Memberships"
      subtitle="Recurring income, renewals, and projected cash from REPs memberships."
    >
      <KpiRow data={metricsQ.data} loading={metricsQ.isLoading} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TierCard
          tier="verified"
          title="Verified"
          price="£99/year"
          icon={<BadgeCheck className="h-4 w-4 text-reps-orange" />}
          active={metricsQ.data?.verifiedActive ?? 0}
          scheduled={metricsQ.data?.verifiedScheduled ?? 0}
          loading={metricsQ.isLoading}
        />
        <TierCard
          tier="pro"
          title="Pro"
          price="£59/month"
          icon={<Crown className="h-4 w-4 text-reps-orange" />}
          active={metricsQ.data?.tiers.find((t) => t.tier === "pro")?.active ?? 0}
          trialing={metricsQ.data?.tiers.find((t) => t.tier === "pro")?.trialing ?? 0}
          loading={metricsQ.isLoading}
        />
        <TierCard
          tier="studio"
          title="Studio"
          price="£149/month"
          icon={<Users className="h-4 w-4 text-reps-orange" />}
          active={metricsQ.data?.tiers.find((t) => t.tier === "studio")?.active ?? 0}
          loading={metricsQ.isLoading}
        />
      </div>

      <DistributionStrip data={metricsQ.data} loading={metricsQ.isLoading} />

      <ForecastChartPanel data={forecastQ.data} loading={forecastQ.isLoading} />

      <MonthlyForecastTable data={forecastQ.data} loading={forecastQ.isLoading} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingPaymentsPanel data={metricsQ.data} loading={metricsQ.isLoading} />
        <PastDuePanel data={metricsQ.data} loading={metricsQ.isLoading} />
      </div>

      <RecentActivityPanel
        rows={activityQ.data ?? []}
        loading={activityQ.isLoading}
        onRefresh={() => router.invalidate()}
      />
    </DashboardShell>
  );
}

// ---------------------------------------------------------------- KPI row

function KpiRow({ data, loading }: { data?: MembershipMetrics; loading: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Forecast ARR"
        value={loading ? null : gbp(data?.forecastArrPence ?? 0)}
        sub={
          loading || !data
            ? "—"
            : `${gbp(data.activeArrPence)} active · ${gbp(data.scheduledArrPence)} scheduled`
        }
      />
      <KpiCard
        label="Upcoming payments"
        value={loading ? null : gbp(data?.upcoming14dPence ?? 0)}
        sub={
          loading || !data
            ? "—"
            : `${data.upcoming14dCount} member${data.upcoming14dCount === 1 ? "" : "s"} · next 14 days`
        }
      />
      <KpiCard
        label="Verified members"
        value={loading ? null : String((data?.verifiedActive ?? 0) + (data?.verifiedScheduled ?? 0))}
        sub={
          loading || !data
            ? "—"
            : `${data.verifiedActive} active · ${data.verifiedScheduled} scheduled`
        }
      />
      <KpiCard
        label="Past due"
        value={loading ? null : String(data?.pastDueCount ?? 0)}
        sub={
          loading
            ? "—"
            : (data?.pastDueCount ?? 0) === 0
              ? "All members up to date"
              : "Requires follow-up"
        }
        tone={(data?.pastDueCount ?? 0) > 0 ? "warn" : "neutral"}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string | null;
  sub: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <PCard>
      <div className="text-[12px] text-white/55">{label}</div>
      {value === null ? (
        <Skeleton className="mt-2 h-7 w-24 bg-white/5" />
      ) : (
        <div className="mt-1 font-display text-[26px] font-bold text-white">{value}</div>
      )}
      <div
        className={
          "mt-1 text-[11px] " + (tone === "warn" ? "text-reps-orange" : "text-white/55")
        }
      >
        {sub}
      </div>
    </PCard>
  );
}

// ---------------------------------------------------------------- Tier cards

function TierCard({
  title,
  price,
  icon,
  active,
  trialing,
  scheduled,
  loading,
}: {
  tier: string;
  title: string;
  price: string;
  icon: React.ReactNode;
  active: number;
  trialing?: number;
  scheduled?: number;
  loading: boolean;
}) {
  const total = active + (trialing ?? 0) + (scheduled ?? 0);
  const splitBits: string[] = [];
  splitBits.push(`${active} active`);
  if (typeof trialing === "number" && trialing > 0) splitBits.push(`${trialing} trialing`);
  if (typeof scheduled === "number" && scheduled > 0) splitBits.push(`${scheduled} scheduled`);

  return (
    <PPanel className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-display text-[17px] font-bold text-white">{title}</h3>
          </div>
          <div className="mt-1 text-[12px] text-white/55">{price}</div>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-12 bg-white/5" />
        ) : (
          <span className="font-display text-[22px] font-bold text-white">
            {total.toLocaleString()}
          </span>
        )}
      </div>
      <div className="mt-4 text-[12px] text-white/70">
        {loading ? <Skeleton className="h-4 w-32 bg-white/5" /> : splitBits.join(" · ")}
      </div>
    </PPanel>
  );
}

// ---------------------------------------------------------------- Distribution strip

function DistributionStrip({ data, loading }: { data?: MembershipMetrics; loading: boolean }) {
  if (loading || !data || data.distribution.length === 0) return null;
  const total = data.distribution.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;
  const toneClass = (tone: string) =>
    tone === "verified"
      ? "bg-reps-orange"
      : tone === "scheduled"
        ? "bg-reps-orange/40"
        : tone === "pro"
          ? "bg-white/55"
          : "bg-emerald-400";

  return (
    <PCard className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] text-white/55">Plan distribution</div>
        <div className="text-[11px] text-white/45">{total.toLocaleString()} members</div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-reps-ink">
        {data.distribution.map((d) => (
          <div
            key={d.label}
            className={"h-full " + toneClass(d.tone)}
            style={{ width: `${(d.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/60">
        {data.distribution.map((d) => (
          <span key={d.label} className="flex items-center gap-1.5">
            <span className={"h-2 w-2 rounded-full " + toneClass(d.tone)} />
            {d.label} · {d.count.toLocaleString()}
          </span>
        ))}
      </div>
    </PCard>
  );
}

// ---------------------------------------------------------------- Forecast chart

const CHART_CONFIG = {
  total: { label: "Projected income", color: "var(--reps-orange, hsl(20, 95%, 55%))" },
} satisfies ChartConfig;

function ForecastChartPanel({ data, loading }: { data?: RevenueForecast; loading: boolean }) {
  const chartData = useMemo(
    () =>
      (data?.months ?? []).map((m) => ({
        month: m.monthKey,
        label: formatMonthLabel(m.monthKey),
        total: m.totalPence / 100,
        verified: m.verifiedPence / 100,
        pro: m.proPence / 100,
        studio: m.studioPence / 100,
        scheduled: m.scheduledPence / 100,
      })),
    [data],
  );

  return (
    <PPanel className="mt-6">
      <div className="flex flex-col gap-4 border-b border-reps-border px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-[16px] font-bold text-white">
            Recurring income forecast
          </h2>
          <p className="text-[12px] text-white/55">
            Projected membership income based on active subscriptions and scheduled renewals.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ForecastTile label="Year 1" value={loading ? null : gbp(data?.yearOneTotalPence ?? 0)} />
          <ForecastTile label="Year 2" value={loading ? null : gbp(data?.yearTwoTotalPence ?? 0)} />
          <ForecastTile label="This month" value={loading ? null : gbp(data?.currentMonthPence ?? 0)} />
          <ForecastTile label="Next 14 days" value={loading ? null : gbp(data?.next14dPence ?? 0)} />
        </div>
      </div>
      <div className="p-5">
        {loading ? (
          <Skeleton className="h-[280px] w-full bg-white/5" />
        ) : chartData.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No forecast data yet</EmptyTitle>
              <EmptyDescription>
                Projected income will appear once active subscriptions or scheduled renewals exist.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer config={CHART_CONFIG} className="h-[280px] w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  stroke="rgba(255,255,255,0.45)"
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="rgba(255,255,255,0.45)"
                  fontSize={11}
                  width={50}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `£${(v / 1000).toFixed(1)}k` : `£${v.toFixed(0)}`
                  }
                />
                <ChartTooltip
                  cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value, name, item) => {
                        const p = item.payload as any;
                        return (
                          <div className="flex w-44 flex-col gap-1 text-[12px]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-white/70">Projected</span>
                              <span className="font-semibold text-white">
                                £{Number(value).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            {p.verified > 0 && (
                              <Row label="Verified" v={p.verified} />
                            )}
                            {p.pro > 0 && <Row label="Pro" v={p.pro} />}
                            {p.studio > 0 && <Row label="Studio" v={p.studio} />}
                            {p.scheduled > 0 && <Row label="Scheduled" v={p.scheduled} />}
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>
    </PPanel>
  );
}

function Row({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-white/55">
      <span>{label}</span>
      <span>£{v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</span>
    </div>
  );
}

function ForecastTile({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-ink p-3">
      <div className="text-[10px] uppercase tracking-wide text-white/45">{label}</div>
      {value === null ? (
        <Skeleton className="mt-1 h-5 w-16 bg-white/5" />
      ) : (
        <div className="mt-0.5 font-display text-[15px] font-bold text-white">{value}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Monthly table

function MonthlyForecastTable({
  data,
  loading,
}: {
  data?: RevenueForecast;
  loading: boolean;
}) {
  // Interleave quarterly subtotal rows into the month rows.
  const rows = useMemo(() => {
    if (!data) return [] as Array<
      | { kind: "month"; m: RevenueForecast["months"][number] }
      | { kind: "quarter"; label: string; totalPence: number }
    >;
    const out: Array<
      | { kind: "month"; m: RevenueForecast["months"][number] }
      | { kind: "quarter"; label: string; totalPence: number }
    > = [];
    let curQ: string | null = null;
    let qSum = 0;
    let qLabel = "";
    for (const m of data.months) {
      const q = quarterFor(m.monthKey);
      const key = `${q.year}-Q${q.quarter}`;
      if (curQ === null) {
        curQ = key;
        qLabel = q.label;
      }
      if (key !== curQ) {
        out.push({ kind: "quarter", label: qLabel, totalPence: qSum });
        curQ = key;
        qLabel = q.label;
        qSum = 0;
      }
      out.push({ kind: "month", m });
      qSum += m.totalPence;
    }
    if (curQ !== null) out.push({ kind: "quarter", label: qLabel, totalPence: qSum });
    return out;
  }, [data]);

  return (
    <PPanel className="mt-6">
      <div className="border-b border-reps-border px-5 py-4">
        <h2 className="font-display text-[16px] font-bold text-white">Monthly forecast</h2>
        <p className="text-[12px] text-white/55">
          Next 24 months. Quarterly totals shown after each quarter.
        </p>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-5">
            <Skeleton className="h-64 w-full bg-white/5" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-reps-border hover:bg-transparent">
                <TableHead className="text-white/55">Month</TableHead>
                <TableHead className="text-right text-white/55">Verified</TableHead>
                <TableHead className="text-right text-white/55">Pro</TableHead>
                <TableHead className="text-right text-white/55">Studio</TableHead>
                <TableHead className="text-right text-white/55">Scheduled</TableHead>
                <TableHead className="text-right text-white/55">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) =>
                r.kind === "month" ? (
                  <TableRow key={"m-" + r.m.monthKey} className="border-reps-border">
                    <TableCell className="text-white">{formatMonthLabel(r.m.monthKey)}</TableCell>
                    <TableCell className="text-right text-white/80">
                      {r.m.verifiedPence ? gbp(r.m.verifiedPence) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-white/80">
                      {r.m.proPence ? gbp(r.m.proPence) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-white/80">
                      {r.m.studioPence ? gbp(r.m.studioPence) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-white/80">
                      {r.m.scheduledPence ? gbp(r.m.scheduledPence) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-white">
                      {r.m.totalPence ? gbp(r.m.totalPence) : "—"}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow
                    key={"q-" + i + "-" + r.label}
                    className="border-reps-border bg-reps-ink/60 hover:bg-reps-ink/60"
                  >
                    <TableCell className="text-[12px] font-semibold uppercase tracking-wide text-white/55">
                      {r.label} subtotal
                    </TableCell>
                    <TableCell colSpan={4} />
                    <TableCell className="text-right font-bold text-white">
                      {r.totalPence ? gbp(r.totalPence) : "—"}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </PPanel>
  );
}

// ---------------------------------------------------------------- Follow-up panels

function UpcomingPaymentsPanel({
  data,
  loading,
}: {
  data?: MembershipMetrics;
  loading: boolean;
}) {
  return (
    <PPanel>
      <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
        <div>
          <h2 className="font-display text-[16px] font-bold text-white">Upcoming payments</h2>
          <p className="text-[12px] text-white/55">Next 14 days</p>
        </div>
        <CalendarClock className="h-4 w-4 text-white/40" />
      </div>
      <div className="p-5">
        {loading ? (
          <Skeleton className="h-24 w-full bg-white/5" />
        ) : !data || data.upcoming14dCount === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No payments due in the next 14 days</EmptyTitle>
              <EmptyDescription>
                Renewals and scheduled Verified payments will list here as they approach.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[28px] font-bold text-white">
              {gbp(data.upcoming14dPence)}
            </span>
            <span className="text-[12px] text-white/55">
              across {data.upcoming14dCount} member{data.upcoming14dCount === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>
    </PPanel>
  );
}

function PastDuePanel({ data, loading }: { data?: MembershipMetrics; loading: boolean }) {
  return (
    <PPanel>
      <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
        <div>
          <h2 className="font-display text-[16px] font-bold text-white">Past due</h2>
          <p className="text-[12px] text-white/55">Members requiring follow-up</p>
        </div>
        <AlertTriangle className="h-4 w-4 text-white/40" />
      </div>
      <div className="p-5">
        {loading ? (
          <Skeleton className="h-24 w-full bg-white/5" />
        ) : !data || data.pastDueCount === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No past-due memberships</EmptyTitle>
              <EmptyDescription>
                Failed payments and unpaid subscriptions will list here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[28px] font-bold text-reps-orange">
              {data.pastDueCount}
            </span>
            <span className="text-[12px] text-white/55">requires payment follow-up</span>
          </div>
        )}
      </div>
    </PPanel>
  );
}

// ---------------------------------------------------------------- Activity (secondary)

function RecentActivityPanel({
  rows,
  loading,
  onRefresh,
}: {
  rows: Awaited<ReturnType<typeof getMembershipActivity>>;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <PPanel className="mt-6">
      <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
        <div>
          <h2 className="font-display text-[14px] font-semibold text-white">Recent membership activity</h2>
          <p className="text-[12px] text-white/55">Subscription events from webhooks.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      </div>
      {loading ? (
        <div className="p-5">
          <Skeleton className="h-20 w-full bg-white/5" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No subscription activity yet</EmptyTitle>
              <EmptyDescription>
                Stripe subscription events will appear here once webhooks are processing.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <ul className="divide-y divide-reps-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white">
                  {r.fullName ?? "Unknown member"}
                </div>
                <div className="text-[11px] text-white/55">{r.summary}</div>
                <div className="text-[10px] text-white/40">
                  {new Date(r.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {r.eventType.split(".").slice(-1)[0]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </PPanel>
  );
}
