import { OpsSubNav } from "@/components/ops/OpsSubNav";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCustomerHealth } from "@/lib/ops/operations.functions";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/ops/customer")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Customer health — REPS Ops" }] }),
  component: CustomerPage,
});

/**
 * Each tile drills into the operational surface that owns the underlying records,
 * so a number is never a dead end. "drill" is a TanStack-router-typed path string.
 */
type Tile = {
  label: string;
  value: number;
  sub?: string;
  tone?: "warn" | "crit";
  drill?: { to: string; hint: string };
};

function CustomerPage() {
  const getFn = useServerFn(getCustomerHealth);
  const q = useQuery({ queryKey: ["ops-customer-health"], queryFn: () => getFn(), refetchInterval: 60_000 });
  const h = q.data;

  const tiles: Tile[] = h ? [
    { label: "Active paying members", value: h.active_paying, drill: { to: "/admin/professionals", hint: "Open list" } },
    { label: "New Core (7d)", value: h.new_core_7d, drill: { to: "/admin/memberships", hint: "View memberships" } },
    { label: "New Pro (7d)", value: h.new_pro_7d, drill: { to: "/admin/memberships", hint: "View memberships" } },
    { label: "New Studio (7d)", value: h.new_studio_7d, drill: { to: "/admin/memberships", hint: "View memberships" } },
    { label: "Churn (7d)", value: h.churn_7d, tone: h.churn_7d > 0 ? "warn" : undefined, drill: { to: "/admin/churn", hint: "Open churn" } },
    { label: "Recoveries (7d)", value: h.recoveries_7d, drill: { to: "/admin/churn", hint: "Open churn" } },
    { label: "Pending cancellations", value: h.pending_cancellations, tone: h.pending_cancellations > 0 ? "warn" : undefined, drill: { to: "/admin/churn", hint: "Open churn" } },
    { label: "Failed renewals", value: h.failed_renewals, tone: h.failed_renewals > 0 ? "crit" : undefined, drill: { to: "/admin/webhook-recovery", hint: "Webhook recovery" } },
    { label: "Awaiting payment update", value: h.awaiting_payment_update, drill: { to: "/admin/webhook-recovery", hint: "Webhook recovery" } },
  ] : [];

  return (
    <DashboardShell role="admin" active="Operations" title="Customer health" subtitle="Operational customer numbers — not marketing analytics.">
      <div className="space-y-6 p-6">
        <OpsSubNav />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!h ? <div className="text-reps-text/60">Loading…</div> : tiles.map((t) => {
            const tone = t.tone === "crit" ? "border-rose-500/40 bg-rose-500/10 text-rose-100" :
              t.tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-100" :
              "border-reps-border bg-reps-panel/40 text-reps-text";
            const inner = (
              <div className={`group rounded-[16px] border p-4 transition ${tone} ${t.drill ? "cursor-pointer hover:border-reps-orange/50" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide opacity-70">{t.label}</div>
                  {t.drill && <ArrowUpRight className="h-3.5 w-3.5 opacity-40 transition group-hover:opacity-90" />}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{t.value.toLocaleString()}</div>
                {t.drill && <div className="mt-1 text-[11px] text-reps-text/55">{t.drill.hint} →</div>}
              </div>
            );
            return t.drill ? (
              <Link key={t.label} to={t.drill.to}>{inner}</Link>
            ) : (
              <div key={t.label}>{inner}</div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
