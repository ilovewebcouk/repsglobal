import { BadgeCheck, ShieldCheck } from "lucide-react";
import { LaptopFrame } from "./LaptopFrame";
import { PhoneFrame } from "./PhoneFrame";
import { ScaledFrame } from "./DeviceMockup";

/**
 * Hero product showcase for /for-professionals.
 *
 * Composition:
 *   - Laptop (dashboard) centred in its column.
 *   - Floating phone bottom-right.
 *   - Floating "verified credential" pill bottom-left — mirrors the phone
 *     so the cluster reads as a balanced triad, not a collision.
 *
 * Floats sit BELOW the laptop, not on top of it. Negative offsets are
 * kept inside the parent column so nothing bleeds off the page edge.
 */
export function HeroProductShowcase() {
  return (
    <div className="relative w-full pb-20 lg:pb-24">
      {/* Soft backdrop glow — kept inside the cluster bounds */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-full rounded-[24px] bg-[radial-gradient(60%_55%_at_55%_40%,rgba(255,122,0,0.22),transparent_72%)] blur-2xl"
      />

      {/* Laptop */}
      <LaptopFrame>
        <ScaledFrame
          src="/dashboard"
          scale={0.5}
          title="REPs dashboard preview"
        />
      </LaptopFrame>

      {/* Floating credential pill — bottom-left, sits BELOW the laptop edge */}
      <div className="absolute -bottom-2 left-0 hidden items-center gap-3 rounded-[14px] border border-reps-gold/40 bg-reps-panel/95 px-4 py-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur md:flex lg:left-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-reps-gold">
            Verified on REPs
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-white/85">
            <ShieldCheck className="h-3.5 w-3.5 text-reps-gold" />
            Qualified · Insured · CPD
          </div>
        </div>
      </div>

      {/* Floating phone — bottom-right, sits BELOW the laptop edge */}
      <div className="absolute -bottom-4 right-0 hidden w-[26%] min-w-[150px] max-w-[200px] drop-shadow-[0_24px_36px_rgba(0,0,0,0.6)] md:block lg:right-2">
        <PhoneFrame>
          <ScaledFrame
            src="/portal/today"
            scale={0.32}
            title="REPs client portal preview"
          />
        </PhoneFrame>
      </div>
    </div>
  );
}
