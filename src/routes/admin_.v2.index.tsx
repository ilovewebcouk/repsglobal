// Admin v2 — landing.
//
// First slice of the Stripe-mirror-first admin: a Member Finder that deep-links
// into Member 360 (`/admin/v2/members/$userId`). KPI surfaces will move under
// `/admin/v2/*` in later phases once the cockpits are rebuilt on the mirror.

import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MemberFinder } from "@/components/ops/MemberFinder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/admin_/v2/")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Admin v2 — REPS" }] }),
  component: AdminV2Index,
});

function AdminV2Index() {
  return (
    <DashboardShell
      role="admin"
      active="Operations"
      title="Admin v2"
      subtitle="Stripe-mirror-first admin. Member 360 lives here; cockpits land in later phases."
    >
      <div className="flex flex-col gap-6 p-6">
        <Alert>
          <AlertTitle>Phase B preview</AlertTitle>
          <AlertDescription>
            Member 360 reads identity from Lovable Cloud and billing direct from the Stripe
            mirror — no legacy unions. Find a member below to open their full record.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Find a member</CardTitle>
            <CardDescription>
              Search by email, user id, Stripe customer (cus_…), subscription (sub_…), or BD id.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberFinder placeholder="Email, user id, cus_, sub_, BD id…" />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
