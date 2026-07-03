// Legacy URL. `/pro/$slug/review` moved to `/c/$slug/review`.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pro/$slug/review")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/c/$slug/review", params: { slug: params.slug } });
  },
  component: () => null,
});
