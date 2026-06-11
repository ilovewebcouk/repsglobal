import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  KpiRow,
  ScheduleAndAi,
  PerformanceRow,
  RevenueRow,
  SpotlightRow,
  BottomRow,
  DashboardFooter
} from "@/components/dashboard/DashboardDemoContent";

export const Route = createFileRoute("/dashboard-demo")({
  head: () => ({
    meta: [
      { title: "Dashboard — REPS Professional" },
      {
        name: "description",
        content: "Your REPS professional dashboard — clients, schedule, revenue, CPD and AI business insights in one place."
      },
      { property: "og:title", content: "REPS Professional Dashboard" },
      {
        property: "og:description",
        content: "Manage your clients, schedule, revenue and career — the REPS Professional Dashboard."
      },
      { property: "og:url", content: "/dashboard-demo" },
    ],
    links: [{ rel: "canonical", href: "/dashboard-demo" }]
  }),
  component: DashboardPage
});

function DashboardPage() {
  return (
    <DashboardShell role="trainer" tier="pro"
      active="Dashboard"
      title="Welcome back, James 👋"
      subtitle="Visual reference only — all figures are sample data and actions are disabled."
      hasProAccess={true}
      actions={<Badge variant="outline" className="border-reps-orange-border bg-reps-orange-soft text-reps-orange">Demo</Badge>}
    >
      <div className="flex flex-col gap-4">
        <KpiRow isLocked />
        <ScheduleAndAi isLocked />
        <PerformanceRow isLocked />
        <RevenueRow isLocked />
        <SpotlightRow isLocked />
        <BottomRow isLocked />
      </div>
      <DashboardFooter />
    </DashboardShell>
  );
}
