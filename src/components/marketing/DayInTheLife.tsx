import { AlertCircle, Sparkles } from "lucide-react";

import type { Competitor } from "@/data/competitor-data";
import type { DayInTheLifeRow } from "@/data/competitor-editorial";

export function DayInTheLife({
  c,
  rows,
}: {
  c: Competitor;
  rows: DayInTheLifeRow[];
}) {
  return (
    <div className="overflow-clip rounded-[22px] border border-reps-border bg-reps-ink">
      <div className="grid border-b border-reps-border/60 bg-reps-panel text-[11px] font-semibold uppercase tracking-wider md:grid-cols-[1fr_1.2fr_1.2fr]">
        <div className="px-5 py-4 text-white/50">The job</div>
        <div className="bg-reps-orange-soft px-5 py-4 text-reps-orange">REPs</div>
        <div className="px-5 py-4 text-white/65">{c.name}</div>
      </div>
      {rows.map((r) => (
        <div
          key={r.task}
          className="grid border-t border-reps-border/40 first:border-t-0 md:grid-cols-[1fr_1.2fr_1.2fr]"
        >
          <div className="bg-reps-panel/30 px-5 py-5 text-[13.5px] font-semibold text-white/90">
            {r.task}
          </div>
          <div className="bg-reps-orange-soft/30 px-5 py-5">
            <div className="flex items-start gap-2 text-[13px] leading-relaxed text-white/85">
              <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-reps-orange" />
              <span>{r.reps}</span>
            </div>
          </div>
          <div className="px-5 py-5">
            <p className="text-[13px] leading-relaxed text-white/75">{r.competitor}</p>
            {r.addOnFlag ? (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-reps-orange/40 bg-reps-orange/10 px-2.5 py-1 text-[11px] font-semibold text-reps-orange">
                <AlertCircle className="h-3 w-3" /> {r.addOnFlag}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
