import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/support",
)({
  component: () => <Outlet />,
});