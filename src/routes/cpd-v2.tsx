import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cpd-v2")({
  beforeLoad: () => {
    throw redirect({ to: "/cpd", replace: true });
  },
});
