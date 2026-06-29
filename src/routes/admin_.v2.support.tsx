// Admin v2 — Support stub (Phase C2 rebuild target).

import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/support")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Support — REPs Admin v2" }] }),
  component: SupportStub,
});

function SupportStub() {
  return (
    <DashboardShell
      role="admin"
      active="Support"
      title="Support"
      subtitle="Inbox + AI-drafted replies — rebuild in Phase C2."
    >
      <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
        <CardHeader>
          <CardTitle className="text-white">Legacy support inbox</CardTitle>
          <CardDescription className="text-white/55">Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/support"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-reps-orange"
          >
            Open legacy support <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
