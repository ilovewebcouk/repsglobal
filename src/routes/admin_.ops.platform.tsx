import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { getPlatformHealth } from "@/lib/admin/platform-health.functions";
import { pingConnectivity } from "@/lib/ops/connectivity.functions";
import { getDatabaseHealth } from "@/lib/ops/database-health.functions";

export const Route = createFileRoute("/admin_/ops/platform")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Platform health — REPS Ops" }] }),
  component: PlatformPage,
});

function PlatformPage() {
  const getHealth = useServerFn(getPlatformHealth);
  const getPing = useServerFn(pingConnectivity);
  const getDb = useServerFn(getDatabaseHealth);
  const h = useQuery({ queryKey: ["ops-platform"], queryFn: () => getHealth(), refetchInterval: 60_000 });
  const p = useQuery({ queryKey: ["ops-platform-ping"], queryFn: () => getPing(), refetchInterval: 60_000 });
  const db = useQuery({ queryKey: ["ops-platform-db"], queryFn: () => getDb(), refetchInterval: 60_000 });
  const snap = h.data;

  return (
    <DashboardShell role="admin" active="Operations" title="Platform health" subtitle="Cron · queues · connectivity · DB">
      <div className="space-y-6 p-6">
        <OpsSubNav />
        {/* Connectivity */}
        <section>
          <div className="text-xs uppercase tracking-wide text-reps-text/60">Connectivity</div>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            {(["stripe", "mail", "storage"] as const).map((k) => {
              const r = p.data?.[k];
              const tone = !r ? "border-reps-border bg-reps-panel/40 text-reps-text/60"
                : r.ok ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-100";
              return (
                <div key={k} className={`rounded-[16px] border p-4 ${tone}`}>
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide opacity-70">
                    <span>{k}</span><span>{r ? `${r.latency_ms}ms` : "…"}</span>
                  </div>
                  <div className="mt-1 text-base font-semibold">{r ? (r.ok ? "Healthy" : "Down") : "Checking…"}</div>
                  {r?.detail && <div className="text-xs opacity-70">{r.detail}</div>}
                  {r?.error && <div className="mt-1 text-xs text-rose-200">{r.error}</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Health snapshot */}
        {!snap ? <div className="text-reps-text/60">Loading…</div> : (
          <>
            {snap.degraded && (
              <div className="rounded-[16px] border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                <div className="font-semibold">Platform diagnostics are degraded</div>
                <div className="mt-1 text-amber-100/80">{snap.error}</div>
              </div>
            )}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Cron failures (24h)" v={snap.cron_failures_24h} crit={snap.cron_failures_24h > 0} />
              <Tile label="Queue: transactional" v={snap.queue_transactional} warn={snap.queue_transactional > 50} crit={snap.queue_transactional > 500} />
              <Tile label="Queue: auth" v={snap.queue_auth} warn={snap.queue_auth > 50} crit={snap.queue_auth > 500} />
              <Tile label="DLQ emails (7d)" v={snap.dlq_emails_7d} crit={snap.dlq_emails_7d > 0} />
              <Tile label="DLQ webhooks (7d)" v={snap.dlq_webhook_events_7d} crit={snap.dlq_webhook_events_7d > 0} />
              <Tile label="Stuck payment events" v={snap.stuck_payment_events} crit={snap.stuck_payment_events > 0} />
              <Tile label="Failed payments (active)" v={snap.failed_payments_active} warn={snap.failed_payments_active > 0} crit={snap.failed_payments_active > 10} />
              <Tile label="Orphan subscriptions" v={snap.orphan_subscriptions} warn={snap.orphan_subscriptions > 0} />
              <Tile label="Suppressions (7d)" v={snap.suppressions_7d} warn={snap.suppressions_7d > 25} />
            </section>
          </>
        )}

        {/* Cron table */}
        {snap?.cron_jobs && snap.cron_jobs.length > 0 && (
          <section>
            <div className="text-xs uppercase tracking-wide text-reps-text/60">Scheduled jobs</div>
            <div className="mt-2 overflow-x-auto rounded-[16px] border border-reps-border bg-reps-panel/40">
              <table className="w-full text-sm">
                <thead className="bg-reps-ink/40 text-left text-xs uppercase tracking-wide text-reps-text/60">
                  <tr><th className="px-3 py-2">Job</th><th className="px-3 py-2">Schedule</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">Last status</th><th className="px-3 py-2">Last run</th></tr>
                </thead>
                <tbody className="divide-y divide-reps-border/60">
                  {snap.cron_jobs.map((j) => (
                    <tr key={j.jobname}>
                      <td className="px-3 py-2">{j.jobname}</td>
                      <td className="px-3 py-2 font-mono text-xs">{j.schedule}</td>
                      <td className="px-3 py-2">{j.active ? <Badge>on</Badge> : <Badge variant="outline">off</Badge>}</td>
                      <td className="px-3 py-2">{j.last_status ?? "—"}</td>
                      <td className="px-3 py-2 text-reps-text/70">{j.last_run ? new Date(j.last_run).toLocaleString("en-GB") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {/* Database health */}
        <section>
          <div className="text-xs uppercase tracking-wide text-reps-text/60">Database health</div>
          {!db.data ? (
            <div className="mt-2 text-reps-text/60">Loading…</div>
          ) : !db.data.ok ? (
            <div className="mt-2 rounded-[16px] border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
              Database diagnostics degraded: {db.data.error ?? "unknown"}
            </div>
          ) : (
            <>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Tile
                  label="Connectivity"
                  v={db.data.ok ? 1 : 0}
                  crit={!db.data.ok}
                />
                <Tile
                  label="Active connections"
                  v={db.data.active_connections}
                  warn={db.data.max_connections > 0 && db.data.active_connections >= Math.floor(db.data.max_connections * 0.7)}
                  crit={db.data.max_connections > 0 && db.data.active_connections >= Math.floor(db.data.max_connections * 0.9)}
                />
                <Tile label="Max connections" v={db.data.max_connections} />
                <Tile
                  label="DB size (MB)"
                  v={Math.round(db.data.database_bytes / (1024 * 1024))}
                />
              </div>
              <div className="mt-2 text-xs text-reps-text/60">
                Long-running queries: <span className="font-semibold text-reps-fg">{db.data.long_running_queries}</span>
              </div>

              {db.data.slow_queries.length > 0 ? (
                <div className="mt-3 overflow-x-auto rounded-[16px] border border-reps-border bg-reps-panel/40">
                  <table className="w-full text-sm">
                    <thead className="bg-reps-ink/40 text-left text-xs uppercase tracking-wide text-reps-text/60">
                      <tr>
                        <th className="px-3 py-2">Query</th>
                        <th className="px-3 py-2">Calls</th>
                        <th className="px-3 py-2">Mean ms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-reps-border/60">
                      {db.data.slow_queries.slice(0, 10).map((s, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs">
                            <div className="line-clamp-2 max-w-[60ch]">{s.query}</div>
                          </td>
                          <td className="px-3 py-2 tabular-nums">{s.calls.toLocaleString()}</td>
                          <td className="px-3 py-2 tabular-nums">{s.mean_ms.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-3 rounded-[16px] border border-reps-border bg-reps-panel/30 p-4 text-xs text-reps-text/60">
                  No slow queries reported (pg_stat_statements may be disabled or recently reset).
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Tile({ label, v, warn, crit }: { label: string; v: number; warn?: boolean; crit?: boolean }) {
  const tone = crit ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
    : warn ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
    : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  return (
    <div className={`rounded-[16px] border p-4 ${tone}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{v.toLocaleString()}</div>
    </div>
  );
}
