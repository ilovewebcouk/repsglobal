import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAccountTypeBySlug } from "@/lib/website/account-type.functions";

export const Route = createFileRoute("/c/$slug")({
  beforeLoad: async ({ params }) => {
    const { accountType } = await getAccountTypeBySlug({ data: { slug: params.slug } });
    if (accountType === "training_provider") {
      throw redirect({ to: "/t/$slug", params: { slug: params.slug } });
    }
  },
  component: () => <Outlet />,
});
