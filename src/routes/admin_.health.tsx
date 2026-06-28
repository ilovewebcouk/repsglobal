// Legacy `/admin/health` — superseded by `/admin/ops/platform`. Redirect to
// avoid duplicate dashboards. Kept as a thin compatibility wrapper so old
// bookmarks/menu links don't 404.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin_/health")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/ops/platform", replace: true });
  },
});
