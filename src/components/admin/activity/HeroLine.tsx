// One-sentence status line above the map. Plain English, owner-friendly.
// Includes an anomaly badge when live count is materially above the
// short-term average (simple heuristic — no ML).

import { useEffect, useRef, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";

export interface HeroLineProps {
  publicOnline: number;
  membersOnline: number;
  keyActionsToday: number;
  ingestStatus: "healthy" | "degraded" | "down";
  updatedAt: number | null;
}

export function HeroLine({
  publicOnline, membersOnline, keyActionsToday, ingestStatus, updatedAt,
}: HeroLineProps) {
  const total = publicOnline + membersOnline;

  // Rolling ~10min average (client-side, 6s tick alignment) → simple anomaly.
  const historyRef = useRef<number[]>([]);
  const [avg, setAvg] = useState<number>(0);
  useEffect(() => {
    historyRef.current.push(total);
    if (historyRef.current.length > 100) historyRef.current.shift();
    const arr = historyRef.current;
    setAvg(arr.reduce((s, n) => s + n, 0) / arr.length);
  }, [total, updatedAt]);

  const anomaly = avg > 0 && total >= Math.max(3, avg * 2);
  const healthDot =
    ingestStatus === "healthy" ? "bg-emerald-400" :
    ingestStatus === "degraded" ? "bg-amber-400" : "bg-red-400";

  const sentence = total === 0
    ? "Quiet — no visitors on site right now."
    : `${publicOnline} ${publicOnline === 1 ? "visitor" : "visitors"}${membersOnline > 0 ? ` and ${membersOnline} ${membersOnline === 1 ? "member" : "members"}` : ""} on site now.${
        keyActionsToday > 0 ? ` ${keyActionsToday} key ${keyActionsToday === 1 ? "action" : "actions"} today.` : ""
      }`;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-reps-border bg-reps-panel/40 px-4 py-3">
      <Activity className="h-4 w-4 shrink-0 text-orange-300" />
      <p className="min-w-0 flex-1 font-display text-[15px] leading-snug text-white">
        {sentence}
      </p>
      {anomaly ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300">
          <TrendingUp className="h-3 w-3" />
          Above average
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5 text-[10.5px] text-white/50">
        <span className={`h-1.5 w-1.5 rounded-full ${healthDot}`} />
        {ingestStatus === "healthy" ? "All systems live" : ingestStatus === "degraded" ? "Partial data" : "Signal down"}
      </span>
    </div>
  );
}
