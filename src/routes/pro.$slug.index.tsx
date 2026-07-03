// Legacy URL. `/pro/$slug` moved to `/c/$slug` — permanent redirect for
// existing bookmarks, inbound links, and search-engine crawlers. Keeping
// this stub (instead of deleting the file) so TanStack file-based routing
// still matches the URL and issues the redirect rather than 404-ing.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pro/$slug/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/c/$slug", params: { slug: params.slug }, statusCode: 301 });
  },
  component: () => null,
});
