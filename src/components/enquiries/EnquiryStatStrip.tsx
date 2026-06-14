import * as React from "react";
import { Mail, Clock, BarChart3 } from "lucide-react";
import type { EnquiryStats } from "@/lib/enquiries/enquiries.functions";

function Tile({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-4 rounded-[18px] border border-reps-border bg-reps-panel px-5 py-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-reps-orange-soft">
        <Icon className="size-4 text-reps-orange" />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55">{label}</div>
        <div className="mt-1 font-display text-[22px] font-bold leading-none text-white">{value}</div>
      </div>
    </div>
  );
}

export function EnquiryStatStrip({ stats }: { stats: EnquiryStats | undefined }) {
  const reply = stats?.reply_time_avg_hours;
  const replyStr = reply == null ? "—" : reply < 1 ? `${Math.round(reply * 60)}m` : `${reply.toFixed(1)}h`;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile label="Enquiries this month" value={stats ? String(stats.this_month_count) : "—"} icon={Mail} />
      <Tile label="Avg reply time" value={replyStr} icon={Clock} />
      <Tile label="Reply rate (30d)" value={stats?.reply_rate_pct != null ? `${stats.reply_rate_pct}%` : "—"} icon={BarChart3} />
    </div>
  );
}
