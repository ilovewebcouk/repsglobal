import * as React from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Aspect = "video" | "wide" | "square";

const ASPECT: Record<Aspect, string> = {
  video: "aspect-video",
  wide: "aspect-[21/9]",
  square: "aspect-square",
};

export interface MockupPlaceholderProps {
  label: string;
  aspect?: Aspect;
  className?: string;
}

/**
 * Neutral screenshot frame. Reads as "real screenshot dropping in here",
 * not as a fake UI. Same prop shape as before so feature pages keep working.
 */
export function MockupPlaceholder({
  label,
  aspect = "video",
  className,
}: MockupPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/60",
        "shadow-[0_24px_80px_-30px_rgba(0,0,0,0.55)]",
        ASPECT[aspect],
        className,
      )}
      role="img"
      aria-label={`${label} screenshot placeholder`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_0%,rgba(255,122,0,0.10),transparent_60%)]"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <ImageIcon className="h-5 w-5 text-white/30" aria-hidden />
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {label}
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
          Screenshot coming
        </div>
      </div>
    </div>
  );
}
