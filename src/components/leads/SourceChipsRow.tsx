import * as React from "react";
import { cn } from "@/lib/utils";

export const SOURCE_LABEL: Record<string, string> = {
  profile_enquire: "REPS profile",
  directory_search: "Directory search",
  website: "Website",
  referral: "Referral",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Manual",
  unknown: "Other",
};

export function sourceLabel(s: string): string {
  return SOURCE_LABEL[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SourceChipsRow({
  sources,
  value,
  onChange,
}: {
  sources: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  // Hide entire row when there's at most one source — the filter is dead UI.
  if (sources.length <= 1) return null;
  const items = ["all", ...sources];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">
        Source
      </span>
      {items.map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "h-7 rounded-full px-3 text-[11.5px] font-medium transition-colors",
              active
                ? "bg-reps-panel text-white ring-1 ring-reps-border"
                : "text-white/55 hover:text-white",
            )}
          >
            {s === "all" ? "All sources" : sourceLabel(s)}
          </button>
        );
      })}
    </div>
  );
}
