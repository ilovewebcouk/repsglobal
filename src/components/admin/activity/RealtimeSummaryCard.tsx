// Admin Activity v1.2 — GA-style Realtime Summary card.
//
// Big "Members online now" figure, "Member activity per minute" mini-bars for
// the last 30 minutes, device donut, and support KPIs. All numbers are
// logged-in-member-only (Amendment 1).

import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Info, MonitorSmartphone, Radio, Smartphone, Tablet, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RealtimeSummary } from "@/lib/ops/activity-realtime.functions";

const HONEST_LABEL =
  "Logged-in member activity only. Anonymous public analytics is disabled in v1.2.";

export function RealtimeSummaryCard({
  data, loading,
}: { data: RealtimeSummary | undefined; loading: boolean }) {
  const perMinute = data?.per_minute ?? [];
  const peak = Math.max(1, ...perMinute.map((p) => p.count));
  const deviceData = useMemo(() => {
    if (!data) return [];
    const d = data.devices;
    return [
      { name: "Mobile", value: d.mobile, fill: "#F97316" },
      { name: "Desktop", value: d.desktop, fill: "#38bdf8" },
      { name: "Tablet", value: d.tablet, fill: "#a78bfa" },
      { name: "Unknown", value: d.unknown, fill: "#64748b" },
    ].filter((x) => x.value > 0);
  }, [data]);
  const deviceTotal = deviceData.reduce((s, x) => s + x.value, 0);

  const online = data?.online_now ?? 0;
  const trendLast = perMinute.slice(-5).reduce((s, p) => s + p.count, 0);
  const trendPrev = perMinute.slice(-10, -5).reduce((s, p) => s + p.count, 0);
  const trendPct = trendPrev === 0 ? (trendLast > 0 ? 100 : 0) : Math.round(((trendLast - trendPrev) / trendPrev) * 100);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel to-[#1a1410]">
      <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/25" />
            <span className="relative flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
          </div>
          <div>
            <div className="font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-white/85">
              Realtime
            </div>
            <div className="text-[10.5px] text-white/45">Live · logged-in activity</div>
          </div>
        </div>
        <TooltipProvider delayDuration={100}>
          <UiTooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60 hover:bg-white/10">
                <Info className="h-3 w-3" /> Scope
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[280px] text-xs">
              {HONEST_LABEL}
            </TooltipContent>
          </UiTooltip>
        </TooltipProvider>
      </header>

      {/* HERO NUMBER — dominates */}
      <div className="border-b border-reps-border/60 px-5 pb-5 pt-6">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/55">
          Members online now
        </div>
        {loading && !data ? (
          <Skeleton className="mt-3 h-20 w-40" />
        ) : (
          <div className="mt-2 flex items-end gap-3">
            <div className={cn(
              "font-display font-bold leading-none tracking-tight",
              online > 0 ? "text-white" : "text-white/40",
            )} style={{ fontSize: "88px" }}>
              {online}
            </div>
            <div className="mb-2 flex flex-col gap-1">
              {online > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300">
                  <Radio className="h-3 w-3" /> Live
                </span>
              ) : (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] font-medium text-white/50">
                  Idle
                </span>
              )}
              {trendPct !== 0 && trendLast > 0 ? (
                <span className={cn(
                  "text-[10.5px] font-medium tabular-nums",
                  trendPct > 0 ? "text-emerald-300" : "text-white/50",
                )}>
                  {trendPct > 0 ? "+" : ""}{trendPct}% vs 5m
                </span>
              ) : null}
            </div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
          <div className="rounded-[10px] border border-reps-border/60 bg-white/[0.03] px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-white/45">Members · 30m</div>
            <div className="mt-0.5 font-display text-[18px] font-bold tabular-nums text-white">
              {data?.members_last_30min ?? 0}
            </div>
          </div>
          <div className="rounded-[10px] border border-reps-border/60 bg-white/[0.03] px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-white/45">Events · 30m</div>
            <div className="mt-0.5 font-display text-[18px] font-bold tabular-nums text-white">
              {(data?.activity_last_30min ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="border-b border-reps-border/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
            Activity per minute · 30m
          </div>
          <span className="text-[10px] text-white/40 tabular-nums">peak {peak}</span>
        </div>
        <div className="mt-2 h-[112px] w-full">
          {loading && !data ? (
            <Skeleton className="h-full w-full" />
          ) : perMinute.every((p) => p.count === 0) ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <div className="text-[11px] font-medium text-white/45">No activity in the last 30 minutes</div>
              <div className="text-[10px] text-white/30">The chart updates as members interact.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perMinute} margin={{ top: 6, left: 0, right: 0, bottom: 0 }}>
                <XAxis dataKey="minute_ago" hide />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    background: "#0f1419", border: "1px solid #232a33", borderRadius: 8, fontSize: 11, color: "#fff",
                  }}
                  formatter={(v: number) => [`${v} events`, "Activity"]}
                  labelFormatter={(l: number) => `${l} min ago`}
                />
                <Bar dataKey="count" fill="#F97316" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-1 flex justify-between text-[9.5px] text-white/35">
          <span>-30m</span><span>now</span>
        </div>
      </div>

      {/* DEVICES */}
      <div className="px-5 py-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/55">
          Devices online now
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-[104px] w-[104px] shrink-0">
            {loading && !data ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : deviceTotal === 0 ? (
              <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-reps-border/60 text-[9.5px] text-white/35">
                No sessions
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={50} stroke="none" paddingAngle={2}>
                      {deviceData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0f1419", border: "1px solid #232a33", borderRadius: 8, fontSize: 11, color: "#fff" }}
                      formatter={(v: number, n: string) => [`${v}`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-display text-[16px] font-bold leading-none text-white">{deviceTotal}</div>
                  <div className="mt-0.5 text-[8.5px] uppercase tracking-wide text-white/45">sessions</div>
                </div>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5 text-[11px]">
            <DeviceRow icon={<Smartphone className="h-3 w-3" />} label="Mobile" value={data?.devices.mobile ?? 0} color="#F97316" total={deviceTotal} />
            <DeviceRow icon={<MonitorSmartphone className="h-3 w-3" />} label="Desktop" value={data?.devices.desktop ?? 0} color="#38bdf8" total={deviceTotal} />
            <DeviceRow icon={<Tablet className="h-3 w-3" />} label="Tablet" value={data?.devices.tablet ?? 0} color="#a78bfa" total={deviceTotal} />
            {data?.devices.unknown ? (
              <DeviceRow label="Unknown" value={data.devices.unknown} color="#64748b" total={deviceTotal} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeviceRow({ icon, label, value, color, total }: {
  icon?: React.ReactNode; label: string; value: number; color: string; total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-white/70">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {icon}{label}
      </span>
      <span className="text-white/85 tabular-nums">{value} <span className="text-white/40">({pct}%)</span></span>
    </div>
  );
}
