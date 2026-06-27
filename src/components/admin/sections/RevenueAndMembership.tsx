import { ChevronRight } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "@tanstack/react-router";

import { AdminCard } from "@/components/admin/AdminCard";
import { PanelHeader } from "@/components/admin/PanelHeader";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdminOverviewDTO } from "@/lib/admin/overview.functions";

function fmtPounds(pence: number) {
  if (!pence) return "£0";
  return "£" + Math.round(pence / 100).toLocaleString();
}

function shortDay(d: string) {
  const parts = d.split("-");
  return `${Number(parts[2])} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(parts[1]) - 1]}`;
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-[12px] text-white/45">
      {msg}
    </div>
  );
}

const areaConfig: ChartConfig = {
  value: { label: "Members", color: "var(--reps-orange)" },
};
const revenueConfig: ChartConfig = {
  value: { label: "Received", color: "var(--reps-orange)" },
};
const forecastConfig: ChartConfig = {
  value: { label: "Projected", color: "var(--reps-blue)" },
};
const mixConfig: ChartConfig = {
  value: { label: "Members", color: "var(--reps-orange)" },
};

export function RevenueAndMembership({
  data,
  periodLabel,
}: {
  data: AdminOverviewDTO;
  periodLabel: string;
}) {
  const mixData = [
    { tier: "Core", value: data.mix.verified },
    { tier: "Pro", value: data.mix.pro },
    { tier: "Studio", value: data.mix.studio },
  ];
  const revenuePounds = (data.revenueSeries ?? []).map((p) => ({
    day: shortDay(p.day),
    value: p.value / 100,
  }));
  const forecastPounds = (data.forecastSeries ?? []).map((p) => ({
    day: shortDay(p.day),
    value: p.value / 100,
  }));
  const membersChart = (data.membersSeries ?? []).map((p) => ({
    day: shortDay(p.day),
    value: p.value,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AdminCard size="panel">
        <PanelHeader title="Member growth" />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">
            {data.totalMembers.toLocaleString()}
          </span>
          <span className="text-[12px] text-white/55">
            {data.netMemberGrowth > 0
              ? `+${data.netMemberGrowth} net this period`
              : data.netMemberGrowth < 0
                ? `${data.netMemberGrowth} net this period`
                : "No change this period"}
          </span>
        </div>
        <div className="mt-4">
          {membersChart.length > 1 ? (
            <ChartContainer config={areaConfig} className="h-[220px] w-full">
              <AreaChart data={membersChart} margin={{ left: 6, right: 6, top: 6 }} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={32} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="memArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--reps-orange)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--reps-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="var(--reps-orange)" strokeWidth={2} fill="url(#memArea)" />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyState msg="Not enough history yet" />
          )}
        </div>
      </AdminCard>

      <AdminCard size="panel">
        <PanelHeader title="Revenue received" />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">
            {fmtPounds(data.revenuePence)}
          </span>
          <span className="text-[12px] text-white/55">{periodLabel}</span>
        </div>
        <div className="mt-4">
          {revenuePounds.length > 0 && data.revenuePence > 0 ? (
            <ChartContainer config={revenueConfig} className="h-[220px] w-full">
              <BarChart data={revenuePounds} margin={{ left: 6, right: 6, top: 6 }} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={32} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `£${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--reps-orange)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState msg="No payments received in this period" />
          )}
        </div>
      </AdminCard>

      <AdminCard size="panel">
        <PanelHeader title="Forecast revenue" />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">
            {fmtPounds(data.forecastPence)}
          </span>
          <span className="text-[12px] text-white/55">Next 30 days · projected cash due</span>
        </div>
        <div className="mt-4">
          {forecastPounds.length > 0 && data.forecastPence > 0 ? (
            <ChartContainer config={forecastConfig} className="h-[220px] w-full">
              <BarChart data={forecastPounds} margin={{ left: 6, right: 6, top: 6 }} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={32} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `£${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--reps-blue)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState msg="No scheduled renewals in the next 30 days" />
          )}
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/admin/memberships"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline"
          >
            View full forecast <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </AdminCard>

      <AdminCard size="panel">
        <PanelHeader title="Member mix" />
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[28px] font-bold leading-none text-white">
            {data.totalMembers.toLocaleString()}
          </span>
          <span className="text-[12px] text-white/55">Active members by tier</span>
        </div>
        <div className="mt-4">
          {data.totalMembers > 0 ? (
            <ChartContainer config={mixConfig} className="h-[220px] w-full">
              <BarChart data={mixData} layout="vertical" margin={{ left: 12, right: 12, top: 6 }} accessibilityLayer>
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="tier" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }} tickLine={false} axisLine={false} width={72} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--reps-orange)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState msg="No active members yet" />
          )}
        </div>
      </AdminCard>
    </div>
  );
}
