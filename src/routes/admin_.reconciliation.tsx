import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/reconciliation")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/billing", search: { tab: "subscriptions" } as any });
  },
  component: () => null,
});
