import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, XCircle, Loader2 } from "lucide-react";

import { verifyProviderReviewEmail } from "@/lib/training-providers.functions";

export const Route = createFileRoute("/reviews/provider/verify/$token")({
  head: () => ({
    meta: [
      { title: "Verifying your review — REPs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: VerifyReviewPage,
});

function VerifyReviewPage() {
  const { token } = Route.useParams();
  const [state, setState] = React.useState<
    { kind: "loading" } | { kind: "ok"; already: boolean } | { kind: "err" }
  >({ kind: "loading" });

  const mut = useMutation({
    mutationFn: () => verifyProviderReviewEmail({ data: { token } }),
    onSuccess: (r) => {
      if (r.ok) setState({ kind: "ok", already: !!r.alreadyVerified });
      else setState({ kind: "err" });
    },
    onError: () => setState({ kind: "err" }),
  });

  React.useEffect(() => {
    mut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-reps-bg text-white grid place-items-center p-8">
      <div className="w-full max-w-md rounded-[22px] border border-white/10 bg-white/[0.03] p-8 text-center">
        {state.kind === "loading" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-white/50" />
            <p className="mt-4 text-white/70">Verifying your review…</p>
          </>
        )}
        {state.kind === "ok" && (
          <>
            <BadgeCheck className="mx-auto h-10 w-10 text-emerald-300" />
            <h1 className="mt-4 font-display text-2xl">
              {state.already ? "Already verified" : "Review published"}
            </h1>
            <p className="mt-2 text-white/70">
              Thanks for confirming — your review is now live on REPs. Our
              moderation team may still contact you for proof of your learning
              experience.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex text-sm text-reps-orange hover:underline"
            >
              Back to REPs
            </Link>
          </>
        )}
        {state.kind === "err" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-400" />
            <h1 className="mt-4 font-display text-2xl">Link expired or invalid</h1>
            <p className="mt-2 text-white/70">
              This verification link isn't valid — it may already have been
              used, or your review may have been withdrawn. Submit a new
              review from the provider's page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
