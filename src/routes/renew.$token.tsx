// Public renewal page — token-gated, no auth required.
// Shown after a user clicks a renewal email link.
import { createFileRoute, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  peekRenewalToken,
  startRenewalCheckout,
} from "@/lib/churn/lifecycle.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/renew/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Renew your REPS membership" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RenewPage,
});

type PeekResult = Awaited<ReturnType<typeof peekRenewalToken>>;

function RenewPage() {
  const { token } = useParams({ from: "/renew/$token" });
  const peek = useServerFn(peekRenewalToken);
  const startCheckout = useServerFn(startRenewalCheckout);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ok"; data: Extract<PeekResult, { ok: true }> }
    | { kind: "bad"; reason: string }
  >({ kind: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    peek({ data: { token } }).then((res) => {
      if (cancelled) return;
      if (res.ok) setState({ kind: "ok", data: res });
      else setState({ kind: "bad", reason: res.reason });
    }).catch((e) => {
      if (!cancelled) setState({ kind: "bad", reason: e instanceof Error ? e.message : "error" });
    });
    return () => { cancelled = true; };
  }, [token, peek]);

  async function onClick() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const env = getStripeEnvironment();
      const res = await startCheckout({ data: { token, environment: env } });
      if ("error" in res) {
        setSubmitError(res.error);
        setSubmitting(false);
        return;
      }
      window.location.assign(res.url);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not start checkout");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-reps-bg text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[18px] border border-reps-border bg-reps-panel/40 p-8">
        {state.kind === "loading" ? (
          <p className="text-sm text-white/70">Loading your renewal link…</p>
        ) : state.kind === "bad" ? (
          <>
            <h1 className="font-display text-[24px] mb-3">This link can't be used</h1>
            <p className="text-sm text-white/70 mb-4">
              {state.reason === "consumed"
                ? "This renewal link has already been used. If you've finished checkout you're all set — sign in to confirm."
                : "This link is invalid or has expired. Get a fresh one by signing in to your dashboard."}
            </p>
            <a href="/auth" className="text-sm text-reps-accent underline">Sign in</a>
          </>
        ) : (
          <>
            <p className="text-[12px] uppercase tracking-[0.18em] text-reps-accent font-semibold mb-2">
              REPS MEMBERSHIP
            </p>
            <h1 className="font-display text-[28px] leading-tight mb-3">
              {state.data.pro_name ? `Hi ${state.data.pro_name.split(" ")[0]},` : "Welcome back"}
            </h1>
            <p className="text-sm text-white/80 mb-2">
              {state.data.purpose === "card_needed"
                ? "Add a card to keep your REPS profile live."
                : state.data.purpose === "payment_failed"
                  ? "Update your card to retry your renewal."
                  : "Reactivate your REPS profile in one tap."}
            </p>
            <p className="text-sm text-white/60 mb-6">
              {state.data.tier === "pro" ? "REPS Pro — £59/month" : "REPS Core — £34/year"}
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={onClick}
              disabled={submitting}
            >
              {submitting ? "Opening checkout…" : "Continue to secure checkout"}
            </Button>
            {submitError ? (
              <p className="mt-3 text-sm text-red-400">{submitError}</p>
            ) : null}
            <p className="mt-4 text-[11px] text-white/45">
              Payment is taken on Stripe. We never store your card details.
              This link expires{" "}
              {new Date(state.data.expires_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
