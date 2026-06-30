// Legacy slug. The editor lives at /dashboard/website now — this route
// 301-style redirects bookmarks and any stale internal links.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/shop-front")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/website" });
  },
  component: () => null,
});
