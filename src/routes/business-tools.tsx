import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/business-tools")({
  head: () => ({
    meta: [
      { title: "Features — REPs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Navigate to="/features" replace />,
});
