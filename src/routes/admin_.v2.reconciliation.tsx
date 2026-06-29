// Admin v2 — Reconciliation stub (Phase C2 rebuild target).

import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/reconciliation")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Reconciliation — REPs Admin v2" }] }),
  component: ReconStub,
});

function ReconStub() {
  return (
    <DashboardShell
      role="admin"
      active="Reconciliation"
      title="Reconciliation"
      subtitle="Mirror vs legacy union must agree before Phase D cutover."
    >
      <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
        <CardHeader>
          <CardTitle className="text-white">Legacy reconciliation</CardTitle>
          <CardDescription className="text-white/55">Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/reconciliation"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-reps-orange"
          >
            Open legacy reconciliation <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
