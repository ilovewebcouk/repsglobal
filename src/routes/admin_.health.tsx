import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  getPlatformHealth,
  sweepOrphanSubscriptions,
  type PlatformHealthSnapshot,
} from "@/lib/admin/platform-health.functions";

export const Route = createFileRoute("/admin_/health")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Platform health — REPS Admin" },
      { name: "description", content: "Cron, queues, payments and subscription health for the REPS platform." },
    ],
  }),
  component: HealthPage,
});

type Severity = "ok" | "warn" | "crit";

function thresholdFor(key: keyof PlatformHealthSnapshot, value: number): Severity {
  switch (key) {
    case "cron_failures_24h": return value === 0 ? "ok" : value < 5 ? "warn" : "crit";
    case "queue_transactional":
    case "queue_auth": return value < 50 ? "ok" : value < 500 ? "warn" : "crit";
    case "dlq_emails_7d": return value === 0 ? "ok" : value < 10 ? "warn" : "crit";
    case "orphan_subscriptions": return value === 0 ? "ok" : "warn";
    case "stuck_payment_events": return value === 0 ? "ok" : "crit";
    case "failed_payments_active": return value === 0 ? "ok" : value < 10 ? "warn" : "crit";
    case "suppressions_7d": return value < 25 ? "ok" : "warn";
    default: return "ok";
  }
}

function StatTile({ label, value, sev, hint }: { label: string; value: number; sev: Severity; hint?: string }) {
  const tone = sev === "crit"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
    : sev === "warn"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  return (
    <div className={`rounded-[16px] border p-4 ${tone}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  );
}

function HealthPage() {
  const runHealth = useServerFn(getPlatformHealth);
  const runSweep = useServerFn(sweepOrphanSubscriptions);
  const [data, setData] = useState<PlatformHealthSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await runHealth()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load health"); }
    finally { setLoading(false); }
  }, [runHealth]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function onSweep() {
    setSweeping(true);
    try {
      const { removed } = await runSweep();
      toast.success(`Removed ${removed} orphan subscription${removed === 1 ? "" : "s"}`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sweep failed");
    } finally { setSweeping(false); }
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-reps-fg flex items-center gap-2">
              <Activity className="h-5 w-5 text-reps-orange" /> Platform health
            </h1>
            <p className="text-sm text-reps-fg/60">Cron, email queues, payments and subscription drift.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile label="Cron failures (24h)" value={data.cron_failures_24h} sev={thresholdFor("cron_failures_24h", data.cron_failures_24h)} />
              <StatTile label="Failed payments active" value={data.failed_payments_active} sev={thresholdFor("failed_payments_active", data.failed_payments_active)} hint="past_due / unpaid / incomplete" />
              <StatTile label="Stuck payment events" value={data.stuck_payment_events} sev={thresholdFor("stuck_payment_events", data.stuck_payment_events)} hint="unprocessed > 1h" />
              <StatTile label="Orphan subscriptions" value={data.orphan_subscriptions} sev={thresholdFor("orphan_subscriptions", data.orphan_subscriptions)} hint="user deleted" />
              <StatTile label="Transactional queue" value={data.queue_transactional} sev={thresholdFor("queue_transactional", data.queue_transactional)} />
              <StatTile label="Auth email queue" value={data.queue_auth} sev={thresholdFor("queue_auth", data.queue_auth)} />
              <StatTile label="Email DLQ (7d)" value={data.dlq_emails_7d} sev={thresholdFor("dlq_emails_7d", data.dlq_emails_7d)} />
              <StatTile label="Suppressions (7d)" value={data.suppressions_7d} sev={thresholdFor("suppressions_7d", data.suppressions_7d)} hint="bounces + complaints" />
            </div>

            <PPanel className="p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-base font-semibold text-reps-fg">Scheduled jobs</h2>
                <span className="text-xs text-reps-fg/50">{data.cron_jobs.length} jobs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-reps-fg/50">
                    <tr><th className="py-2 pr-3">Job</th><th className="py-2 pr-3">Schedule</th><th className="py-2 pr-3">Last status</th><th className="py-2 pr-3">Last run</th><th className="py-2 pr-3">Active</th></tr>
                  </thead>
                  <tbody className="divide-y divide-reps-border/30">
                    {data.cron_jobs.map((j) => {
                      const isFail = j.last_status === "failed";
                      const isOk = j.last_status === "succeeded";
                      return (
                        <tr key={j.jobname} className="text-reps-fg/80">
                          <td className="py-2 pr-3 font-mono text-xs">{j.jobname}</td>
                          <td className="py-2 pr-3 font-mono text-xs text-reps-fg/60">{j.schedule}</td>
                          <td className="py-2 pr-3">
                            {isFail ? (
                              <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-200"><AlertTriangle className="h-3 w-3" /> failed</Badge>
                            ) : isOk ? (
                              <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200"><CheckCircle2 className="h-3 w-3" /> succeeded</Badge>
                            ) : (
                              <Badge variant="outline" className="text-reps-fg/60">{j.last_status ?? "—"}</Badge>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-xs text-reps-fg/60">{j.last_run ? new Date(j.last_run).toLocaleString("en-GB") : "—"}</td>
                          <td className="py-2 pr-3">{j.active ? "yes" : "no"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </PPanel>

            {data.orphan_subscriptions > 0 && (
              <PPanel className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-reps-fg">Orphan subscriptions</h2>
                    <p className="text-sm text-reps-fg/60">{data.orphan_subscriptions} subscription row(s) reference deleted users. Sweep removes them safely.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void onSweep()} disabled={sweeping}>Sweep now</Button>
                </div>
              </PPanel>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
