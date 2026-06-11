import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { syncMySubscription } from "@/lib/billing/billing.functions";

type Search = { session_id?: string };

const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid"];
const PAID_TIERS = ["verified", "pro", "studio"];

export const Route = createFileRoute("/_authenticated/_professional/dashboard/syncing")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Setting up your account — REPs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SyncingPage,
});

const POLL_MS = 1500;
const MAX_ATTEMPTS = 20; // ~30s
// Trigger an active pull from Stripe on attempts 2 and 6 (~1.5s and ~9s in),
// so a missed webhook doesn't strand the user on this screen.
const SYNC_ATTEMPTS = new Set([2, 6]);

function SyncingPage() {
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const check = async (): Promise<void> => {
      if (cancelled) return;
      attempts += 1;

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (uid) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("tier,status")
          .eq("user_id", uid)
          .maybeSingle();

        const isPaid =
          !!sub &&
          PAID_TIERS.includes(sub.tier as string) &&
          LIVE_STATUSES.includes(sub.status as string);

        if (isPaid) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
      }

      // Webhook fallback: actively pull the latest subscription from Stripe.
      if (SYNC_ATTEMPTS.has(attempts)) {
        try {
          await syncMySubscription();
        } catch {
          /* non-fatal; next poll will retry */
        }
      }

      if (attempts >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      setTimeout(check, POLL_MS);
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text flex flex-col items-center justify-center px-6">
      <RepsWordmark className="h-[28px] text-white mb-10" />
      <div className="max-w-md w-full text-center space-y-5">
        {!timedOut ? (
          <>
            <Loader2 className="size-8 text-reps-orange mx-auto animate-spin" />
            <h1 className="font-display text-[26px] lg:text-[32px] text-white">
              Setting up your account…
            </h1>
            <p className="text-[15px] text-white/70">
              Payment received. We're activating your subscription — this usually takes a
              few seconds.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-[26px] lg:text-[32px] text-white">
              Still syncing
            </h1>
            <p className="text-[15px] text-white/70">
              Your payment went through but activation is taking longer than usual. It
              can take up to a minute. If it still doesn't load, email{" "}
              <a className="text-reps-orange underline" href="mailto:support@repsuk.org">
                support@repsuk.org
              </a>{" "}
              with your receipt and we'll sort it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={() => {
                  setTimedOut(false);
                  window.location.reload();
                }}
              >
                Check again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/dashboard", replace: true })}
              >
                Take me to the dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
