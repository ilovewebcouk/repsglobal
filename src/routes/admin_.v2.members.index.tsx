// Admin v2 — Members index (Phase C2 will rebuild the full cockpit here).

import { createFileRoute, Link } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MemberFinder } from "@/components/ops/MemberFinder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin_/v2/members/")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Members — REPs Admin v2" }] }),
  component: MembersIndex,
});

function MembersIndex() {
  return (
    <DashboardShell
      role="admin"
      active="Memberships"
      title="Members"
      subtitle="Find a member by email, cus_, sub_ or BD id to open their 360."
    >
      <div className="flex flex-col gap-6">
        <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
          <CardHeader>
            <CardTitle className="text-white">Find a member</CardTitle>
            <CardDescription className="text-white/55">
              Single hit opens Member 360 · multiple hits show a picker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberFinder target="/admin/v2/members/$userId" />
          </CardContent>
        </Card>

        <Card className="rounded-[16px] border-reps-border bg-reps-panel text-white">
          <CardHeader>
            <CardTitle className="text-white">Legacy memberships cockpit</CardTitle>
            <CardDescription className="text-white/55">
              Authoritative table view until the mirror-first rebuild ships.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/memberships"
              className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-reps-orange"
            >
              Open legacy memberships <ArrowUpRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
