import { cn } from "@/lib/utils";
import wordmarkLight from "@/assets/brand/logo-wordmark.svg";
import wordmarkDark from "@/assets/brand/logo-wordmark-dark.svg";

type RepsWordmarkProps = {
  className?: string;
  /** Use dark artwork for light backgrounds. Defaults to light (white) for dark UI. */
  variant?: "light" | "dark";
  title?: string;
};

/**
 * REPS wordmark — the "REPS" letters + minimal peaks, no tagline.
 * Use for tight/compact spots. Native aspect ratio ~4.61:1 (300 × 65).
 * Size by setting a height class (e.g. `h-5`).
 */
export function RepsWordmark({ className, variant = "light", title = "REPS" }: RepsWordmarkProps) {
  return (
    <img
      src={variant === "dark" ? wordmarkDark : wordmarkLight}
      alt={title}
      className={cn("h-5 w-auto select-none", className)}
      draggable={false}
    />
  );
}
