import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/churn")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/billing", search: { tab: "subscriptions", view: "past_due" } as any });
  },
  component: () => null,
});
