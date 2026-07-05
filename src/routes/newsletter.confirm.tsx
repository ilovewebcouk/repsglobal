import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Check, Loader2, X } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { confirmNewsletterSubscription } from "@/lib/newsletter/subscribers.functions";

const Search = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/newsletter/confirm")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({
    meta: [
      { title: "Confirm your newsletter subscription — REPS" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Confirm your REPS newsletter subscription." },
    ],
  }),
  component: ConfirmPage,
});

type State = "loading" | "confirmed" | "already" | "invalid";

function ConfirmPage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>("loading");
  const confirmFn = useServerFn(confirmNewsletterSubscription);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    let cancelled = false;
    confirmFn({ data: { token } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.reason === "confirmed") setState("confirmed");
        else if (res.ok && res.reason === "already") setState("already");
        else setState("invalid");
      })
      .catch(() => !cancelled && setState("invalid"));
    return () => {
      cancelled = true;
    };
  }, [token, confirmFn]);

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />
      <main className="mx-auto max-w-[560px] px-6 py-24 lg:py-32">
        <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8 text-center">
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto size-6 animate-spin text-reps-orange" />
              <p className="mt-4 text-[14px] text-white/60">Confirming your subscription…</p>
            </>
          )}
          {(state === "confirmed" || state === "already") && (
            <>
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <Check className="size-5" />
              </div>
              <h1 className="mt-4 font-display text-[24px] font-bold text-white">
                {state === "confirmed" ? "You're subscribed" : "Already confirmed"}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                {state === "confirmed"
                  ? "Thanks — you'll start getting the REPS newsletter."
                  : "This email is already on the REPS newsletter list."}
              </p>
              <Link
                to="/resources"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white hover:bg-reps-orange/90"
              >
                Read latest articles
              </Link>
            </>
          )}
          {state === "invalid" && (
            <>
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <X className="size-5" />
              </div>
              <h1 className="mt-4 font-display text-[24px] font-bold text-white">
                Confirmation link invalid
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                This link may have expired or already been used. Sign up again on any article page.
              </p>
              <Link
                to="/resources"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-border bg-white/[0.04] px-5 text-[14px] font-semibold text-white/85 hover:text-white"
              >
                Back to Resources
              </Link>
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
