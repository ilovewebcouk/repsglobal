import { cn } from "@/lib/utils";
import lockupLight from "@/assets/brand/logo-lockup.svg";
import lockupDark from "@/assets/brand/logo-lockup-dark.svg";

type RepsLockupProps = {
  className?: string;
  /** Use dark artwork for light backgrounds (e.g. printed certificates). Defaults to light (white) for dark UI. */
  variant?: "light" | "dark";
  title?: string;
};

/**
 * Full REPS lock-up — wordmark + "The Register of Exercise Professionals" tagline.
 * Use on marketing chrome (nav, footer, auth shell). For tight/small spots,
 * prefer `<RepsWordmark />` (compact wordmark only).
 *
 * Native aspect ratio ~3.19:1. Size by setting a height class (e.g. `h-11`).
 */
export function RepsLockup({ className, variant = "light", title = "REPS — The Register of Exercise Professionals" }: RepsLockupProps) {
  return (
    <img
      src={variant === "dark" ? lockupDark : lockupLight}
      alt={title}
      className={cn("h-10 w-auto select-none", className)}
      draggable={false}
    />
  );
}
