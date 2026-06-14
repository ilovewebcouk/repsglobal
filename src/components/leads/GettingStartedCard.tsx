import * as React from "react";
import { Sparkles, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Low-data state shown when the trainer has fewer than 5 leads. */
export function GettingStartedCard({
  leadCount,
  firstLeadName,
  onAddLead,
  onOpenFirst,
}: {
  leadCount: number;
  firstLeadName?: string | null;
  onAddLead: () => void;
  onOpenFirst?: () => void;
}) {
  const hasLeads = leadCount > 0;
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-reps-orange-soft/20 blur-3xl"
      />
      <div className="relative grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft/30 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-reps-orange">
            <Sparkles className="size-3" /> Getting started
          </div>
          <h2 className="mt-3 font-display text-[22px] font-bold leading-tight text-white lg:text-[26px]">
            {hasLeads
              ? `You have ${leadCount} lead${leadCount === 1 ? "" : "s"} in your pipeline`
              : "Your leads will land here"}
          </h2>
          <p className="mt-2 max-w-[460px] text-[13.5px] leading-relaxed text-white/70">
            {hasLeads && firstLeadName
              ? `Reply to ${firstLeadName} to keep them warm. Conversion stats and pipeline analytics unlock as you build history.`
              : "Every enquiry from your REPS profile lands here. Add one manually to see how the workflow feels."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {hasLeads && onOpenFirst ? (
              <Button
                onClick={onOpenFirst}
                className="h-10 rounded-[10px] bg-reps-orange px-4 text-[12.5px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
              >
                Open {firstLeadName ?? "lead"}
                <ArrowRight className="size-3.5" data-icon="inline-end" />
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={onAddLead}
              className="h-10 rounded-[10px] border-reps-border bg-reps-panel-soft px-4 text-[12.5px] font-semibold text-white/85 shadow-none hover:bg-reps-panel hover:text-white"
            >
              <Plus className="size-3.5" data-icon="inline-start" /> Add a lead manually
            </Button>
          </div>
        </div>

        {/* Mini KPI strip preview */}
        <div className="grid grid-cols-3 gap-2 lg:gap-2.5">
          {[
            { label: "Pipeline", value: leadCount },
            { label: "Booked", value: 0 },
            { label: "Converted", value: 0 },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-[16px] border border-reps-border bg-reps-panel-soft/60 px-3 py-3 text-center"
            >
              <div className="font-display text-[24px] font-bold leading-none text-white">{t.value}</div>
              <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/45">
                {t.label}
              </div>
            </div>
          ))}
          <div className="col-span-3 rounded-[12px] border border-dashed border-reps-border/60 px-3 py-2.5 text-center text-[10.5px] text-white/45">
            Full KPIs &amp; analytics unlock at 5+ leads
          </div>
        </div>
      </div>
    </div>
  );
}
