import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect stub — canonical CPD URL is /cpd. Kept until launch for any
// in-flight inbound links.
export const Route = createFileRoute("/cpd-v2")({
  beforeLoad: () => {
    throw redirect({ to: "/cpd", replace: true });
  },
});
