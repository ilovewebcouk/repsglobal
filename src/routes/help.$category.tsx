import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/help/$category")({
  component: HelpCategoryLayout,
});

function HelpCategoryLayout() {
  return <Outlet />;
}