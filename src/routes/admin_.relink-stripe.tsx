import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { manualRelinkStripeCustomers } from "@/lib/admin/manual-relink-stripe.functions";

export const Route = createFileRoute("/admin_/relink-stripe")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Manual Stripe relink — REPS Admin" },
    ],
  }),
  component: RelinkPage,
});

type Result = { email: string; customerId: string; action: string; detail: string; userId?: string };

function RelinkPage() {
  const run = useServerFn(manualRelinkStripeCustomers);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [rows, setRows] = useState<Result[] | null>(null);

  async function onRun() {
    setBusy(true);
    try {
      const res = await run();
      setSummary(res.summary as never);
      setRows(res.results as never);
      toast.success(`Done: ${res.summary.created} created, ${res.summary.reused} reused, ${res.summary.errors} errors`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="Manual Stripe customer relink">
      <PPanel className="p-6 space-y-4">
        <p className="text-sm text-reps-muted">
          Runs the hardcoded batch: for each (email, stripe_customer_id) pair, looks up the last legacy
          payment, honours the annual/monthly renewal into a live Core subscription, creates the auth
          user if missing, and sends the standard REPs invite email.
        </p>
        <Button onClick={onRun} disabled={busy}>
          {busy ? "Running…" : "Run relink batch"}
        </Button>

        {summary && (
          <div className="text-sm">
            <strong>Summary:</strong> {JSON.stringify(summary)}
          </div>
        )}
        {rows && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-reps-border">
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.customerId} className="border-b border-reps-border/40">
                    <td className="py-2 pr-3">{r.email}</td>
                    <td className="py-2 pr-3 font-mono">{r.customerId}</td>
                    <td className="py-2 pr-3">{r.action}</td>
                    <td className="py-2 pr-3">{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PPanel>
    </DashboardShell>
  );
}
