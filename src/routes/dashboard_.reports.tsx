import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  Filter,
  LineChart,
  PoundSterling,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { PCard, PPanel, ProShell } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/dashboard_/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — REPs Professional" },
      {
        name: "description",
        content:
          "Revenue, retention, utilisation and lead attribution — the proof your REPs business is healthy.",
      },
      { property: "og:title", content: "Reports & Analytics — REPs Professional" },
      { property: "og:description", content: "Revenue, retention, utilisation, attribution." },
      { property: "og:url", content: "/dashboard/reports" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/reports" }],
  }),
  component: ReportsPage,
});

const KPIS = [
  { label: "Revenue · 30d", value: "£14,820", delta: "+18.2% vs prev", tone: "up", icon: PoundSterling },
  { label: "Active clients", value: "47", delta: "+4 this month", tone: "up", icon: Users },
  { label: "Session utilisation", value: "84%", delta: "Target 80%", tone: "up", icon: LineChart },
  { label: "Lead → client", value: "31%", delta: "Industry avg 18%", tone: "up", icon: TrendingUp },
  { label: "Avg LTV", value: "£2,140", delta: "-3.1% vs prev", tone: "down", icon: Banknote },
];

const REVENUE = [
  { w: "W1", a: 880, b: 320, c: 180, d: 110 },
  { w: "W2", a: 940, b: 360, c: 200, d: 150 },
  { w: "W3", a: 1020, b: 420, c: 220, d: 160 },
  { w: "W4", a: 1100, b: 380, c: 260, d: 180 },
  { w: "W5", a: 1240, b: 410, c: 280, d: 200 },
  { w: "W6", a: 1180, b: 440, c: 260, d: 180 },
  { w: "W7", a: 1320, b: 480, c: 300, d: 220 },
  { w: "W8", a: 1410, b: 510, c: 320, d: 240 },
  { w: "W9", a: 1380, b: 540, c: 340, d: 260 },
  { w: "W10", a: 1500, b: 560, c: 360, d: 280 },
  { w: "W11", a: 1580, b: 600, c: 380, d: 300 },
  { w: "W12", a: 1720, b: 640, c: 400, d: 320 },
];

const COHORTS = [
  { month: "Jan", acquired: 8, retained: 7, churned: 1, ltv: "£2,460" },
  { month: "Feb", acquired: 6, retained: 6, churned: 0, ltv: "£2,820" },
  { month: "Mar", acquired: 11, retained: 9, churned: 2, ltv: "£1,940" },
  { month: "Apr", acquired: 9, retained: 8, churned: 1, ltv: "£2,210" },
  { month: "May", acquired: 13, retained: 12, churned: 1, ltv: "£1,880" },
];

const SERVICES = [
  { name: "1:1 Strength Coaching", revenue: "£6,420", share: 43, change: "+12%" },
  { name: "Hybrid Programme", revenue: "£3,840", share: 26, change: "+22%" },
  { name: "Nutrition Strategy", revenue: "£2,180", share: 15, change: "+8%" },
  { name: "Group Strength", revenue: "£1,480", share: 10, change: "−4%" },
  { name: "One-off consults", revenue: "£900", share: 6, change: "+18%" },
];

const SOURCES = [
  { source: "REPs Directory", leads: 38, conv: "34%", revenue: "£4,820" },
  { source: "Instagram", leads: 22, conv: "27%", revenue: "£2,140" },
  { source: "Referral", leads: 14, conv: "57%", revenue: "£3,260" },
  { source: "Google", leads: 11, conv: "18%", revenue: "£980" },
  { source: "Walk-in", leads: 6, conv: "50%", revenue: "£1,420" },
];

