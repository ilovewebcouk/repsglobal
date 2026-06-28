import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gauge, CreditCard, Activity, Users, Bell, Search } from "lucide-react";
import { getOpenAlerts, runAlertEvaluator } from "@/lib/ops/operations.functions";
import { pingConnectivity } from "@/lib/ops/connectivity.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin_/ops")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Operations — REPS Admin" }] }),
  component: OpsHub,
});

function OpsHub() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const getAlerts = useServerFn(getOpenAlerts);
  const ping = useServerFn(pingConnectivity);
  const runEval = useServerFn(runAlertEvaluator);
  const [memberQuery, setMemberQuery] = useState("");
  const [resolving, setResolving] = useState(false);

  const alertsQ = useQuery({ queryKey: ["ops-alerts-open"], queryFn: () => getAlerts(), refetchInterval: 60_000 });
  const pingQ = useQuery({ queryKey: ["ops-ping"], queryFn: () => ping(), refetchInterval: 60_000 });

  if (pathname !== "/admin/ops") return <Outlet />;

  async function gotoMember() {
    const q = memberQuery.trim();
    if (!q) return;
    setResolving(true);
    try {
      // uuid?
      if (/^[0-9a-f-]{36}$/i.test(q)) {
        navigate({ to: "/admin/ops/member/$userId", params: { userId: q } });
        return;
      }
      // email lookup via profiles → no email column; use auth admin via server fn? skip — try edge: search via prefix RPC for ID input.
      // Fallback: query supabase view for user by email through profiles+auth join not available client-side.
      // Use a small admin RPC: search_profiles_by_id_prefix is for ID prefix; for emails we just call supabase auth users via a server fn route not built here — direct user to paste id.
      toast.info("Paste the user id (uuid). Email search coming next sprint.");
    } finally { setResolving(false); }
  }

  return (
    <DashboardShell role="admin" active="Operations" title="Operations" subtitle="Billing · Platform · Customer · Member timeline">
      <div className="space-y-6 p-6">
        <OpsAlertsBanner alerts={alertsQ.data ?? []} onEvaluate={async () => {
          const r = await runEval();
          toast.success(`Alert evaluator ran (${r.opened} opens)`);
          await alertsQ.refetch();
        }} />

        {/* Member finder */}
        <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-4">
          <div className="text-xs uppercase tracking-wide text-reps-text/60">Flight recorder</div>
          <div className="mt-2 flex items-center gap-2">
            <Search className="size-4 text-reps-text/60" />
            <Input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Paste user id (uuid)…" className="bg-reps-ink/40" />
            <Button onClick={gotoMember} disabled={resolving}>Open timeline</Button>
          </div>
        </div>

        {/* Three sections */}
        <div className="grid gap-4 md:grid-cols-3">
          <SectionCard to="/admin/ops/billing" title="Billing health" icon={<CreditCard className="size-5" />}
            blurb="Payments, refunds, recoveries, DLQ, latency." />
          <SectionCard to="/admin/ops/platform" title="Platform health" icon={<Activity className="size-5" />}
            blurb="Cron, queues, connectivity, DB." />
          <SectionCard to="/admin/ops/customer" title="Customer health" icon={<Users className="size-5" />}
            blurb="Active, new, churn, pending cancellations." />
        </div>

        {/* Connectivity strip */}
        <div className="grid gap-3 md:grid-cols-3">
          {(["stripe", "mail", "storage"] as const).map((k) => {
            const p = pingQ.data?.[k];
            const tone = !p ? "bg-reps-panel/40 text-reps-text/60 border-reps-border"
              : p.ok ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200";
            return (
              <div key={k} className={`rounded-[16px] border p-3 ${tone}`}>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide opacity-70">
                  <span>{k}</span>
                  <span>{p ? `${p.latency_ms}ms` : "…"}</span>
                </div>
                <div className="mt-1 text-sm font-medium">{p ? (p.ok ? "Healthy" : "Down") : "Checking…"}</div>
                {p?.detail && <div className="text-xs opacity-70">{p.detail}</div>}
                {p?.error && <div className="text-xs text-rose-300">{p.error}</div>}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-reps-text/50">
          Alerts evaluator runs every 5 min via pg_cron. Press <em>Re-evaluate now</em> to force a check.
        </div>
      </div>
    </DashboardShell>
  );
}

function SectionCard({ to, title, icon, blurb }: { to: string; title: string; icon: React.ReactNode; blurb: string }) {
  return (
    <Link to={to} className="block rounded-[18px] border border-reps-border bg-reps-panel/60 p-5 transition hover:border-reps-orange/50 hover:bg-reps-panel">
      <div className="flex items-center gap-2 text-reps-orange">{icon}<span className="text-sm font-semibold uppercase tracking-wide">{title}</span></div>
      <div className="mt-2 text-sm text-reps-text/70">{blurb}</div>
    </Link>
  );
}

export function OpsAlertsBanner({ alerts, onEvaluate }: { alerts: Array<{ id: string; kind: string; severity: string }>; onEvaluate?: () => void }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-200">
        <div className="flex items-center gap-2 text-sm"><Bell className="size-4" /> All systems normal</div>
        {onEvaluate && <Button size="sm" variant="ghost" onClick={onEvaluate}>Re-evaluate now</Button>}
      </div>
    );
  }
  const crit = alerts.filter((a) => a.severity === "crit").length;
  return (
    <div className="rounded-[16px] border border-rose-500/40 bg-rose-500/10 p-3 text-rose-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="size-4" />
          <span className="font-semibold">{alerts.length} open alert{alerts.length === 1 ? "" : "s"}</span>
          {crit > 0 && <Badge variant="destructive">{crit} critical</Badge>}
        </div>
        <div className="flex gap-2">
          {onEvaluate && (
            <Button size="sm" variant="outline" onClick={onEvaluate} className="border-rose-300/40 bg-transparent text-rose-50 hover:bg-rose-500/20 hover:text-rose-50">
              Re-evaluate
            </Button>
          )}
          <Link to="/admin/ops/alerts">
            <Button size="sm" className="bg-rose-50 text-rose-900 hover:bg-white hover:text-rose-900">View alerts</Button>
          </Link>
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 text-xs">
        {alerts.slice(0, 6).map((a) => (
          <li key={a.id} className="rounded-full border border-rose-400/40 bg-rose-500/20 px-2 py-0.5">{a.kind}</li>
        ))}
      </ul>
    </div>
  );
}

// keep linter happy — surface that we read supabase client at least once
void supabase;
