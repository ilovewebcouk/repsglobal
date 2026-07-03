// Legacy layout. `/pro/$slug` moved to `/c/$slug` — see migration plan.
// Each child leaf issues its own 301-style redirect; this layout just
// keeps the parent path matched so children mount and their redirects run.
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/pro/$slug")({
  component: () => <Outlet />,
});
