import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Plus, Search } from "lucide-react";
import { ProShell, PCard } from "@/components/dashboard/ProShell";

export const Route = createFileRoute("/dashboard_/clients")({
  head: () => ({
    meta: [
      { title: "Clients — REPs Professional Dashboard" },
      { name: "description", content: "Manage your active clients, retention and adherence in one view." },
      { property: "og:title", content: "Clients — REPs" },
      { property: "og:description", content: "All your clients, their progress and lifetime value at a glance." },
    ],
  }),
  component: ClientsIndex,
});

type Status = "Active" | "Onboarding" | "At risk" | "Paused";

const STATUS_STYLE: Record<Status, string> = {
  Active: "bg-reps-green/15 text-reps-green",
  Onboarding: "bg-reps-orange-soft text-reps-orange",
  "At risk": "bg-rose-500/15 text-rose-400",
  Paused: "bg-white/10 text-white/60",
};

const CLIENTS: {
  name: string; goal: string; plan: string; status: Status; adherence: number; ltv: number; last: string; slug?: string;
}[] = [
  { name: "Sarah Johnson", goal: "Marathon prep", plan: "12-week elite", status: "Active", adherence: 94, ltv: 2840, last: "2h ago", slug: "sarah-johnson" },
  { name: "Amelia Carter", goal: "Postnatal strength", plan: "Pilates 1:1", status: "Active", adherence: 88, ltv: 1960, last: "Today" },
  { name: "Daniel Brooks", goal: "Hypertrophy", plan: "Pro coaching", status: "Active", adherence: 91, ltv: 3120, last: "Yesterday" },
  { name: "Priya Shah", goal: "Fat loss", plan: "Foundation", status: "Onboarding", adherence: 0, ltv: 240, last: "New" },
  { name: "Marcus Reid", goal: "Return to sport", plan: "Rehab block", status: "Active", adherence: 82, ltv: 1480, last: "3d ago" },
  { name: "Olivia Bennett", goal: "Wellbeing", plan: "Monthly", status: "At risk", adherence: 41, ltv: 880, last: "12d ago" },
  { name: "Tom Hughes", goal: "Strength + mobility", plan: "Pro coaching", status: "Active", adherence: 96, ltv: 4210, last: "Today" },
  { name: "Hannah Lewis", goal: "Pre-wedding", plan: "8-week sprint", status: "Active", adherence: 89, ltv: 1320, last: "1d ago" },
  { name: "Jacob Patel", goal: "Powerlifting", plan: "Elite peaking", status: "Paused", adherence: 0, ltv: 2640, last: "21d ago" },
  { name: "Emma Walsh", goal: "Postnatal", plan: "Pilates 1:1", status: "Onboarding", adherence: 0, ltv: 0, last: "New" },
];

function ClientsIndex() {
  const total = CLIENTS.length;
  const active = CLIENTS.filter((c) => c.status === "Active").length;
  const atRisk = CLIENTS.filter((c) => c.status === "At risk").length;
  const onboarding = CLIENTS.filter((c) => c.status === "Onboarding").length;

  return (
    <ProShell
      active="Clients"
      title="Clients"
      subtitle="148 active · 6 onboarding · 4 at risk"
      actions={
        <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover">
          <Plus className="h-4 w-4" /> Add client
        </button>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Total clients" value={total.toString()} delta="+8 this month" />
        <Kpi label="Active" value={active.toString()} delta="92% retention" />
        <Kpi label="Onboarding" value={onboarding.toString()} delta="2 awaiting intake" />
        <Kpi label="At risk" value={atRisk.toString()} delta="Adherence < 50%" tone="warn" />
      </div>

      <PCard className="p-0">
        <div className="flex items-center gap-3 border-b border-reps-border p-4">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[13px] text-white/55">
            <Search className="h-4 w-4" />
            <span className="flex-1">Search by name, goal or plan…</span>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-3 text-[13px] font-medium text-white/80 hover:text-white">
            <Filter className="h-4 w-4" /> Filters
          </button>
          <div className="hidden gap-1 rounded-[10px] border border-reps-border bg-reps-ink p-1 text-[12px] font-medium md:flex">
            {["All", "Active", "Onboarding", "At risk", "Paused"].map((t, i) => (
              <button
                key={t}
                className={`rounded-[8px] px-3 py-1.5 ${i === 0 ? "bg-reps-orange-soft text-reps-orange" : "text-white/65 hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Goal</th>
                <th className="px-3 py-3 font-semibold">Plan</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Adherence</th>
                <th className="px-3 py-3 font-semibold">LTV</th>
                <th className="px-3 py-3 font-semibold">Last check-in</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c) => (
                <tr key={c.name} className="border-t border-reps-border/60 text-white/85">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-reps-orange-soft text-[11px] font-semibold text-reps-orange">
                        {c.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </span>
                      <span className="font-semibold text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-white/65">{c.goal}</td>
                  <td className="px-3 py-3 text-white/65">{c.plan}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${STATUS_STYLE[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {c.adherence > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-reps-ink">
                          <div
                            className="h-full rounded-full bg-reps-orange"
                            style={{ width: `${c.adherence}%` }}
                          />
                        </div>
                        <span className="text-[12px] text-white/65">{c.adherence}%</span>
                      </div>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-semibold">£{c.ltv.toLocaleString()}</td>
                  <td className="px-3 py-3 text-white/55">{c.last}</td>
                  <td className="px-5 py-3 text-right">
                    {c.slug ? (
                      <Link
                        to="/dashboard/clients/$slug"
                        params={{ slug: c.slug }}
                        className="text-[12px] font-semibold text-reps-orange hover:underline"
                      >
                        View
                      </Link>
                    ) : (
                      <button className="text-[12px] font-semibold text-reps-orange hover:underline">
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PCard>
    </ProShell>
  );
}

function Kpi({ label, value, delta, tone = "ok" }: { label: string; value: string; delta: string; tone?: "ok" | "warn" }) {
  return (
    <PCard>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">{label}</div>
      <div className="mt-2 font-display text-[28px] font-bold leading-none text-white">{value}</div>
      <div className={`mt-2 text-[12px] ${tone === "warn" ? "text-rose-400" : "text-reps-green"}`}>{delta}</div>
    </PCard>
  );
}
