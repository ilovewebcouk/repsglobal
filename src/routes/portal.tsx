import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";

export const Route = createFileRoute("/portal")({
  ssr: false,
  beforeLoad: requireRole(['client', 'professional']),
  beforeLoad: () => {
    throw redirect({ to: "/portal/today" });
  },
});
