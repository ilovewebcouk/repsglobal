import * as React from "react";
import { Flame, Inbox, PoundSterling, Sparkles, TrendingUp, Clock } from "lucide-react";
import { KpiTile } from "@/components/dashboard/primitives";
import type { LeadKpis } from "@/lib/leads/leads.functions";

function fmtPence(p: number | null) {
  if (p === null) return "—";
  if (p === 0) return "£0";
  return "£" + Math.round(p / 100).toLocaleString();
}

export function KpiStrip({ kpis }: { kpis: LeadKpis | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KpiTile label="Active leads" value={kpis ? String(kpis.active_leads) : "—"} icon={Inbox} />
      <KpiTile
        label="Hot leads"
        value={kpis ? String(kpis.hot_leads) : "—"}
        icon={Flame}
        delta={kpis && kpis.hot_leads > 0 ? "score ≥ 80" : undefined}
        trend={kpis && kpis.hot_leads > 0 ? "up" : "flat"}
      />
      <KpiTile
        label="Reply time"
        value={
          kpis?.reply_time_avg_hours !== null && kpis?.reply_time_avg_hours !== undefined
            ? kpis.reply_time_avg_hours < 1
              ? `${Math.round(kpis.reply_time_avg_hours * 60)}m`
              : `${kpis.reply_time_avg_hours.toFixed(1)}h`
            : "—"
        }
        icon={Clock}
      />
      <KpiTile
        label="Conversion 30d"
        value={
          kpis?.conversion_pct_30d !== null && kpis?.conversion_pct_30d !== undefined
            ? `${Math.round(kpis.conversion_pct_30d)}%`
            : "—"
        }
        icon={TrendingUp}
      />
      <KpiTile label="Pipeline value" value={kpis ? fmtPence(kpis.pipeline_value_pence) : "—"} icon={PoundSterling} />
      <KpiTile label="AI forecast 30d" value={kpis ? fmtPence(kpis.predicted_revenue_30d_pence ?? 0) : "—"} icon={Sparkles} />
    </div>
  );
}

export function BottomCards({ kpis }: { kpis: LeadKpis | undefined }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Follow-ups due */}
      <div className="rounded-[16px] border border-reps-border bg-reps-panel p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
          <Clock className="size-3.5" /> Follow-ups due (48h)
        </div>
        <div className="mt-2 font-display text-[28px] font-bold text-white">
          {kpis?.follow_ups_due_48h ?? "—"}
        </div>
        <p className="mt-1 text-[12px] text-white/55">
          Leads where you set a follow-up time in the next 48 hours.
        </p>
      </div>

      {/* Sources */}
      <div className="rounded-[16px] border border-reps-border bg-reps-panel p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Lead sources</div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {(kpis?.source_counts ?? []).slice(0, 5).map((s) => {
            const max = kpis!.source_counts[0]?.count ?? 1;
            const pct = (s.count / max) * 100;
            return (
              <li key={s.source} className="text-[12px]">
                <div className="flex justify-between text-white/80">
                  <span className="capitalize">{s.source.replace(/_/g, " ")}</span>
                  <span className="text-white/55">{s.count}</span>
                </div>
                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-reps-panel-soft">
                  <div className="h-full bg-reps-orange" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
          {!kpis?.source_counts.length ? (
            <li className="text-[12px] text-white/45">No leads yet.</li>
          ) : null}
        </ul>
      </div>

      {/* Conversion funnel */}
      <div className="rounded-[16px] border border-reps-border bg-reps-panel p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Conversion funnel</div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {(kpis?.funnel ?? []).map((row) => {
            const max = kpis!.funnel[0]?.count ?? 1;
            const pct = max ? (row.count / max) * 100 : 0;
            return (
              <li key={row.stage} className="text-[12px]">
                <div className="flex justify-between text-white/80">
                  <span className="capitalize">{row.stage.replace(/_/g, " ")}</span>
                  <span className="text-white/55">{row.count}</span>
                </div>
                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-reps-panel-soft">
                  <div className="h-full bg-emerald-400/70" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
