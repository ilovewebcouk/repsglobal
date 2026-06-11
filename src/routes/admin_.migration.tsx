import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck,
  PauseCircle,
  PlayCircle,
  Users,
} from "lucide-react";

import { ACard, AdminShell, APanel } from "@/components/dashboard/AdminShell";

export const Route = createFileRoute("/admin_/migration")({
  component: AdminMigrationPage,
});

const STEPS = [
  { label: "Extract from BD legacy DB", state: "done", count: "14,210 records" },
  { label: "Normalize tiers & qualifications", state: "done", count: "14,210 mapped" },
  { label: "Verify insurance & CPD expiry", state: "running", count: "9,840 / 14,210" },
  { label: "Invite to REPS (email batch)", state: "pending", count: "0 / 14,210" },
  { label: "Activate verified profiles", state: "pending", count: "0 / 14,210" },
];

const BATCHES = [
  { name: "Batch 01 — London PTs", total: 1240, migrated: 1240, invited: 1180, active: 842, status: "Complete" },
  { name: "Batch 02 — Manchester", total: 980, migrated: 980, invited: 920, active: 612, status: "Complete" },
  { name: "Batch 03 — South West", total: 1410, migrated: 1410, invited: 980, active: 410, status: "Inviting" },
  { name: "Batch 04 — Scotland", total: 760, migrated: 760, invited: 0, active: 0, status: "Verifying" },
  { name: "Batch 05 — Wales", total: 540, migrated: 540, invited: 0, active: 0, status: "Verifying" },
];

const ISSUES = [
  { type: "Missing insurance docs", count: 142 },
  { type: "Expired Level 3 cert", count: 86 },
  { type: "Duplicate email", count: 24 },
  { type: "Invalid DBS reference", count: 11 },
];

function statusClass(s: string) {
  if (s === "Complete") return "bg-reps-green/15 text-reps-green";
  if (s === "Inviting") return "bg-reps-orange-soft text-reps-orange";
  return "bg-white/10 text-white/70";
}

function AdminMigrationPage() {
  return (
    <AdminShell
      active="Migration"
      title="BD migration"
      subtitle="Import, verify, and onboard legacy Body & Discipline professionals to REPS."
      actions={
        <div className="flex items-center gap-2">
          <button className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85">
            <PauseCircle className="h-4 w-4" /> Pause
          </button>
          <button className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
            <PlayCircle className="h-4 w-4" /> Run next batch
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ACard>
          <div className="flex items-center gap-2 text-[12px] text-white/55">
            <Database className="h-3.5 w-3.5" /> Total legacy
          </div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">14,210</div>
          <div className="mt-1 text-[11px] text-white/55">BD as of 31 May 2026</div>
        </ACard>
        <ACard>
          <div className="flex items-center gap-2 text-[12px] text-white/55">
            <FileCheck className="h-3.5 w-3.5" /> Migrated
          </div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">9,840</div>
          <div className="mt-1 text-[11px] text-reps-green">69.2% complete</div>
        </ACard>
        <ACard>
          <div className="flex items-center gap-2 text-[12px] text-white/55">
            <Users className="h-3.5 w-3.5" /> Activated on REPS
          </div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">1,864</div>
          <div className="mt-1 text-[11px] text-white/55">18.9% of invited</div>
        </ACard>
        <ACard>
          <div className="flex items-center gap-2 text-[12px] text-white/55">
            <AlertCircle className="h-3.5 w-3.5" /> Issues to resolve
          </div>
          <div className="mt-1 font-display text-[26px] font-bold text-white">263</div>
          <div className="mt-1 text-[11px] text-reps-orange">Needs admin review</div>
        </ACard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <APanel className="lg:col-span-2">
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Migration pipeline</h2>
            <p className="text-[12px] text-white/55">5-step ETL · running on BD-import-v3</p>
          </div>
          <ol className="space-y-3 p-5">
            {STEPS.map((s, i) => (
              <li
                key={s.label}
                className="flex items-center gap-4 rounded-[12px] border border-reps-border bg-reps-ink p-4"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    s.state === "done"
                      ? "bg-reps-green/20 text-reps-green"
                      : s.state === "running"
                        ? "bg-reps-orange text-white"
                        : "bg-white/10 text-white/55"
                  }`}
                >
                  {s.state === "done" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white">{s.label}</div>
                  <div className="text-[11px] text-white/55">{s.count}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                    s.state === "done"
                      ? "bg-reps-green/15 text-reps-green"
                      : s.state === "running"
                        ? "bg-reps-orange-soft text-reps-orange"
                        : "bg-white/10 text-white/55"
                  }`}
                >
                  {s.state}
                </span>
              </li>
            ))}
          </ol>
        </APanel>

        <APanel>
          <div className="border-b border-reps-border px-5 py-4">
            <h2 className="font-display text-[16px] font-bold text-white">Issues to resolve</h2>
            <p className="text-[12px] text-white/55">Records held in quarantine</p>
          </div>
          <ul className="divide-y divide-reps-border">
            {ISSUES.map((i) => (
              <li key={i.type} className="flex items-center justify-between px-5 py-3">
                <span className="text-[13px] text-white/80">{i.type}</span>
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                  {i.count}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-reps-border p-5">
            <button className="flex w-full items-center justify-center gap-1 rounded-[10px] border border-reps-border py-2.5 text-[12px] font-semibold text-white/85">
              Open quarantine queue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </APanel>
      </div>

      <APanel className="mt-6">
        <div className="border-b border-reps-border px-5 py-4">
          <h2 className="font-display text-[16px] font-bold text-white">Batches</h2>
          <p className="text-[12px] text-white/55">Grouped by region for staged onboarding</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-5 py-3 font-semibold">Batch</th>
                <th className="px-3 py-3 font-semibold">Total</th>
                <th className="px-3 py-3 font-semibold">Migrated</th>
                <th className="px-3 py-3 font-semibold">Invited</th>
                <th className="px-3 py-3 font-semibold">Active</th>
                <th className="px-3 py-3 font-semibold">Progress</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {BATCHES.map((b) => {
                const pct = Math.round((b.active / b.total) * 100);
                return (
                  <tr key={b.name} className="border-b border-reps-border/60 last:border-b-0">
                    <td className="px-5 py-3 font-semibold text-white">{b.name}</td>
                    <td className="px-3 py-3 text-white/75">{b.total.toLocaleString()}</td>
                    <td className="px-3 py-3 text-white/75">{b.migrated.toLocaleString()}</td>
                    <td className="px-3 py-3 text-white/75">{b.invited.toLocaleString()}</td>
                    <td className="px-3 py-3 text-white/75">{b.active.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-reps-ink">
                          <div className="h-full bg-reps-orange" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-white/55">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </APanel>
    </AdminShell>
  );
}
