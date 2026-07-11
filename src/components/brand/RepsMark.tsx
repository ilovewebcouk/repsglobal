import { cn } from "@/lib/utils";
import markLight from "@/assets/brand/logo-mark.svg";
import markDark from "@/assets/brand/logo-mark-dark.svg";

type RepsMarkProps = {
  className?: string;
  /** Use dark artwork for light backgrounds. Defaults to light (white) for dark UI. */
  variant?: "light" | "dark";
  title?: string;
};

/**
 * REPS icon-only mark — the three peaks, no letters. Use for badge titles,
 * list bullets, award icons, and other spots where a compact ~1.44:1 mark
 * reads better than the wordmark. Native aspect ratio ~99 × 69.
 * Size by setting a height class (e.g. `h-4`, `h-5`).
 */
export function RepsMark({ className, variant = "light", title = "REPS" }: RepsMarkProps) {
  return (
    <img
      src={variant === "dark" ? markDark : markLight}
      alt={title}
      className={cn("h-5 w-auto select-none", className)}
      draggable={false}
    />
  );
}
