import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Area, AreaChart } from "recharts";
import {
  Users,
  Wallet,
  CalendarClock,
  PoundSterling,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { AdminCard } from "@/components/admin/AdminCard";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminOverviewDTO } from "@/lib/admin/overview.functions";
import {
  FORECAST_HORIZON_OPTIONS,
  type ForecastHorizon,
} from "@/lib/admin/metrics-definitions";

function fmtPounds(pence: number) {
  if (!pence) return "£0";
  return "£" + Math.round(pence / 100).toLocaleString();
}

function Sparkline({
  data,
  id,
  color = "var(--reps-orange)",
}: {
  data: { day: string; value: number }[];
  id: string;
  color?: string;
}) {
  const config = useMemo<ChartConfig>(
    () => ({ value: { label: "Value", color } }),
    [color],
  );
  return (
    <ChartContainer config={config} className="h-10 w-full">
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${id})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function TileShell({
  icon: Icon,
  label,
  reconcileHash,
  headerRight,
  children,
}: {
  icon: LucideIcon;
  label: string;
  reconcileHash?: "revenue" | "members" | "registrations" | "forecast" | "growth";
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AdminCard>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] text-white/55">{label}</div>
            <div className="flex items-center gap-3">
              {headerRight}
              {reconcileHash ? (
                <Link
                  to="/admin/reconciliation"
                  hash={reconcileHash}
                  className="text-[10px] uppercase tracking-[0.14em] text-white/45 hover:text-reps-orange"
                >
                  Reconcile →
                </Link>
              ) : null}
            </div>
          </div>
          {children}
        </div>
      </div>
    </AdminCard>
  );
}

function ForecastHorizonSelector({ value }: { value: ForecastHorizon }) {
  const navigate = useNavigate();
  return (
    <Select
      value={value}
      onValueChange={(v) =>
        navigate({
          to: ".",
          search: (prev: Record<string, unknown>) => ({
            ...prev,
            fcast: v as ForecastHorizon,
          }),
        } as never)
      }
    >
      <SelectTrigger className="h-6 w-[150px] rounded-[6px] border border-white/10 bg-white/[0.03] px-2 text-[11px] font-medium text-white/70 shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-[10px]">
        {FORECAST_HORIZON_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[12px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OverviewKpis({
  data,
  fcastHorizon,
}: {
  data: AdminOverviewDTO;
  fcastHorizon: ForecastHorizon;
}) {
  const net = data.netMemberGrowth;
  const netPositive = net > 0;
  const netNeutral = net === 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* KPI 1 — Active paying members (M1 in metric registry) */}
      <TileShell icon={Users} label="Active paying members" reconcileHash="members">
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-[26px] font-bold leading-none text-white">
            {data.totalMembers.toLocaleString()}
          </span>
          {!netNeutral ? (
            <span
              className={`inline-flex items-center gap-1 text-[12px] font-semibold ${netPositive ? "text-reps-green" : "text-white/55"}`}
            >
              {netPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {netPositive ? `+${net}` : net} net
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-white/55">
          <span>
            Joined <span className="font-semibold text-white/80">{data.joinedInPeriod}</span>
          </span>
          <span className="text-white/20">·</span>
          <span>
            Churned <span className="font-semibold text-white/80">{data.churnedInPeriod}</span>
          </span>
        </div>
        {data.membersSeries && data.membersSeries.length > 1 ? (
          <div className="mt-3">
            <Sparkline data={data.membersSeries} id="members" />
          </div>
        ) : (
          <div className="mt-3 h-10" aria-hidden />
        )}
      </TileShell>

      {/* KPI 2 — Revenue Received */}
      <TileShell icon={Wallet} label="Revenue received" reconcileHash="revenue">
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-[26px] font-bold leading-none text-white">
            {fmtPounds(data.revenuePence)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-white/45">Cash banked, selected period</div>
        {data.revenueSeries && data.revenueSeries.length > 1 ? (
          <div className="mt-3">
            <Sparkline data={data.revenueSeries} id="revenue" />
          </div>
        ) : (
          <div className="mt-3 h-10" aria-hidden />
        )}
      </TileShell>

      {/* KPI 3 — Projected Cash Due (independent horizon) */}
      <TileShell
        icon={CalendarClock}
        label="Projected cash due"
        reconcileHash="forecast"
        headerRight={<ForecastHorizonSelector value={fcastHorizon} />}
      >
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-[26px] font-bold leading-none text-white">
            {fmtPounds(data.forecastPence)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-white/45">
          Scheduled renewals · separate from historical period
        </div>
        {data.forecastSeries && data.forecastSeries.length > 1 ? (
          <div className="mt-3">
            <Sparkline data={data.forecastSeries} id="forecast" color="var(--reps-blue)" />
          </div>
        ) : (
          <div className="mt-3 h-10" aria-hidden />
        )}
      </TileShell>

      {/* KPI 4 — Total Revenue (lifetime) */}
      <TileShell icon={PoundSterling} label="Total revenue" reconcileHash="revenue">
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-[26px] font-bold leading-none text-reps-green">
            {fmtPounds(data.lifetimeRevenuePence)}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-white/45">
          All-time cash banked across REPS
        </div>
        {data.revenueSeries && data.revenueSeries.length > 1 ? (
          <div className="mt-3">
            <Sparkline data={data.revenueSeries} id="lifetime" color="var(--reps-green)" />
          </div>
        ) : (
          <div className="mt-3 h-10" aria-hidden />
        )}
      </TileShell>
    </div>
  );
}
