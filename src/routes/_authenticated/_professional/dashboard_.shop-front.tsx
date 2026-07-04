import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL — permanently redirected to /dashboard/website
export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/shop-front",
)({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/website", replace: true });
  },
  component: () => null,
});
