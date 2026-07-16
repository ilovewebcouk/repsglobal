import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout wrapper so children like /training-providers/apply can mount.
// The marketing page lives at training-providers.index.tsx (/training-providers).
export const Route = createFileRoute("/training-providers")({
  component: () => <Outlet />,
});
