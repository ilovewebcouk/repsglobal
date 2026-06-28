import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireRole } from "@/lib/route-gates";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import {
  churnLifecycleKpis,
  listChurnLifecycle,
} from "@/lib/churn/lifecycle.functions";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin_/churn")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Churn recovery — REPS Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminChurnPage,
});

type Stage = "active" | "at_risk" | "grace" | "lapsed" | "recovered" | "dormant";

const STAGE_LABEL: Record<Stage, string> = {
  active: "Active",
  at_risk: "At risk",
  grace: "Grace",
  lapsed: "Lapsed",
  recovered: "Recovered",
  dormant: "Dormant",
};

const STAGE_TONE: Record<Stage, string> = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  at_risk: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  grace: "bg-orange-500/15 text-orange-300 border-orange-400/30",
  lapsed: "bg-red-500/15 text-red-300 border-red-400/30",
  recovered: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  dormant: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30",
};

const STAGE_SUB: Record<Stage, string> = {
  active: "Paying and current",
  at_risk: "Renewal due ≤14d or first failed charge",
  grace: "Retrying card · still active",
  lapsed: "Payment failed — entitlement ended",
  recovered: "Came back after a failed payment",
  dormant: "Cancelled long-term, no activity",
};

function AdminChurnPage() {
  const kpiFn = useServerFn(churnLifecycleKpis);
  const listFn = useServerFn(listChurnLifecycle);
  const [stage, setStage] = useState<Stage | "all">("all");

  const kpis = useQuery({
    queryKey: ["admin", "churn", "kpis"],
    queryFn: () => kpiFn(),
  });
  const rows = useQuery({
    queryKey: ["admin", "churn", "rows", stage],
    queryFn: () => listFn({ data: { stage: stage === "all" ? undefined : stage, limit: 200 } }),
  });

  const k = kpis.data ?? { active: 0, at_risk: 0, grace: 0, lapsed: 0, recovered: 0, dormant: 0 };
  const stages: Stage[] = ["at_risk", "grace", "lapsed", "recovered", "dormant"];

  return (
    <DashboardShell role="admin" active="Churn" title="Churn recovery"
      subtitle="Lifecycle stages, renewal nudges, and win-back tracking across all paid members.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stages.map((s) => (
            <PCard key={s}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-2">
                {STAGE_LABEL[s]}
              </div>
              <div className="font-display text-[28px] leading-none">
                {k[s] ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-white/55">{STAGE_SUB[s]}</div>
            </PCard>
          ))}
        </div>

        <PPanel>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-[18px]">Lifecycle events</h2>
            <Select value={stage} onValueChange={(v) => setStage(v as Stage | "all")}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {(["at_risk", "grace", "lapsed", "recovered", "dormant", "active"] as Stage[]).map((s) => (
                  <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rows.isLoading ? (
            <p className="text-sm text-white/55">Loading…</p>
          ) : (rows.data ?? []).length === 0 ? (
            <p className="text-sm text-white/55">No churn lifecycle events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/55 border-b border-reps-border">
                    <th className="py-2 pr-3">Pro</th>
                    <th className="py-2 pr-3">Stage</th>
                    <th className="py-2 pr-3">Reason</th>
                    <th className="py-2 pr-3">Entered</th>
                    <th className="py-2 pr-3">Last nudge</th>
                    <th className="py-2 pr-3">Nudges</th>
                  </tr>
                </thead>
                <tbody>
                  {(rows.data ?? []).map((r) => (
                    <tr key={r.id} className="border-b border-reps-border/50">
                      <td className="py-2 pr-3">{r.pro_name ?? <span className="text-white/45">—</span>}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className={STAGE_TONE[r.stage as Stage]}>
                          {STAGE_LABEL[r.stage as Stage]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-white/70">{r.reason ?? "—"}</td>
                      <td className="py-2 pr-3 text-white/55">
                        {new Date(r.entered_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })}
                      </td>
                      <td className="py-2 pr-3 text-white/55">
                        {r.last_nudge_at
                          ? new Date(r.last_nudge_at).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 pr-3 text-white/70">{r.nudge_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PPanel>
      </div>
    </DashboardShell>
  );
}
