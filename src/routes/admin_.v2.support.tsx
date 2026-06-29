// Admin v2 — Support stub (Phase C2 rebuild target).

import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/support")({
  head: () => ({ meta: [{ title: "Support — REPs Admin v2" }] }),
  component: SupportStub,
});

function SupportStub() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">
          Inbox + AI-drafted replies in the founder-friend tone. Rebuild in Phase C2.
        </p>
      </header>
      <Card className="rounded-[16px] shadow-none">
        <CardHeader>
          <CardTitle>Legacy support inbox</CardTitle>
          <CardDescription>Current source of truth until Phase C2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/support"
            className="inline-flex items-center gap-1 text-sm hover:text-[var(--brand-orange)]"
          >
            Open legacy support <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
