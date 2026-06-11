import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ProShell } from "@/components/dashboard/ProShell";
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
    <ProShell
      active="Dashboard"
      title="Welcome back, James 👋"
      subtitle="Here's what's happening with your business today."
      hasProAccess={true}
    >
      <div className="flex flex-col gap-4">
        <KpiRow />
        <ScheduleAndAi />
        <PerformanceRow />
        <RevenueRow />
        <SpotlightRow />
        <BottomRow />
      </div>
      <DashboardFooter />

      {/* FAB */}
      <button
        type="button"
        aria-label="Quick add"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-reps-orange text-white shadow-none transition-colors hover:bg-reps-orange-hover"
      >
        <Plus className="h-6 w-6" />
      </button>
    </ProShell>
  );
}
