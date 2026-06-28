import type { TimelineSource } from "@/lib/ops/timeline.functions";

/**
 * Canonical color tokens for ops timeline source pills.
 * High-contrast text (-50) on subtle (/15) backgrounds so labels stay legible
 * on dark and light surfaces. Keep this map as the single source of truth —
 * do not redefine pill colors inline elsewhere in the app.
 */
export const SOURCE_PILL_CLASSES: Record<TimelineSource, string> = {
  payment: "bg-emerald-500/15 text-emerald-50 border-emerald-400/40",
  webhook: "bg-sky-500/15 text-sky-50 border-sky-400/40",
  subscription: "bg-indigo-500/15 text-indigo-50 border-indigo-400/40",
  churn: "bg-rose-500/15 text-rose-50 border-rose-400/40",
  recovery: "bg-amber-500/15 text-amber-50 border-amber-400/40",
  email: "bg-violet-500/15 text-violet-50 border-violet-400/40",
  verification: "bg-emerald-500/15 text-emerald-50 border-emerald-400/40",
  support: "bg-orange-500/15 text-orange-50 border-orange-400/40",
  review: "bg-yellow-500/15 text-yellow-50 border-yellow-400/40",
  admin: "bg-fuchsia-500/15 text-fuchsia-50 border-fuchsia-400/40",
  identity: "bg-teal-500/15 text-teal-50 border-teal-400/40",
  auth: "bg-slate-500/20 text-slate-50 border-slate-400/40",
  dispute: "bg-rose-600/20 text-rose-50 border-rose-500/50",
};

export const SOURCE_DOT_CLASSES: Record<TimelineSource, string> = {
  payment: "bg-emerald-400",
  webhook: "bg-sky-400",
  subscription: "bg-indigo-400",
  churn: "bg-rose-400",
  recovery: "bg-amber-400",
  email: "bg-violet-400",
  verification: "bg-emerald-400",
  support: "bg-orange-400",
  review: "bg-yellow-400",
  admin: "bg-fuchsia-400",
  identity: "bg-teal-400",
  auth: "bg-slate-400",
};

export const ALL_TIMELINE_SOURCES: TimelineSource[] = Object.keys(
  SOURCE_PILL_CLASSES,
) as TimelineSource[];

export function SourcePill({
  source,
  active = true,
  as = "span",
  onClick,
  className = "",
}: {
  source: TimelineSource;
  active?: boolean;
  as?: "span" | "button";
  onClick?: () => void;
  className?: string;
}) {
  const tone = active
    ? SOURCE_PILL_CLASSES[source]
    : "border-reps-border bg-reps-panel/40 text-reps-text/40";
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium leading-none";
  if (as === "button") {
    return (
      <button type="button" onClick={onClick} className={`${base} ${tone} ${className}`}>
        {source}
      </button>
    );
  }
  return <span className={`${base} ${tone} ${className}`}>{source}</span>;
}
