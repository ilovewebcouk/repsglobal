import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/admin_/support")({
  ssr: false,
  beforeLoad: requireRole(['admin']),
  head: () => ({
    meta: [
      { title: "Support queue — REPS Admin" },
      { name: "description", content: "Triage and respond to support tickets across the REPS platform." },
      { property: "og:title", content: "Support queue — REPS Admin" },
      { property: "og:description", content: "Open, pending and resolved support tickets with SLA tracking." },
    ],
  }),
  component: AdminSupport,
});

type Pri = "Urgent" | "High" | "Normal" | "Low";
const PRI: Record<Pri, string> = {
  Urgent: "bg-rose-500/15 text-rose-300",
  High: "bg-reps-orange-soft text-reps-orange",
  Normal: "bg-white/10 text-white/70",
  Low: "bg-white/5 text-white/55",
};

const TICKETS: { id: string; subj: string; from: string; pri: Pri; assignee: string; sla: string; status: string }[] = [
  { id: "TKT-4821", subj: "Cannot upload DBS certificate", from: "Sarah Johnson", pri: "Urgent", assignee: "Emma R.", sla: "32m left", status: "Open" },
  { id: "TKT-4820", subj: "Stripe payout failed", from: "Marcus Reid", pri: "Urgent", assignee: "Unassigned", sla: "1h 14m", status: "Open" },
  { id: "TKT-4818", subj: "Booking slot won't release", from: "Hannah Lewis", pri: "High", assignee: "Tom B.", sla: "3h 02m", status: "Open" },
  { id: "TKT-4815", subj: "Profile photo missing after edit", from: "Daniel Brooks", pri: "Normal", assignee: "Emma R.", sla: "Today", status: "Pending" },
  { id: "TKT-4811", subj: "CPD points not syncing", from: "Priya Shah", pri: "High", assignee: "Tom B.", sla: "Today", status: "Pending" },
  { id: "TKT-4807", subj: "How do I cancel my Pro tier?", from: "Olivia Bennett", pri: "Low", assignee: "Emma R.", sla: "Tomorrow", status: "Pending" },
  { id: "TKT-4801", subj: "Verified badge stuck on pending", from: "Aaron Mitchell", pri: "High", assignee: "James A.", sla: "Resolved", status: "Resolved" },
];

function AdminSupport() {
  const open = TICKETS.filter((t) => t.status === "Open").length;
  const pending = TICKETS.filter((t) => t.status === "Pending").length;
  const resolved = TICKETS.filter((t) => t.status === "Resolved").length;

  return (
    <DashboardShell role="admin" active="Support" title="Support queue" subtitle={`${open} open · ${pending} pending · SLA on track`}>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Open", v: open.toString(), d: "2 urgent", tone: "warn" },
          { l: "Pending reply", v: pending.toString(), d: "Avg wait 4h 12m" },
          { l: "Resolved today", v: "18", d: "+22% vs yesterday" },
          { l: "First-response SLA", v: "94%", d: "Target 90%" },
        ].map((k) => (
          <PCard key={k.l}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">{k.l}</div>
            <div className="mt-2 font-display text-[28px] font-bold text-white">{k.v}</div>
            <div className={`mt-1 text-[12px] ${k.tone === "warn" ? "text-rose-400" : "text-reps-green"}`}>{k.d}</div>
          </PCard>
        ))}
      </div>

      <PPanel className="mt-6 p-0">
        <div className="flex items-center gap-1 border-b border-reps-border p-3 text-[12px] font-medium">
          {[
            ["Open", open],
            ["Pending", pending],
            ["Resolved", resolved],
            ["All", TICKETS.length],
          ].map(([l, n], i) => (
            <button
              key={l as string}
              className={`rounded-[8px] px-3 py-1.5 ${i === 0 ? "bg-reps-orange-soft text-reps-orange" : "text-white/65 hover:text-white"}`}
            >
              {l} <span className="ml-1 text-[11px] opacity-70">{n}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                <th className="px-5 py-3 font-semibold">Ticket</th>
                <th className="px-3 py-3 font-semibold">From</th>
                <th className="px-3 py-3 font-semibold">Priority</th>
                <th className="px-3 py-3 font-semibold">Assignee</th>
                <th className="px-3 py-3 font-semibold">SLA</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {TICKETS.map((t) => (
                <tr key={t.id} className="border-t border-reps-border/60 text-white/85">
                  <td className="px-5 py-3">
                    <div className="text-[11px] font-mono text-white/50">{t.id}</div>
                    <div className="text-[13px] font-semibold text-white">{t.subj}</div>
                  </td>
                  <td className="px-3 py-3 text-white/70">{t.from}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${PRI[t.pri]}`}>
                      {t.pri}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-white/70">{t.assignee}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 text-[12px] text-white/65">
                      <Clock className="h-3.5 w-3.5" />
                      {t.sla}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-[12px] font-semibold text-reps-orange hover:underline">Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PPanel>
    </DashboardShell>
  );
}
