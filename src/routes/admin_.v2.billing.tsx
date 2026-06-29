// Admin v2 — Billing stub (Phase C2 will rebuild this on the Stripe mirror).

import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/billing")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Billing — REPs Admin v2" }] }),
  component: BillingStub,
});

function BillingStub() {
  return (
    <DashboardShell
      role="admin"
      active="Stripe"
      title="Billing"
      subtitle="Mirror-first billing cockpit lands in Phase C2."
    >
      <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
        <CardHeader>
          <CardTitle className="text-white">Legacy billing ops</CardTitle>
          <CardDescription className="text-white/55">Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/ops/billing"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-reps-orange"
          >
            Open legacy billing <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
