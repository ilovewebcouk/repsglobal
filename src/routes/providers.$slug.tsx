import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/providers/$slug")({
  component: () => <Outlet />,
});
