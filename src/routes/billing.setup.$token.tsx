// Public, token-gated card-capture page for BD members who have no Stripe
// customer (Workstream 2) or who lapsed (Workstream 3). Mirrors the
// /renew/$token UX. SSR off so secrets stay server-side via server fns.
import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  peekBdSetupLinkToken,
  startBdSetupLinkCheckout,
} from "@/lib/billing/convert-legacy.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  status: z.enum(["done", "cancelled"]).optional(),
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/billing/setup/$token")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Add your card — REPS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SetupPage,
});

type Peek = Awaited<ReturnType<typeof peekBdSetupLinkToken>>;

function SetupPage() {
  const { token } = useParams({ from: "/billing/setup/$token" });
  const search = useSearch({ from: "/billing/setup/$token" });
  const peek = useServerFn(peekBdSetupLinkToken);
  const startCheckout = useServerFn(startBdSetupLinkCheckout);
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ok"; data: Peek }
    | { kind: "bad"; reason: string }
  >({ kind: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    peek({ data: { token } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setState({ kind: "ok", data: res });
        else setState({ kind: "bad", reason: res.reason ?? "invalid" });
      })
      .catch((e) => {
        if (!cancelled) setState({ kind: "bad", reason: e instanceof Error ? e.message : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [token, peek]);

  async function onClick() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const env = getStripeEnvironment();
      const res = await startCheckout({ data: { token, environment: env } });
      if ("error" in res && res.error) {
        setSubmitError(res.error);
        setSubmitting(false);
        return;
      }
      if ("url" in res && res.url) {
        window.location.assign(res.url);
      } else {
        setSubmitError("Could not start checkout");
        setSubmitting(false);
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not start checkout");
      setSubmitting(false);
    }
  }

  // Returned from Stripe Checkout
  if (search.status === "done") {
    return (
      <Shell>
        <Eyebrow>REPS MEMBERSHIP</Eyebrow>
        <h1 className="font-display text-[28px] leading-tight mb-3">You're all set.</h1>
        <p className="text-sm text-white/80 mb-4">
          Your card is saved and your REPs Core membership is active. We'll send
          a confirmation email shortly with your renewal details.
        </p>
        <a href="https://repsuk.org/auth" className="text-sm text-reps-accent underline">
          Sign in to your dashboard →
        </a>
      </Shell>
    );
  }
  if (search.status === "cancelled") {
    return (
      <Shell>
        <Eyebrow>REPS MEMBERSHIP</Eyebrow>
        <h1 className="font-display text-[28px] leading-tight mb-3">Checkout cancelled</h1>
        <p className="text-sm text-white/80 mb-4">
          No card was added and nothing was charged. You can try again any time
          using the same link.
        </p>
        <Button onClick={() => window.location.assign(window.location.pathname)}>Try again</Button>
      </Shell>
    );
  }

  return (
    <Shell>
      {state.kind === "loading" ? (
        <p className="text-sm text-white/70">Loading…</p>
      ) : state.kind === "bad" ? (
        <>
          <h1 className="font-display text-[24px] mb-3">This link can't be used</h1>
          <p className="text-sm text-white/70 mb-4">
            {state.reason === "expired"
              ? "This link has expired. Reply to the email and we'll send you a fresh one."
              : "This link is invalid. Reply to the email and we'll send you a fresh one."}
          </p>
        </>
      ) : state.data.consumed ? (
        <>
          <Eyebrow>REPS MEMBERSHIP</Eyebrow>
          <h1 className="font-display text-[24px] mb-3">Already set up</h1>
          <p className="text-sm text-white/80 mb-4">
            This link has already been used — your membership is active.
          </p>
          <a href="https://repsuk.org/auth" className="text-sm text-reps-accent underline">Sign in →</a>
        </>
      ) : (
        <>
          <Eyebrow>REPS MEMBERSHIP</Eyebrow>
          <h1 className="font-display text-[28px] leading-tight mb-3">
            {state.data.proName ? `Hi ${state.data.proName},` : "Welcome back"}
          </h1>
          <p className="text-sm text-white/80 mb-2">
            {state.data.kind === "reactivate"
              ? "Add a card to reactivate your REPs profile."
              : "Add a card to keep your REPs profile live."}
          </p>
          <p className="text-sm text-white/60 mb-6">
            REPs Core — {state.data.amount ?? "£99"}/year
            {state.data.renewalDate ? ` · renews ${state.data.renewalDate}` : ""}
          </p>
          <Button onClick={onClick} disabled={submitting} className="w-full">
            {submitting ? "Opening Stripe…" : "Add your card →"}
          </Button>
          {submitError && (
            <p className="mt-3 text-sm text-rose-300">{submitError}</p>
          )}
          <p className="mt-4 text-xs text-white/50">
            Secured by Stripe. You'll be redirected to a hosted checkout page.
            Nothing is charged today
            {state.data.kind === "setup" && state.data.renewalDate
              ? ` — your first payment is on ${state.data.renewalDate}.`
              : "."}
          </p>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-reps-bg text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[18px] border border-reps-border bg-reps-panel/40 p-8">
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] uppercase tracking-[0.18em] text-reps-accent font-semibold mb-2">
      {children}
    </p>
  );
}
