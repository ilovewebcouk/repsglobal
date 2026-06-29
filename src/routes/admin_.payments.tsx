import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/payments")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/billing", search: { tab: "payments" } as any });
  },
  component: () => null,
});
