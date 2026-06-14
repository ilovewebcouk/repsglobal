import * as React from "react";
import type { LeadKpis } from "@/lib/leads/leads.functions";
import { sourceLabel } from "./SourceChipsRow";

export function LeadSourcesCard({ kpis }: { kpis: LeadKpis | undefined }) {
  const sources = kpis?.source_counts ?? [];
  const total = sources.reduce((a, s) => a + s.count, 0);

  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel p-5">
      <div className="font-display text-[15.5px] font-bold text-white">Lead sources</div>
      <div className="mt-0.5 text-[11.5px] text-white/55">Last 30 days</div>

      <ul className="mt-4 flex flex-col gap-3">
        {sources.length === 0 ? (
          <li className="text-[12.5px] text-white/45">No leads yet.</li>
        ) : (
          sources.slice(0, 5).map((s) => {
            const pct = total ? Math.round((s.count / total) * 100) : 0;
            return (
              <li key={s.source}>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="text-white/85">{sourceLabel(s.source)}</span>
                  <span className="font-semibold text-white">{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-reps-panel-soft">
                  <div
                    className="h-full rounded-full bg-reps-orange"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
