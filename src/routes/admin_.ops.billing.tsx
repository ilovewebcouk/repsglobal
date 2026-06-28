import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { getBillingHealth, getBillingDrill } from "@/lib/ops/operations.functions";

const drillEnum = z.enum([
  "payments_today", "refunds_today", "failed_active",
  "in_recovery", "recoveries_30d", "webhook_failures_7d", "dlq", "stuck",
]);
const search = z.object({ kind: fallback(drillEnum.optional(), undefined).optional() });

export const Route = createFileRoute("/admin_/ops/billing")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Billing health — REPS Ops" }] }),
  component: BillingPage,
});

function gbp(p?: number | null) {
  if (p == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p / 100);
}

function BillingPage() {
  const getHealth = useServerFn(getBillingHealth);
  const getDrill = useServerFn(getBillingDrill);
  const { kind } = Route.useSearch();
  const healthQ = useQuery({ queryKey: ["ops-billing-health"], queryFn: () => getHealth(), refetchInterval: 60_000 });
  const drillQ = useQuery({
    queryKey: ["ops-billing-drill", kind],
    enabled: !!kind,
    queryFn: () => getDrill({ data: { kind: kind!, limit: 100 } }),
  });
  const h = healthQ.data;

  const tiles: Array<{ key: typeof kind | string; label: string; value: string; tone?: string; drill?: z.infer<typeof drillEnum> }> = h ? [
    { key: "payments_today", label: "Payments today", value: String(h.payments_today), drill: "payments_today" },
    { key: "revenue", label: "Revenue today", value: gbp(h.revenue_today_pence) },
    { key: "refunds_today", label: "Refunds today", value: String(h.refunds_today), drill: "refunds_today",
      tone: h.refunds_today > 0 ? "warn" : undefined },
    { key: "failed", label: "Failed payments", value: String(h.failed_payments_active), drill: "failed_active",
      tone: h.failed_payments_active > 0 ? "warn" : undefined },
    { key: "recovered", label: "Recoveries (30d)", value: String(h.recoveries_30d), drill: "recoveries_30d" },
    { key: "in_recovery", label: "In recovery", value: String(h.in_recovery), drill: "in_recovery" },
    { key: "webhook_fails", label: "Webhook failures (7d)", value: String(h.webhook_failures_7d), drill: "webhook_failures_7d",
      tone: h.webhook_failures_7d > 0 ? "warn" : undefined },
    { key: "dlq", label: "DLQ size", value: String(h.dlq_size), drill: "dlq",
      tone: h.dlq_size > 0 ? "crit" : undefined },
    { key: "stuck", label: "Stuck processing", value: String(h.stuck_processing), drill: "stuck",
      tone: h.stuck_processing > 0 ? "crit" : undefined },
    { key: "latency", label: "Webhook latency (24h)", value: h.avg_webhook_latency_ms == null ? "—" : `${h.avg_webhook_latency_ms} ms` },
  ] : [];

  return (
    <DashboardShell role="admin" active="Operations" title="Billing health" subtitle="Live operational billing metrics — click a tile to drill in.">
      <div className="space-y-6 p-6">
        <OpsSubNav />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {!h ? <div className="text-reps-text/60">Loading…</div> :
            tiles.map((t) => {
              const tone = t.tone === "crit" ? "border-rose-500/40 bg-rose-500/10 text-rose-100" :
                t.tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-100" :
                "border-reps-border bg-reps-panel/40 text-reps-text";
              const inner = (
                <div className={`rounded-[16px] border p-4 ${tone} ${t.drill ? "transition hover:border-reps-orange/50 cursor-pointer" : ""}`}>
                  <div className="text-xs uppercase tracking-wide opacity-70">{t.label}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">{t.value}</div>
                </div>
              );
              return t.drill ? (
                <Link key={t.key} to="/admin/ops/billing" search={{ kind: t.drill }}>{inner}</Link>
              ) : <div key={t.key}>{inner}</div>;
            })}
        </div>

        {kind && (
          <div className="rounded-[16px] border border-reps-border bg-reps-panel/40">
            <div className="flex items-center justify-between border-b border-reps-border px-4 py-3">
              <div className="text-sm font-semibold">{kind} ({drillQ.data?.length ?? 0})</div>
              <Link to="/admin/ops/billing"><Button size="sm" variant="ghost">Clear</Button></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-reps-ink/40 text-left text-xs uppercase tracking-wide text-reps-text/60">
                  <tr>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Stripe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-reps-border/60">
                  {(drillQ.data ?? []).map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-reps-text/80">{new Date(r.created_at).toLocaleString("en-GB")}</td>
                      <td className="px-3 py-2 text-reps-text/80">
                        {r.user_id ? <Link className="text-reps-orange hover:underline" to="/admin/ops/member/$userId" params={{ userId: r.user_id }}>{r.user_id.slice(0, 8)}…</Link> : "—"}
                      </td>
                      <td className="px-3 py-2">{r.event_type ?? "—"}</td>
                      <td className="px-3 py-2">{r.status ?? r.stage ?? "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{gbp(r.amount_pence)}</td>
                      <td className="px-3 py-2">
                        {r.stripe_subscription_id ? <a className="text-reps-orange hover:underline" href={`https://dashboard.stripe.com/subscriptions/${r.stripe_subscription_id}`} target="_blank" rel="noreferrer">sub</a> : "—"}
                      </td>
                    </tr>
                  ))}
                  {drillQ.data && drillQ.data.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-reps-text/60">No rows.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
