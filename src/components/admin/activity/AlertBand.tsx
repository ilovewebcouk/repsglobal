// Conditional AlertBand — sits above the CommandStrip.
// Renders null when there are 0 critical alerts, so it takes 0 px.

import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertBandProps {
  criticalCount: number;
  warningCount?: number;
  topLabel?: string | null;
  onOpen?: () => void;
}

export function AlertBand({ criticalCount, warningCount = 0, topLabel, onOpen }: AlertBandProps) {
  if (criticalCount <= 0) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      data-alert-band
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-[14px] border border-rose-500/50 bg-rose-500/10 px-4 py-2.5 text-left transition",
        "hover:border-rose-400/70 hover:bg-rose-500/15",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/30" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-400" />
        </span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-rose-100">
            {criticalCount} critical {criticalCount === 1 ? "alert" : "alerts"} need attention
            {warningCount > 0 ? (
              <span className="ml-1.5 font-medium text-amber-200/85">· {warningCount} warning</span>
            ) : null}
          </div>
          {topLabel ? (
            <div className="truncate text-[11px] text-rose-100/70">{topLabel}</div>
          ) : null}
        </div>
      </div>
      <div className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-rose-100/80 group-hover:text-white">
        <AlertTriangle className="h-3.5 w-3.5" /> Open queue <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}
