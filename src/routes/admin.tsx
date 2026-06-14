import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RangePill } from "@/components/admin/RangePill";

import { OverviewKpis } from "@/components/admin/sections/OverviewKpis";
import { RegistrationsAndSpecialisms } from "@/components/admin/sections/RegistrationsAndSpecialisms";
import { ActivityQueue } from "@/components/admin/sections/ActivityQueue";
import { RevenueAndMembership } from "@/components/admin/sections/RevenueAndMembership";
import { PlatformBreakdown } from "@/components/admin/sections/PlatformBreakdown";
import { TopProsTable } from "@/components/admin/sections/TopProsTable";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Admin Dashboard — REPS" },
      {
        name: "description",
        content:
          "REPS Admin Dashboard — platform overview, registrations, verifications, revenue and system status.",
      },
      { property: "og:title", content: "REPS Admin Dashboard" },
      {
        property: "og:description",
        content:
          "Real-time overview of the REPS platform and key operational metrics.",
      },
      { property: "og:url", content: "/admin" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <DashboardShell
      role="admin"
      active="Overview"
      title="Platform Overview"
      subtitle="Real-time overview of the REPS platform and key operational metrics."
      actions={<RangePill />}
    >
      <div className="space-y-6">
        <OverviewKpis />
        <RegistrationsAndSpecialisms />
        <ActivityQueue />
        <RevenueAndMembership />
        <PlatformBreakdown />
        <TopProsTable />
      </div>
    </DashboardShell>
  );
}
