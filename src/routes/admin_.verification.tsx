import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { ACard, AdminShell, APanel } from "@/components/dashboard/AdminShell";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";
import proDaniel from "@/assets/pro-daniel.jpg";
import proJames from "@/assets/pro-james.jpg";

export const Route = createFileRoute("/admin_/verification")({
  component: AdminVerificationPage,
});

const STATS = [
  { label: "In queue", value: "47", icon: Clock, tint: "bg-reps-orange-soft text-reps-orange" },
  { label: "Approved today", value: "32", icon: CheckCircle2, tint: "bg-reps-green/15 text-reps-green" },
  { label: "Rejected (7d)", value: "8", icon: XCircle, tint: "bg-red-500/15 text-red-400" },
  { label: "Avg. review time", value: "4h 12m", icon: ShieldCheck, tint: "bg-white/10 text-white/80" },
];

const QUEUE = [
  {
    img: proLaura,
    name: "Laura Bennett",
    submitted: "2h ago",
    docs: ["Level 4 Nutrition", "Insurance", "DBS Check"],
    risk: "Low",
    priority: "Standard",
  },
  {
    img: proDaniel,
    name: "Daniel Okafor (Renewal)",
    submitted: "5h ago",
    docs: ["Level 4 S&C", "Insurance"],
    risk: "Low",
    priority: "Standard",
  },
  {
    img: proJames,
    name: "Marcus Doyle",
    submitted: "1d ago",
    docs: ["Level 3 PT", "Insurance"],
    risk: "Flagged",
    priority: "High",
  },
  {
    img: proSophie,
    name: "Amelia Chen",
    submitted: "1d ago",
    docs: ["Pilates L4", "First Aid", "Insurance"],
    risk: "Low",
    priority: "Standard",
  },
];

const RECENT = [
  { name: "Hannah Wright", action: "Approved", by: "James A.", when: "12 min ago", status: "ok" },
  { name: "Tom Reilly", action: "Rejected — expired insurance", by: "Sophie M.", when: "45 min ago", status: "bad" },
  { name: "Priya Shah", action: "Approved", by: "James A.", when: "1h ago", status: "ok" },
  { name: "Owen Davies", action: "Info requested", by: "Sophie M.", when: "2h ago", status: "warn" },
];

function AdminVerificationPage() {
  return (
    <AdminShell
      active="Verification"
      title="Verification queue"
      subtitle="Review credentials, DBS checks, and insurance before activating professionals."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <ACard key={s.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white/55">{s.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">{s.value}</div>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </span>
            </div>
          </ACard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <APanel className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
            <div>
              <h2 className="font-display text-[16px] font-bold text-white">Pending review</h2>
              <p className="text-[12px] text-white/55">47 applications awaiting verification</p>
            </div>
            <button className="text-[12px] font-semibold text-reps-orange">Open full queue</button>
          </div>

          <ul className="divide-y divide-reps-border">
            {QUEUE.map((q) => (
              <li key={q.name} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <img src={q.img} className="h-11 w-11 rounded-full object-cover" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{q.name}</span>
                      {q.priority === "High" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                          <AlertTriangle className="h-3 w-3" /> High priority
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/65">
                          {q.priority}
                        </span>
                      )}
                      <span className="text-[11px] text-white/45">Submitted {q.submitted}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {q.docs.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 rounded-[6px] bg-reps-ink px-2 py-1 text-[11px] text-white/75"
                        >
                          <FileText className="h-3 w-3" /> {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="h-9 rounded-[10px] border border-reps-border px-3 text-[12px] font-semibold text-white/75">
                      Reject
                    </button>
                    <button className="h-9 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
                      Approve
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </APanel>

        <div className="space-y-6">
          <APanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="font-display text-[15px] font-bold text-white">Recent decisions</h3>
            </div>
            <ul className="divide-y divide-reps-border">
              {RECENT.map((r, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      r.status === "ok"
                        ? "bg-reps-green"
                        : r.status === "bad"
                          ? "bg-red-400"
                          : "bg-reps-orange"
                    }`}
                  />
                  <div className="min-w-0 flex-1 text-[12px]">
                    <div className="font-semibold text-white">{r.name}</div>
                    <div className="text-white/55">{r.action}</div>
                    <div className="mt-0.5 text-[11px] text-white/40">
                      {r.by} · {r.when}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </APanel>

          <ACard>
            <h3 className="font-display text-[15px] font-bold text-white">SLA & policy</h3>
            <ul className="mt-3 space-y-2 text-[12px] text-white/70">
              <li className="flex justify-between">
                <span>Review target</span>
                <span className="font-semibold text-white">24h</span>
              </li>
              <li className="flex justify-between">
                <span>Within SLA</span>
                <span className="font-semibold text-reps-green">96%</span>
              </li>
              <li className="flex justify-between">
                <span>Auto-flagged</span>
                <span className="font-semibold text-reps-orange">5</span>
              </li>
            </ul>
            <button className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-reps-orange">
              Open policy <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </ACard>
        </div>
      </div>
    </AdminShell>
  );
}
