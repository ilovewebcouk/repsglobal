import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import type { LeadKpis } from "@/lib/leads/leads.functions";

function Row({ label, pct }: { label: string; pct: number | null }) {
  return (
    <li>
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="text-white/85">{label}</span>
        <span className="font-semibold text-white">{pct === null ? "—" : `${pct}%`}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-reps-panel-soft">
        <div className="h-full rounded-full bg-reps-orange" style={{ width: `${pct ?? 0}%` }} />
      </div>
    </li>
  );
}

export function ConversionPerformanceCard({ kpis }: { kpis: LeadKpis | undefined }) {
  const cr = kpis?.conversion_rates;
  const avg = cr?.average_client_value_pence ?? null;
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel p-5">
      <div className="font-display text-[15.5px] font-bold text-white">Conversion performance</div>
      <div className="mt-0.5 text-[11.5px] text-white/55">Rolling 30-day</div>

      <ul className="mt-4 flex flex-col gap-3">
        <Row label="Lead to call" pct={cr?.lead_to_call ?? null} />
        <Row label="Call to proposal" pct={cr?.call_to_proposal ?? null} />
        <Row label="Proposal to client" pct={cr?.proposal_to_client ?? null} />
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-[14px] border border-reps-orange-border/40 bg-reps-orange-soft/15 px-4 py-3">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
            Average client value
          </div>
          <div className="mt-0.5 font-display text-[20px] font-bold text-white">
            {avg ? "£" + Math.round(avg / 100).toLocaleString() : "—"}
          </div>
        </div>
        <CheckCircle2 className="size-5 text-reps-orange" />
      </div>
    </div>
  );
}
