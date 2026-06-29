// Admin v2 — Operations stub (Phase C2 rebuild target).

import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/ops")({
  head: () => ({ meta: [{ title: "Operations — REPs Admin v2" }] }),
  component: OpsStub,
});

function OpsStub() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Cron health, webhook tail, and GDPR tooling. Rebuild in Phase C2.
        </p>
      </header>
      <Card className="rounded-[16px] shadow-none">
        <CardHeader>
          <CardTitle>Legacy ops hub</CardTitle>
          <CardDescription>Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/ops"
            className="inline-flex items-center gap-1 text-sm hover:text-[var(--brand-orange)]"
          >
            Open legacy ops <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
