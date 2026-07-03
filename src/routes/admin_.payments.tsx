import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/payments")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/billing", search: { tab: "payments" } as any });
  },
  component: () => null,
});
