import { BadgeCheck } from "lucide-react";

/**
 * Floating, scaled mock of the live /c/james-wilson Pro shop-front.
 * Used on /auth (and any future auth surfaces) as the "10/10 image" —
 * real product proof, not a stock photo.
 *
 * Implementation note: uses an iframe of the live route for now (matches
 * the existing /features/* iframe convention). Migration to a static
 * screenshot is tracked alongside the other iframe→PNG follow-ups.
 */
export function ShopFrontMock({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Soft outer glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklab, var(--reps-orange) 18%, transparent) 0%, transparent 65%)",
        }}
      />

      {/* Floating browser-style frame */}
      <div
        className="relative overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel shadow-[0_40px_120px_-20px_rgba(0,0,0,0.65)]"
        style={{ transform: "perspective(1800px) rotateY(-4deg) rotateX(2deg)" }}
      >
        {/* Faux browser chrome */}
        <div className="flex items-center gap-2 border-b border-reps-border/70 bg-reps-panel/80 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="ml-3 flex h-6 flex-1 items-center gap-1.5 rounded-[6px] bg-white/5 px-2.5 text-[11px] text-white/55">
            <span className="text-white/35">reps.com</span>
            <span>/c/james-wilson</span>
          </div>
        </div>

        {/* Live shop-front via iframe */}
        <div className="relative h-[640px] w-full overflow-hidden bg-reps-ink">
          <iframe
            src="/c/james-wilson"
            title="REPs Pro shop-front preview"
            loading="lazy"
            className="pointer-events-none absolute left-0 top-0 origin-top-left"
            style={{
              width: "1440px",
              height: "1700px",
              transform: "scale(0.58)",
              border: 0,
            }}
          />
          {/* Bottom fade-to-bg so the long page tapers gracefully */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--reps-ink) 90%)",
            }}
          />
        </div>
      </div>

      {/* Floating "Verified" badge — anchors the product proof */}
      <div
        className="absolute -left-6 top-10 flex items-center gap-2.5 rounded-[14px] border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-2.5 text-[12px] font-semibold text-emerald-200 shadow-[0_14px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md"
        style={{ transform: "rotate(-2deg)" }}
      >
        <BadgeCheck className="h-4 w-4" />
        Verified Pro · James Wilson
      </div>

      {/* Floating outcome stat */}
      <div
        className="absolute -right-4 bottom-16 rounded-[14px] border border-reps-border bg-reps-panel/95 px-4 py-3 text-left shadow-[0_14px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md"
        style={{ transform: "rotate(1.5deg)" }}
      >
        <div className="text-[11px] uppercase tracking-wider text-white/55">
          This month
        </div>
        <div className="mt-0.5 font-display text-[22px] font-bold leading-none text-white">
          12 enquiries
        </div>
        <div className="mt-1 text-[11px] text-emerald-300">
          +4 vs last month
        </div>
      </div>
    </div>
  );
}
