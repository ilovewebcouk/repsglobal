// Admin v2 — Billing stub (Phase C2 will rebuild this on the Stripe mirror).

import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/billing")({
  head: () => ({ meta: [{ title: "Billing — REPs Admin v2" }] }),
  component: BillingStub,
});

function BillingStub() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Mirror-first billing cockpit lands in Phase C2 (BD rail swap, disputes, payment recovery).
        </p>
      </header>
      <Card className="rounded-[16px] shadow-none">
        <CardHeader>
          <CardTitle>Legacy billing ops</CardTitle>
          <CardDescription>Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/ops/billing"
            className="inline-flex items-center gap-1 text-sm hover:text-[var(--brand-orange)]"
          >
            Open legacy billing <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
