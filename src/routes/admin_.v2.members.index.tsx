// Admin v2 — Members index (Phase C2 will rebuild the full cockpit here).

import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/members/")({
  head: () => ({ meta: [{ title: "Members — REPs Admin v2" }] }),
  component: MembersIndex,
});

function MembersIndex() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Use the finder in the header (or ⌘K) to jump straight to a Member 360. The
          full searchable cockpit lands in Phase C2.
        </p>
      </header>

      <Card className="rounded-[16px] shadow-none">
        <CardHeader>
          <CardTitle>Legacy memberships cockpit</CardTitle>
          <CardDescription>
            Still the authoritative table view until the mirror-first rebuild ships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/admin/memberships"
            className="inline-flex items-center gap-1 text-sm hover:text-[var(--brand-orange)]"
          >
            Open legacy memberships <ArrowUpRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
