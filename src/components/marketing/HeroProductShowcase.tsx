import { BadgeCheck, ShieldCheck, GraduationCap } from "lucide-react";
import { LaptopFrame } from "./LaptopFrame";
import { PhoneFrame } from "./PhoneFrame";
import { ScaledFrame } from "./DeviceMockup";

/**
 * Hero product showcase for /for-professionals.
 *
 * Three layered elements, art-directed:
 *   1. Larger laptop showing the dashboard
 *   2. Floating phone (bottom-right) showing the client portal
 *   3. Floating "verified credential" card (top-left) that sells the
 *      heritage claim visually so the headline isn't carrying it alone
 *
 * NOTE: iframes here are placeholders for bespoke product stills. The
 * markup is intentionally swap-ready — replace ScaledFrame with <img>
 * tags pointing at .asset.json stills when those are generated.
 */
export function HeroProductShowcase() {
  return (
    <div className="relative w-full">
      {/* Backdrop glow + plate */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[24px] bg-[radial-gradient(65%_60%_at_55%_40%,rgba(255,122,0,0.28),transparent_72%)] blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[22px] bg-reps-panel/30 ring-1 ring-reps-border/60 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.85)]"
      />

      {/* Laptop — bumped scale for hero weight */}
      <LaptopFrame>
        <ScaledFrame
          src="/dashboard"
          scale={0.56}
          title="REPs dashboard preview"
        />
      </LaptopFrame>

      {/* Floating phone — bottom right */}
      <div className="absolute -bottom-12 right-2 w-[30%] min-w-[160px] max-w-[230px] drop-shadow-[0_24px_36px_rgba(0,0,0,0.6)] sm:-bottom-14 sm:right-4 lg:-bottom-16 lg:right-6">
        <PhoneFrame>
          <ScaledFrame
            src="/portal/today"
            scale={0.34}
            title="REPs client portal preview"
          />
        </PhoneFrame>
      </div>

      {/* Floating credential card — top left. Sells the heritage claim visually. */}
      <div className="absolute -left-3 -top-4 hidden w-[210px] rounded-[14px] border border-reps-gold/40 bg-reps-panel/95 p-3.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur md:block lg:-left-6 lg:-top-6 lg:w-[230px]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
            <BadgeCheck className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-reps-gold">
              Verified on REPs
            </div>
            <div className="truncate font-display text-[13px] font-bold text-white">
              Since 2009
            </div>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 text-[11.5px] text-white/75">
          <li className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-reps-gold" />
            Qualifications verified
          </li>
          <li className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-reps-gold" />
            Insured · CPD current
          </li>
        </ul>
      </div>
    </div>
  );
}
