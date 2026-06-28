import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Activity, Users, Bell, Mail, Radio } from "lucide-react";
import { getOpenAlerts, runAlertEvaluator } from "@/lib/ops/operations.functions";
import { toast } from "sonner";
import { SystemStatusStrip } from "@/components/ops/SystemStatusStrip";
import { MemberFinder } from "@/components/ops/MemberFinder";

export const Route = createFileRoute("/admin_/ops")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Operations — REPS Admin" }] }),
  component: OpsHub,
});

function OpsHub() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const getAlerts = useServerFn(getOpenAlerts);
  const runEval = useServerFn(runAlertEvaluator);

  const alertsQ = useQuery({ queryKey: ["ops-alerts-open"], queryFn: () => getAlerts(), refetchInterval: 60_000 });

  if (pathname !== "/admin/ops") return <Outlet />;

  return (
    <DashboardShell role="admin" active="Operations" title="Operations" subtitle="Run REPS in seconds — Billing · Platform · Customer · Emails · Activity">
      <div className="space-y-6 p-6">
        <OpsAlertsBanner alerts={alertsQ.data ?? []} onEvaluate={async () => {
          const r = await runEval();
          toast.success(`Alert evaluator ran (${r.opened} opens)`);
          await alertsQ.refetch();
        }} />

        {/* System status — green / amber / red at-a-glance */}
        <SystemStatusStrip />

        {/* Member finder */}
        <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-4">
          <div className="text-xs uppercase tracking-wide text-reps-text/60">Flight recorder · find a member</div>
          <div className="mt-2"><MemberFinder placeholder="Email, user id, Stripe cus_ / sub_, BD id, name…" /></div>
        </div>

        {/* Sections */}
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <SectionCard to="/admin/ops/billing" title="Billing" icon={<CreditCard className="size-5" />}
            blurb="Payments, recoveries, DLQ." />
          <SectionCard to="/admin/ops/platform" title="Platform" icon={<Activity className="size-5" />}
            blurb="Cron, queues, connectivity, DB." />
          <SectionCard to="/admin/ops/customer" title="Customer" icon={<Users className="size-5" />}
            blurb="Active, new, churn." />
          <SectionCard to="/admin/ops/email" title="Emails" icon={<Mail className="size-5" />}
            blurb="Lifecycle, DLQ, suppressions." />
          <SectionCard to="/admin/ops/activity" title="Activity" icon={<Stream className="size-5" />}
            blurb="Live platform heartbeat." />
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
