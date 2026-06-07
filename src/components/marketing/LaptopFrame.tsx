import { ReactNode } from "react";

/**
 * macOS-style laptop frame for hero device clusters. Children render at
 * fixed inner dimensions; consumer scales whatever goes inside.
 */
export function LaptopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full max-w-full overflow-hidden">
      {/* Screen */}
      <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-reps-panel shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
        {/* Top bar */}
        <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-reps-ink/80 px-3">
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
          <span className="ml-3 text-[10px] font-medium text-white/40">REPs</span>
        </div>
        {/* Viewport */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-reps-ink">
          {children}
        </div>
      </div>
      {/* Base */}
      <div className="relative mx-auto h-2 w-[106%] -translate-x-[3%] rounded-b-[10px] bg-gradient-to-b from-white/15 to-white/5" />
      <div className="mx-auto h-1 w-[88%] rounded-b-[8px] bg-black/40" />
    </div>
  );
}

