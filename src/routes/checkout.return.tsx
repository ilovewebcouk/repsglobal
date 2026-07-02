import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type ReturnSearch = { session_id?: string };

export const Route = createFileRoute("/checkout/return")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ReturnSearch => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  // No beforeLoad redirect: with deferred signup the user is NOT signed in
  // when they arrive here. We complete the sign-in below via magic link.
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // If we already have a session (legacy flow, or webhook ran fast and
      // user was already signed in), just continue to the syncing screen.
      const { data: existing } = await supabase.auth.getSession();
      if (existing.session) {
        if (!cancelled) navigate({ to: "/dashboard/syncing", search: { session_id } as never });
        return;
      }
      if (!session_id) {
        setError("Missing checkout reference. Please sign in to continue.");
        return;
      }
      try {
        const { claimDeferredCheckout } = await import(
          "@/lib/billing/deferred-signup.functions"
        );
        // Retry briefly — webhook + auth-user creation can race the redirect.
        let lastErr = "";
        for (let i = 0; i < 6; i++) {
          const result = await claimDeferredCheckout({ data: { session_id } });
          if ("url" in result) {
            void import("@/lib/analytics/track").then(({ track }) =>
              track.signupComplete({}),
            );
            void import("@/lib/analytics/public-conversion").then(({ trackConversion }) => {
              void trackConversion({ event_kind: "signup_complete" });
            });
            if (!cancelled) window.location.assign(result.url);
            return;
          }

          lastErr = result.error;
          await new Promise((r) => setTimeout(r, 1500));
        }
        if (!cancelled) {
          setError(
            lastErr ||
              "We've taken your payment but couldn't sign you in automatically. Please sign in.",
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not complete sign-in");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, session_id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-reps-ink px-4 py-12">
      <div className="w-full max-w-[480px] rounded-[22px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          {error ? <CheckCircle2 className="size-6" /> : <Loader2 className="size-6 animate-spin" />}
        </div>
        <h1 className="font-display text-[24px] font-semibold text-white">Payment received</h1>
        <p className="mt-2 text-[14px] text-white/65">
          {error
            ? error
            : "Thanks — we're activating your REPs membership and signing you in."}
        </p>
        {session_id && (
          <p className="mt-3 text-[11px] text-white/35">Ref: {session_id.slice(-12)}</p>
        )}
        {error && (
          <Button asChild className="mt-6 w-full">
            <Link to="/auth" search={{ next: "dashboard" } as never}>
              Sign in
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
