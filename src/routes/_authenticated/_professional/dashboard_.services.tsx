import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy /dashboard/services route. Specialism chips + delivery toggle
 * now live inside the Website editor at /dashboard/website#specialisms.
 * Service cards have been part of the Website editor for a while.
 */
export const Route = createFileRoute("/_authenticated/_professional/dashboard_/services")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/website",
      hash: "specialisms",
      replace: true,
    });
  },
});
