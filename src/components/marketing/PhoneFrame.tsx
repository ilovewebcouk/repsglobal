import { ReactNode } from "react";

/** iPhone-style frame for hero device clusters. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-white/15 bg-black p-1.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[18px] bg-reps-ink">
        {/* Notch */}
        <div className="absolute left-1/2 top-1.5 z-10 h-3 w-14 -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}
