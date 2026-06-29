import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/memberships")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/billing", search: { tab: "subscriptions" } as any });
  },
  component: () => null,
});
