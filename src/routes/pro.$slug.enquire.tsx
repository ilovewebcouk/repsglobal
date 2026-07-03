// Legacy URL. `/pro/$slug/enquire` moved to `/c/$slug/enquire`.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pro/$slug/enquire")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/c/$slug/enquire", params: { slug: params.slug }, statusCode: 301 });
  },
  component: () => null,
});
