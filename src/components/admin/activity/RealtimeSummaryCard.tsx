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

  return (
    <section className="overflow-hidden rounded-[18px] border border-reps-border bg-gradient-to-br from-reps-panel to-reps-panel-soft">
      <header className="flex items-center justify-between gap-3 border-b border-reps-border/70 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-6 w-6 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
            <Radio className="relative h-3.5 w-3.5 text-emerald-300" />
          </div>
          <div>
            <div className="font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-white/85">
              Realtime summary
            </div>
            <div className="text-[10.5px] text-white/45">Live logged-in activity</div>
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

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
        {/* Big number */}
        <div className="md:col-span-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
            Members online now
          </div>
          {loading && !data ? (
            <Skeleton className="mt-2 h-14 w-32" />
          ) : (
            <div className="mt-1 font-display text-[64px] font-bold leading-none text-white">
              {data?.online_now ?? 0}
            </div>
          )}
          <div className="mt-3 space-y-1.5 text-[11px] text-white/60">
            <MiniStat icon={<Users className="h-3 w-3" />} label="Members in last 30 min" value={data?.members_last_30min ?? 0} />
            <MiniStat label="Member activity in last 30 min" value={data?.activity_last_30min ?? 0} />
            <MiniStat label="Sign-ins today" value={data?.sign_ins_today ?? 0} />
            <MiniStat label="Member page views 24h" value={data?.member_views_24h ?? 0} />
            <MiniStat label="New members 24h" value={data?.new_members_24h ?? 0} />
          </div>
        </div>

        {/* Per-minute chart */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
              Member activity per minute · last 30 min
            </div>
            <span className="text-[10px] text-white/40">peak {peak}</span>
          </div>
          <div className="mt-2 h-[132px] w-full">
            {loading && !data ? (
              <Skeleton className="h-full w-full" />
            ) : perMinute.every((p) => p.count === 0) ? (
              <div className="flex h-full items-center justify-center text-[11px] text-white/35">
                No activity in the last 30 minutes
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
                  <Bar dataKey="count" fill="#F97316" radius={[3, 3, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-1 flex justify-between text-[9.5px] text-white/35">
            <span>-30m</span><span>now</span>
          </div>
        </div>

        {/* Device donut */}
        <div className="md:col-span-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
            Devices online now
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-[120px] w-[120px] shrink-0">
              {loading && !data ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : deviceTotal === 0 ? (
                <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-reps-border text-[10px] text-white/35">
                  No sessions
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={56}
                        stroke="none"
                        paddingAngle={2}
                      >
                        {deviceData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#0f1419", border: "1px solid #232a33", borderRadius: 8, fontSize: 11, color: "#fff" }}
                        formatter={(v: number, n: string) => [`${v}`, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-display text-[18px] font-bold leading-none text-white">{deviceTotal}</div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-wide text-white/45">sessions</div>
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
      </div>
    </section>
  );
}

function MiniStat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-white/55">{icon}{label}</span>
      <span className="font-medium text-white/90 tabular-nums">{value.toLocaleString()}</span>
    </div>
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
