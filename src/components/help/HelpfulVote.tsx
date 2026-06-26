import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { recordHelpfulVote } from "@/lib/help/feedback.functions";

export function HelpfulVote({ articleSlug }: { articleSlug: string }) {
  const [submitted, setSubmitted] = useState<"up" | "down" | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(vote: 1 | -1) {
    if (submitted || pending) return;
    setPending(true);
    try {
      await recordHelpfulVote({ data: { articleSlug, vote } });
      setSubmitted(vote === 1 ? "up" : "down");
    } catch {
      // Silent — feedback is best-effort
      setSubmitted(vote === 1 ? "up" : "down");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-12 rounded-[18px] border border-white/10 bg-white/[0.03] p-6">
      {submitted ? (
        <div className="flex items-center gap-2 text-[14.5px] text-white/85">
          <Check className="size-4 text-emerald-300" aria-hidden />
          Thanks — feedback noted.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14.5px] font-medium text-white">Was this article helpful?</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submit(1)}
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.04] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50",
              )}
            >
              <ThumbsUp className="size-4" aria-hidden />
              Yes
            </button>
            <button
              type="button"
              onClick={() => submit(-1)}
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.04] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50",
              )}
            >
              <ThumbsDown className="size-4" aria-hidden />
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
