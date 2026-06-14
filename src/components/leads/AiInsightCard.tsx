import * as React from "react";
import { Sparkles, RefreshCw, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type LeadDTO } from "@/lib/leads/leads.functions";
import { scoreLead, draftLeadReply, type DraftReply } from "@/lib/leads/leads-ai.functions";

export function AiInsightCard({ lead }: { lead: LeadDTO }) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState<DraftReply | null>(null);

  const scoreMut = useMutation({
    mutationFn: () => scoreLead({ data: { enquiryId: lead.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      toast.success("AI re-scored this lead");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't re-score"),
  });

  const draftMut = useMutation({
    mutationFn: () => draftLeadReply({ data: { enquiryId: lead.id } }),
    onSuccess: (d) => setDraft(d),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't draft reply"),
  });

  // Derive band from score directly so the label can't contradict the number.
  // Tiers: <30 Cold · 30–54 Lukewarm · 55–74 Warm · ≥75 Hot.
  const score = lead.ai_score;
  const subtitle =
    score === null
      ? "Awaiting AI score"
      : score >= 75
        ? "High-intent enquiry · auto-scored"
        : score >= 55
          ? "Warm enquiry · auto-scored"
          : score >= 30
            ? "Lukewarm enquiry · auto-scored"
            : "Cold enquiry · auto-scored";

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-reps-orange-border/80 bg-reps-panel p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-reps-orange-soft/45 via-reps-orange-soft/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-reps-orange/45 to-transparent"
      />
      <div className="relative">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-reps-orange-soft">
          <Sparkles className="size-4 text-reps-orange" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[15.5px] font-bold text-white">AI lead insight</h3>
            {lead.ai_score !== null ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-reps-panel-soft px-2 py-0.5 text-[10.5px] font-semibold text-white/85"
                    >
                      {lead.ai_score}
                      <Info className="size-3 text-white/55" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] text-left">
                    <div className="text-[11px] font-semibold text-white/55">Why this score</div>
                    <ul className="mt-1 list-disc pl-4 text-[11.5px]">
                      <li>Stated goal and timeline</li>
                      <li>Contact details + preferred format</li>
                      <li>Buying signals in the message</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
          <div className="mt-0.5 text-[11.5px] text-white/55">{subtitle}</div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-[8px] px-2 text-[11px] text-white/70 hover:text-white"
          onClick={() => scoreMut.mutate()}
          disabled={scoreMut.isPending}
        >
          {scoreMut.isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          <span className="ml-1">Refresh</span>
        </Button>
      </div>

      {/* Body */}
      <p className="mt-4 text-[13px] leading-relaxed text-white/85">
        {lead.ai_summary ?? "AI summary will appear here once this lead is scored."}
        {lead.ai_recommended_action ? (
          <>
            {" "}
            <span className="text-white/95">
              Recommended action: {lead.ai_recommended_action.replace(/\.$/, "")}.
            </span>
          </>
        ) : null}
      </p>

      {/* Draft reply preview */}
      {draft ? (
        <div className="mt-4 rounded-[12px] border border-reps-border bg-reps-ink/60 p-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">
            AI draft
          </div>
          <div className="mt-1 text-[12px] font-semibold text-white">{draft.subject}</div>
          <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-white/80">{draft.body}</p>
          <Button
            asChild
            size="sm"
            className="mt-3 h-9 w-full rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
          >
            <a
              href={`mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
            >
              Open in email
            </a>
          </Button>
        </div>
      ) : (
        <Button
          className="mt-4 h-11 w-full rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
          onClick={() => draftMut.mutate()}
          disabled={draftMut.isPending}
        >
          {draftMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          <span className="ml-2">Draft reply</span>
        </Button>
      )}
      </div>
    </div>
  );
}
