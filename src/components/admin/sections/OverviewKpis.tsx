import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Area, AreaChart } from "recharts";
import { Users, Wallet, CalendarClock, UserPlus, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { AdminCard } from "@/components/admin/AdminCard";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { AdminOverviewDTO } from "@/lib/admin/overview.functions";

function fmtPounds(pence: number) {
  if (!pence) return "£0";
  return "£" + Math.round(pence / 100).toLocaleString();
}

function Sparkline({
  data,
  id,
}: {
  data: { day: string; value: number }[];
  id: string;
}) {
  const config = useMemo<ChartConfig>(
    () => ({ value: { label: "Value", color: "var(--reps-orange)" } }),
    [],
  );
  return (
    <ChartContainer config={config} className="h-10 w-full">
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--reps-orange)"
          strokeWidth={1.5}
          fill={`url(#spark-${id})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  delta,
  sub,
  series,
  id,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  sub: string;
  series: { day: string; value: number }[] | null;
  id: string;
}) {
  return (
    <AdminCard>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-white/55">{label}</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-[26px] font-bold leading-none text-white">
              {value}
            </span>
            {delta ? (
              <span
                className={`inline-flex items-center gap-1 text-[12px] font-semibold ${delta.positive ? "text-reps-green" : "text-white/55"}`}
              >
                <TrendingUp className="h-3 w-3" /> {delta.value}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[11px] text-white/45">{sub}</div>
        </div>
      </div>
      {series && series.length > 1 ? (
        <div className="mt-3">
          <Sparkline data={series} id={id} />
        </div>
      ) : (
        <div className="mt-3 h-10" aria-hidden />
      )}
    </AdminCard>
  );
}

export function OverviewKpis({ data }: { data: AdminOverviewDTO }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        id="members"
        icon={Users}
        label="Total members"
        value={data.totalMembers.toLocaleString()}
        delta={
          data.totalMembersDelta > 0
            ? { value: `+${data.totalMembersDelta} this period`, positive: true }
            : undefined
        }
        sub="Verified, Pro and Studio"
        series={data.membersSeries}
      />
      <KpiTile
        id="revenue"
        icon={Wallet}
        label="Revenue received"
        value={fmtPounds(data.revenuePence)}
        sub="Selected period"
        series={data.revenueSeries}
      />
      <KpiTile
        id="forecast"
        icon={CalendarClock}
        label="Forecast revenue"
        value={fmtPounds(data.forecastPence)}
        sub="Next 30 days"
        series={data.forecastSeries}
      />
      <KpiTile
        id="signups"
        icon={UserPlus}
        label="New registrations"
        value={data.newRegistrations.toLocaleString()}
        sub="Confirmed signups"
        series={data.signupsSeries}
      />
    </div>
  );
}
