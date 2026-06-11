import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";

const gate = requireRole(["client", "professional"]);

export const Route = createFileRoute("/portal")({
  ssr: false,
  beforeLoad: async (ctx) => {
    await gate(ctx);
    throw redirect({ to: "/portal/today" });
  },
});
