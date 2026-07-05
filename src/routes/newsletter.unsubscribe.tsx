import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Check, Loader2, X } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { Button } from "@/components/ui/button";
import { unsubscribeFromNewsletter } from "@/lib/newsletter/subscribers.functions";

const Search = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/newsletter/unsubscribe")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({
    meta: [
      { title: "Unsubscribe — REPS newsletter" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Unsubscribe from the REPS newsletter." },
    ],
  }),
  component: UnsubPage,
});

type State = "confirm" | "loading" | "done" | "already" | "invalid";

function UnsubPage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>(token ? "confirm" : "invalid");
  const unsubFn = useServerFn(unsubscribeFromNewsletter);

  async function handleUnsub() {
    if (!token) return;
    setState("loading");
    try {
      const res = await unsubFn({ data: { token } });
      if (res.ok && res.reason === "unsubscribed") setState("done");
      else if (res.ok && res.reason === "already") setState("already");
      else setState("invalid");
    } catch {
      setState("invalid");
    }
  }

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />
      <main className="mx-auto max-w-[560px] px-6 py-24 lg:py-32">
        <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8 text-center">
          {state === "confirm" && (
            <>
              <h1 className="font-display text-[24px] font-bold text-white">Unsubscribe from the REPS newsletter?</h1>
              <p className="mt-3 text-[14px] leading-relaxed text-white/65">
                You'll stop receiving our newsletter emails. This doesn't affect any account or transactional emails.
              </p>
              <Button
                onClick={handleUnsub}
                className="mt-6 h-11 bg-reps-orange px-6 text-white hover:bg-reps-orange/90"
              >
                Yes, unsubscribe
              </Button>
            </>
          )}
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto size-6 animate-spin text-reps-orange" />
              <p className="mt-4 text-[14px] text-white/60">Unsubscribing…</p>
            </>
          )}
          {(state === "done" || state === "already") && (
            <>
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <Check className="size-5" />
              </div>
              <h1 className="mt-4 font-display text-[24px] font-bold text-white">
                {state === "done" ? "You're unsubscribed" : "Already unsubscribed"}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                {state === "done"
                  ? "You won't receive any more REPS newsletter emails."
                  : "This email is not currently on the REPS newsletter list."}
              </p>
              <Link
                to="/resources"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] border border-reps-border bg-white/[0.04] px-5 text-[14px] font-semibold text-white/85 hover:text-white"
              >
                Back to Resources
              </Link>
            </>
          )}
          {state === "invalid" && (
            <>
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <X className="size-5" />
              </div>
              <h1 className="mt-4 font-display text-[24px] font-bold text-white">Link invalid</h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                This unsubscribe link may have expired. Reply to any REPS newsletter and we'll remove you manually.
              </p>
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
