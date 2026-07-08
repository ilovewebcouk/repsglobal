import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy route — provider name approvals have been folded into
 * /admin/verification (Training providers tab). Redirect to keep old
 * bookmarks working for one release.
 */
export const Route = createFileRoute("/admin_/provider-names")({
  head: () => ({
    meta: [
      { title: "Provider name approvals — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin/verification" });
  },
  component: () => null,
});
