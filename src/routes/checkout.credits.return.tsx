import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getMyWallet, reconcileCreditTopup } from "@/lib/credits/credits.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";

type ReturnSearch = { session_id?: string; status?: "success" | "canceled" };

export const Route = createFileRoute("/checkout/credits/return")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ReturnSearch => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    status:
      search.status === "canceled" ? "canceled" : search.status === "success" ? "success" : undefined,
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { next: "dashboard/settings" } as never });
    }
  },
  head: () => ({
    meta: [
      { title: "Credits added — REPs" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CreditsReturnPage,
});

const POLL_MS = 1500;
const MAX_ATTEMPTS = 16; // ~24s
const RECONCILE_AT = new Set([2, 6, 10]);

function CreditsReturnPage() {
  const { session_id, status } = Route.useSearch();
  const navigate = useNavigate();
  const fetchWallet = useServerFn(getMyWallet);
  const reconcile = useServerFn(reconcileCreditTopup);

  const [balance, setBalance] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const baselineRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === "canceled") return;
    let cancelled = false;
    let attempts = 0;

    const tick = async (): Promise<void> => {
      if (cancelled) return;
      attempts += 1;

      try {
        const wallet = await fetchWallet();
        if (baselineRef.current === null) baselineRef.current = wallet.balance;
        setBalance(wallet.balance);

        // Recent topup transaction OR balance grew → success
        if (wallet.balance > (baselineRef.current ?? 0)) {
          setDone(true);
          return;
        }
      } catch {
        /* ignore one-off network error, keep polling */
      }

      if (RECONCILE_AT.has(attempts) && session_id) {
        try {
          const res = await reconcile({
            data: { session_id, environment: getStripeEnvironment() },
          });
          if ("error" in res && res.error) setErrorMsg(res.error);
        } catch {
          /* non-fatal */
        }
      }

      if (attempts >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [fetchWallet, reconcile, session_id, status]);

  if (status === "canceled") {
    return (
      <Shell>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white/70">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="font-display text-[24px] font-semibold text-white">Payment canceled</h1>
        <p className="mt-2 text-[14px] text-white/65">No charge was made. You can try again any time.</p>
        <Button asChild className="mt-6 w-full">
          <Link to="/dashboard/settings">Back to settings</Link>
        </Button>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="font-display text-[24px] font-semibold text-white">Credits added</h1>
        <p className="mt-2 text-[14px] text-white/65">
          Your balance is now <span className="font-semibold text-white">{balance?.toLocaleString()}</span> credits.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate({ to: "/dashboard/settings" })}>
          Back to settings
        </Button>
      </Shell>
    );
  }

  if (timedOut) {
    return (
      <Shell>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white/70">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="font-display text-[24px] font-semibold text-white">Still processing</h1>
        <p className="mt-2 text-[14px] text-white/65">
          Your payment went through but credits haven't landed yet. They usually arrive within a minute.
          If they don't, email{" "}
          <a className="text-reps-orange underline" href="mailto:support@repsuk.org">
            support@repsuk.org
          </a>{" "}
          with your receipt.
        </p>
        {errorMsg && <p className="mt-3 text-[12px] text-red-300/80">{errorMsg}</p>}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full" onClick={() => window.location.reload()}>
            Check again
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/dashboard/settings" })}>
            Back to settings
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Loader2 className="mx-auto size-8 animate-spin text-reps-orange" />
      <h1 className="mt-5 font-display text-[24px] font-semibold text-white">Adding your credits…</h1>
      <p className="mt-2 text-[14px] text-white/65">
        Payment received. We're adding the credits to your wallet now.
      </p>
      {session_id && (
        <p className="mt-3 text-[11px] text-white/35">Ref: {session_id.slice(-12)}</p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-reps-ink px-4 py-12">
      <div className="w-full max-w-[480px] rounded-[22px] border border-white/10 bg-white/[0.03] p-8 text-center">
        {children}
      </div>
    </div>
  );
}
