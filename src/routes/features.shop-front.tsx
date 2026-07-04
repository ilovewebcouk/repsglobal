import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL — permanently redirected to /features/website
export const Route = createFileRoute("/features/shop-front")({
  beforeLoad: () => {
    throw redirect({ to: "/features/website", replace: true });
  },
  component: () => null,
});
