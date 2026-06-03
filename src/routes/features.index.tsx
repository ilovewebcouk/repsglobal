import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/features/")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }],
  }),
  component: () => <Navigate to="/for-professionals" replace />,
});
