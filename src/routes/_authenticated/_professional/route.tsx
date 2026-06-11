import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireRole } from "@/lib/route-gates";

export const Route = createFileRoute("/_authenticated/_professional")({
  ssr: false,
  beforeLoad: requireRole(["professional"]),
  component: () => <Outlet />,
});