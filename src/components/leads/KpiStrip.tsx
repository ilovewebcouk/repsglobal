import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadKpis } from "@/lib/leads/leads.functions";

function fmtPence(p: number | null | undefined) {
  if (p === null || p === undefined) return "—";
  if (p === 0) return "£0";
  return "£" + Math.round(p / 100).toLocaleString();
}

function Tile({
  label,
  value,
  delta,
  emphasised,
  footer,
}: {
  label: string;
  value: string;
  delta?: number;
  emphasised?: boolean;
  footer?: React.ReactNode;
}) {
  const showDelta = typeof delta === "number" && delta !== 0;
  const up = (delta ?? 0) > 0;
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-[18px] border bg-reps-panel px-5 py-4",
        emphasised
          ? "border-reps-orange-border/40 bg-gradient-to-br from-reps-orange-soft/20 via-reps-panel to-reps-panel"
          : "border-reps-border",
      )}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">
        {label}
      </div>
      <div className="mt-3">
        <div className={cn(
          "font-display font-bold leading-none text-white",
          emphasised ? "text-[30px]" : "text-[34px]",
        )}>
          {value}
        </div>
        {showDelta ? (
          <div className="mt-2.5 flex items-center gap-1 text-[11.5px] font-medium text-reps-orange">
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {up ? "+" : ""}{delta}% this week
          </div>
        ) : footer ? (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] font-medium text-reps-orange">
            {footer}
          </div>
        ) : (
          <div className="mt-2.5 text-[11.5px] text-white/45">—</div>
        )}
      </div>
    </div>
  );
}

export function KpiStrip({ kpis }: { kpis: LeadKpis | undefined }) {
  const sc = kpis?.stage_counts;
  const wd = kpis?.weekly_deltas;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Tile label="New leads"     value={sc ? String(sc.new) : "—"}           delta={wd?.new} />
      <Tile label="Call booked"   value={sc ? String(sc.call_booked) : "—"}   delta={wd?.call_booked} />
      <Tile label="Proposal sent" value={sc ? String(sc.proposal_sent) : "—"} delta={wd?.proposal_sent} />
      <Tile label="Trial booked"  value={sc ? String(sc.trial_booked) : "—"}  delta={wd?.trial_booked} />
      <Tile label="Converted"     value={sc ? String(sc.converted) : "—"}     delta={wd?.converted} />
      <Tile
        label="Potential monthly revenue"
        value={fmtPence(kpis?.potential_monthly_revenue_pence ?? null)}
        emphasised
        footer={<><Sparkles className="size-3" /> Based on pipeline value</>}
      />
    </div>
  );
}
