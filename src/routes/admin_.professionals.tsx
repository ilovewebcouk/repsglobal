import { createFileRoute, redirect } from "@tanstack/react-router";

// Renamed to /admin/members — keep this shim so bookmarks and older
// in-app links continue to work.
export const Route = createFileRoute("/admin_/professionals")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/members" });
  },
});
