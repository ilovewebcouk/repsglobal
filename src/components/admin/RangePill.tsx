import { ChevronDown } from "lucide-react";

export function RangePill({ label = "Last 30 days" }: { label?: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/75 shadow-none transition-colors hover:text-white"
    >
      <span>{label}</span>
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}
