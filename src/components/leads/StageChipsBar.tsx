import * as React from "react";
import { cn } from "@/lib/utils";
import { LEAD_STAGES, LEAD_STAGE_LABEL, type LeadStage } from "@/lib/leads/leads.functions";

const VISIBLE: LeadStage[] = ["new", "call_booked", "proposal_sent", "trial_booked", "converted"];

export function StageChipsBar({
  value,
  onChange,
}: {
  value: LeadStage | "all";
  onChange: (v: LeadStage | "all") => void;
}) {
  const items: Array<{ key: LeadStage | "all"; label: string }> = [
    { key: "all", label: "All leads" },
    ...VISIBLE.map((s) => ({ key: s, label: LEAD_STAGE_LABEL[s] })),
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={cn(
              "h-8 rounded-full px-4 text-[12.5px] font-semibold transition-colors",
              active
                ? "bg-reps-orange text-white"
                : "bg-reps-panel text-white/70 hover:bg-reps-panel-soft hover:text-white",
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

void LEAD_STAGES;
