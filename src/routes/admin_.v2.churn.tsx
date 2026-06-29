// Admin v2 — Churn stub (Phase C2 rebuild target).

import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/churn")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Churn — REPs Admin v2" }] }),
  component: ChurnStub,
});

function ChurnStub() {
  return (
    <DashboardShell
      role="admin"
      active="Churn"
      title="Churn"
      subtitle="Lifecycle + win-back, rebuilt on the mirror in Phase C2."
    >
      <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
        <CardHeader>
          <CardTitle className="text-white">Legacy churn console</CardTitle>
          <CardDescription className="text-white/55">Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/churn"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-reps-orange"
          >
            Open legacy churn <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
