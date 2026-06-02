import { createFileRoute, redirect } from "@tanstack/react-router";

// /pricing is retired as a destination. /for-professionals is the canonical
// pro journey, with the pricing section anchored at #pricing.
export const Route = createFileRoute("/pricing")({
  beforeLoad: () => {
    throw redirect({ to: "/for-professionals", hash: "pricing" });
  },
});
