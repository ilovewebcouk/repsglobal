// Admin v2 — Reconciliation stub (Phase C2 rebuild target).

import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/reconciliation")({
  head: () => ({ meta: [{ title: "Reconciliation — REPs Admin v2" }] }),
  component: ReconStub,
});

function ReconStub() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Mirror vs legacy union must agree before Phase D cutover. Full diff view in Phase C2.
        </p>
      </header>
      <Card className="rounded-[16px] shadow-none">
        <CardHeader>
          <CardTitle>Legacy reconciliation</CardTitle>
          <CardDescription>Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/reconciliation"
            className="inline-flex items-center gap-1 text-sm hover:text-[var(--brand-orange)]"
          >
            Open legacy reconciliation <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
