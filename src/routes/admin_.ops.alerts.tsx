import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getRecentAlerts, ackAlert, runAlertEvaluator } from "@/lib/ops/operations.functions";

export const Route = createFileRoute("/admin_/ops/alerts")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Alerts — REPS Ops" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const getFn = useServerFn(getRecentAlerts);
  const ackFn = useServerFn(ackAlert);
  const runFn = useServerFn(runAlertEvaluator);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ops-alerts-recent"], queryFn: () => getFn(), refetchInterval: 60_000 });
  const ackM = useMutation({
    mutationFn: (alert_id: string) => ackFn({ data: { alert_id } }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["ops-alerts-recent"] }); toast.success("Acknowledged"); },
  });
  const runM = useMutation({
    mutationFn: () => runFn(),
    onSuccess: async (r) => { await qc.invalidateQueries({ queryKey: ["ops-alerts-recent"] }); toast.success(`Evaluator ran (${r.opened} opens)`); },
  });

  return (
    <DashboardShell role="admin" active="Operations" title="Alerts" subtitle="Open and recently-resolved alerts (last 7 days).">
      <div className="space-y-4 p-6">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => runM.mutate()} disabled={runM.isPending}>
            Re-evaluate now
          </Button>
        </div>

        <div className="rounded-[16px] border border-reps-border bg-reps-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-reps-ink/40 text-left text-xs uppercase tracking-wide text-reps-text/60">
              <tr>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Opened</th>
                <th className="px-3 py-2">Resolved</th>
                <th className="px-3 py-2">Context</th>
                <th className="px-3 py-2">Ack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-reps-border/60">
              {(q.data ?? []).map((a) => (
                <tr key={a.id} className={a.resolved_at ? "opacity-60" : ""}>
                  <td className="px-3 py-2 font-mono text-xs">{a.kind}</td>
                  <td className="px-3 py-2">
                    {a.severity === "crit" ? <Badge variant="destructive">crit</Badge>
                      : a.severity === "warn" ? <Badge>warn</Badge>
                      : <Badge variant="outline">info</Badge>}
                  </td>
                  <td className="px-3 py-2 text-reps-text/80">{new Date(a.opened_at).toLocaleString("en-GB")}</td>
                  <td className="px-3 py-2 text-reps-text/80">{a.resolved_at ? new Date(a.resolved_at).toLocaleString("en-GB") : "—"}</td>
                  <td className="px-3 py-2"><code className="text-[11px] text-reps-text/70">{JSON.stringify(a.context)}</code></td>
                  <td className="px-3 py-2">
                    {a.resolved_at ? "—" :
                      a.ack_at ? <span className="text-xs text-emerald-300">acked</span> :
                      <Button size="sm" variant="ghost" onClick={() => ackM.mutate(a.id)} disabled={ackM.isPending}>Ack</Button>}
                  </td>
                </tr>
              ))}
              {q.data && q.data.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-reps-text/60">No alerts in the last 7 days. 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