function ReportsPage() {
  const max = Math.max(...REVENUE.map((r) => r.a + r.b + r.c + r.d));

  return (
    <ProShell
      active="Reports"
      title="Reports & Analytics"
      subtitle="Revenue, retention, utilisation and lead attribution — last 12 weeks."
      actions={
        <>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[13px] font-semibold text-white/80 shadow-none hover:text-white"
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            <ArrowDownToLine className="h-4 w-4" /> Export
          </button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <PCard key={k.label} className="!p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  {k.label}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">
                {k.value}
              </div>
              <div
                className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${
                  k.tone === "up" ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {k.tone === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {k.delta}
              </div>
            </PCard>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-white">Revenue trend</h3>
                <p className="text-[12px] text-white/55">By stream · last 12 weeks</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/65">
                {[
                  { c: "bg-reps-orange", l: "1:1" },
                  { c: "bg-emerald-400", l: "Programmes" },
                  { c: "bg-sky-400", l: "Group" },
                  { c: "bg-violet-400", l: "Nutrition" },
                ].map((s) => (
                  <span key={s.l} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${s.c}`} /> {s.l}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 pt-6">
              <div className="flex h-[220px] items-end gap-2">
                {REVENUE.map((r) => {
                  const total = r.a + r.b + r.c + r.d;
                  const h = (total / max) * 100;
                  return (
                    <div key={r.w} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="flex w-full flex-col overflow-hidden rounded-[8px]"
                        style={{ height: `${h}%` }}
                      >
                        <div className="bg-violet-400" style={{ flex: r.d }} />
                        <div className="bg-sky-400" style={{ flex: r.c }} />
                        <div className="bg-emerald-400" style={{ flex: r.b }} />
                        <div className="bg-reps-orange" style={{ flex: r.a }} />
                      </div>
                      <span className="text-[10px] text-white/45">{r.w}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </PPanel>

          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">Client cohorts</h3>
              <span className="text-[11px] text-white/55">Acquired by month, retained vs churned</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-[11px] uppercase tracking-wider text-white/45">
                  <tr>
                    <th className="px-5 py-3 font-medium">Cohort</th>
                    <th className="px-5 py-3 font-medium">Acquired</th>
                    <th className="px-5 py-3 font-medium">Retained</th>
                    <th className="px-5 py-3 font-medium">Churned</th>
                    <th className="px-5 py-3 font-medium">Retention</th>
                    <th className="px-5 py-3 text-right font-medium">Avg LTV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-reps-border/60">
                  {COHORTS.map((c) => {
                    const ret = Math.round((c.retained / c.acquired) * 100);
                    return (
                      <tr key={c.month}>
                        <td className="px-5 py-3 font-semibold text-white">{c.month} 2025</td>
                        <td className="px-5 py-3 text-white/80">{c.acquired}</td>
                        <td className="px-5 py-3 text-emerald-300">{c.retained}</td>
                        <td className="px-5 py-3 text-rose-300">{c.churned}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-reps-panel-soft">
                              <div
                                className="h-full rounded-full bg-reps-orange"
                                style={{ width: `${ret}%` }}
                              />
                            </div>
                            <span className="text-[12px] text-white/75">{ret}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-white">{c.ltv}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PPanel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-4">
          <PCard>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-white">REPs AI insight</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-white/70">
                  Hybrid Programme revenue is up 22% — your strongest growth stream. Consider
                  raising the Group Strength price by 8% to offset the −4% drop.
                </p>
              </div>
            </div>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">Top-performing services</h3>
            <ul className="mt-3 space-y-3">
              {SERVICES.map((s) => (
                <li key={s.name}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-white/85">{s.name}</span>
                    <span className="font-semibold text-white">{s.revenue}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-reps-panel-soft">
                      <div
                        className="h-full rounded-full bg-reps-orange"
                        style={{ width: `${s.share}%` }}
                      />
                    </div>
                    <span
                      className={`w-10 text-right text-[11px] font-semibold ${
                        s.change.startsWith("−") ? "text-rose-300" : "text-emerald-300"
                      }`}
                    >
                      {s.change}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </PCard>

          <PCard>
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Lead attribution</h3>
              <button
                type="button"
                className="flex items-center gap-1 text-[11px] font-semibold text-reps-orange hover:underline"
              >
                Open <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <ul className="mt-3 divide-y divide-reps-border/60">
              {SOURCES.map((s) => (
                <li key={s.source} className="flex items-center justify-between py-2.5 text-[12px]">
                  <div>
                    <div className="font-semibold text-white">{s.source}</div>
                    <div className="text-[11px] text-white/55">
                      {s.leads} leads · {s.conv} converted
                    </div>
                  </div>
                  <span className="font-semibold text-white">{s.revenue}</span>
                </li>
              ))}
            </ul>
          </PCard>
        </div>
      </div>
    </ProShell>
  );
}
