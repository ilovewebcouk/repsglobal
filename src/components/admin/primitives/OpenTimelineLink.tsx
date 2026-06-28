import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Canonical "Open member timeline" action.
 *
 * Surfaces the Flight Recorder (per-member chronological event log) from
 * any page that references a member. Every list, drill-down, or detail
 * row that knows a `user_id` MUST render this so operators can trace the
 * full member history in one click.
 *
 * - `variant="inline"` — small text link for inside dropdown menus / table rows.
 * - `variant="button"` — pill-style chip for use in row action columns / headers.
 */
export function OpenTimelineLink({
  userId,
  variant = "inline",
  label = "Open timeline",
  className,
}: {
  userId: string | null | undefined;
  variant?: "inline" | "button";
  label?: string;
  className?: string;
}) {
  if (!userId) return null;
  if (variant === "button") {
    return (
      <Link
        to="/admin/ops/member/$userId"
        params={{ userId }}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-[8px] border border-reps-border bg-reps-panel/40 px-2.5 text-[11px] font-semibold text-white/75 transition hover:border-reps-orange/40 hover:text-white",
          className,
        )}
      >
        <Activity className="h-3.5 w-3.5" />
        {label}
      </Link>
    );
  }
  return (
    <Link
      to="/admin/ops/member/$userId"
      params={{ userId }}
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange hover:underline",
        className,
      )}
    >
      <Activity className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
