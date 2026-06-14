import { useEffect } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type ReturnSearch = { session_id?: string };

export const Route = createFileRoute("/checkout/return")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ReturnSearch => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  beforeLoad: async () => {
    // Stripe redirects here after hosted checkout. If the user's session
    // expired (e.g. very long checkout), bounce them through /auth so the
    // /dashboard/syncing handoff doesn't dead-end on the login page.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { next: "dashboard" } as never });
    }
  },
  head: () => ({
    meta: [
      { title: "Payment complete — REPs" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => {
      navigate({ to: "/dashboard/syncing", search: { session_id } as never });
    }, 2000);
    return () => window.clearTimeout(t);
  }, [navigate, session_id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-reps-ink px-4 py-12">
      <div className="w-full max-w-[480px] rounded-[22px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="font-display text-[24px] font-semibold text-white">Payment received</h1>
        <p className="mt-2 text-[14px] text-white/65">
          Thanks — your REPs membership is being activated. We're taking you to your dashboard.
        </p>
        {session_id && (
          <p className="mt-3 text-[11px] text-white/35">Ref: {session_id.slice(-12)}</p>
        )}
        <Button asChild className="mt-6 w-full">
          <Link to="/dashboard/syncing" search={{ session_id } as never}>
            Continue to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
