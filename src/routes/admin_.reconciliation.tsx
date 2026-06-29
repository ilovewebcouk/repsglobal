import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/reconciliation")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/billing", search: { tab: "subscriptions" } as any });
  },
  component: () => null,
});
