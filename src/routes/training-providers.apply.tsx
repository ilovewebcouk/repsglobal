import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The training-provider apply flow is now unified with the main /signup
 * deferred-checkout flow (same pattern as Core / Pro). This route is kept
 * as a redirect so existing "Apply to become a provider" CTAs, emails and
 * bookmarks continue to work.
 */
export const Route = createFileRoute("/training-providers/apply")({
  beforeLoad: () => {
    throw redirect({
      to: "/signup",
      search: {
        tier: "training-provider",
        period: "annual",
        next: "checkout",
      } as never,
    });
  },
  component: () => null,
});
