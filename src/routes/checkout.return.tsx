import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ReturnSearch = { session_id?: string };

export const Route = createFileRoute("/checkout/return")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ReturnSearch => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-reps-ink px-4 py-12">
      <div className="w-full max-w-[480px] rounded-[22px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="font-display text-[24px] font-semibold text-white">
          Payment received
        </h1>
        <p className="mt-2 text-[14px] text-white/65">
          Thanks — your REPs membership is being activated. You'll be redirected to your dashboard.
        </p>
        {session_id && (
          <p className="mt-3 text-[11px] text-white/35">Ref: {session_id.slice(-12)}</p>
        )}
        <Button asChild className="mt-6 w-full">
          <Link
            to="/dashboard/syncing"
            search={{ session_id } as never}
          >
            Continue to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
