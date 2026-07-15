import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAccountTypeBySlug } from "@/lib/website/account-type.functions";

export const Route = createFileRoute("/t/$slug")({
  beforeLoad: async ({ params }) => {
    const { accountType } = await getAccountTypeBySlug({ data: { slug: params.slug } });
    // Individuals belong on /c/ — send them back so /t/ is provider-only.
    if (accountType && accountType !== "training_provider") {
      throw redirect({ to: "/c/$slug", params: { slug: params.slug } });
    }
  },
  component: () => <Outlet />,
});
