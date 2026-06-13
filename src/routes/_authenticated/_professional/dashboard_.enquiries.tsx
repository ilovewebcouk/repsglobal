import { createFileRoute, redirect } from "@tanstack/react-router";

// Phase 2.0: Enquiries has been replaced by Leads pipeline.
// Preserve deep links by redirecting.
export const Route = createFileRoute("/_authenticated/_professional/dashboard_/enquiries")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/leads" }); },
});
