import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cpd")({
  beforeLoad: () => {
    throw redirect({ to: "/education", code: 301 });
  },
  component: () => null,
});
