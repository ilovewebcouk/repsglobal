import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCustomerHealth } from "@/lib/ops/operations.functions";

export const Route = createFileRoute("/admin_/ops/customer")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Customer health — REPS Ops" }] }),
  component: CustomerPage,
});

function CustomerPage() {
  const getFn = useServerFn(getCustomerHealth);
  const q = useQuery({ queryKey: ["ops-customer-health"], queryFn: () => getFn(), refetchInterval: 60_000 });
  const h = q.data;

  const tiles = h ? [
    { label: "Active paying members", value: h.active_paying },
    { label: "New Core (7d)", value: h.new_core_7d },
    { label: "New Pro (7d)", value: h.new_pro_7d },
    { label: "New Studio (7d)", value: h.new_studio_7d },
    { label: "Churn (7d)", value: h.churn_7d, tone: h.churn_7d > 0 ? "warn" : undefined },
    { label: "Recoveries (7d)", value: h.recoveries_7d },
    { label: "Pending cancellations", value: h.pending_cancellations, tone: h.pending_cancellations > 0 ? "warn" : undefined },
    { label: "Failed renewals", value: h.failed_renewals, tone: h.failed_renewals > 0 ? "crit" : undefined },
    { label: "Awaiting payment update", value: h.awaiting_payment_update },
  ] : [];

  return (
    <DashboardShell role="admin" active="Operations" title="Customer health" subtitle="Operational customer numbers — not marketing analytics.">
      <div className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!h ? <div className="text-reps-text/60">Loading…</div> : tiles.map((t) => {
            const tone = t.tone === "crit" ? "border-rose-500/40 bg-rose-500/10 text-rose-100" :
              t.tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-100" :
              "border-reps-border bg-reps-panel/40 text-reps-text";
            return (
              <div key={t.label} className={`rounded-[16px] border p-4 ${tone}`}>
                <div className="text-xs uppercase tracking-wide opacity-70">{t.label}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">{t.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
