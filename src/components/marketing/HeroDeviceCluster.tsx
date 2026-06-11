import { LaptopFrame } from "./LaptopFrame";
import { PhoneFrame } from "./PhoneFrame";
import { ScaledFrame } from "./DeviceMockup";

type Props = {
  /** Route shown inside the laptop iframe. */
  laptopSrc?: string;
  laptopTitle?: string;
  laptopScale?: number;
  /** Route shown inside the floating phone iframe. Pass null to hide the phone. */
  phoneSrc?: string | null;
  phoneTitle?: string;
  phoneScale?: number;
};

/**
 * Hero device cluster: laptop showing a route with a phone showing another
 * route floating bottom-right, framed by a soft orange glow plate.
 * Defaults mirror /for-professionals so existing usage is unchanged.
 */
export function HeroDeviceCluster({
  laptopSrc = "/dashboard",
  laptopTitle = "REPS dashboard preview",
  laptopScale = 0.5,
  phoneSrc = "/portal/today",
  phoneTitle = "REPS client portal preview",
  phoneScale = 0.32,
}: Props = {}) {
  return (
    <div className="relative w-full">
      {/* Backdrop glow plate */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[24px] bg-[radial-gradient(60%_55%_at_50%_40%,rgba(255,122,0,0.22),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[22px] bg-reps-panel/30 ring-1 ring-reps-border/60 shadow-[0_50px_100px_-50px_rgba(0,0,0,0.8)]"
      />

      <LaptopFrame>
        <ScaledFrame src={laptopSrc} scale={laptopScale} title={laptopTitle} />
      </LaptopFrame>

      {phoneSrc && (
        <div className="absolute -bottom-10 right-2 w-[28%] min-w-[150px] max-w-[220px] drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] sm:-bottom-12 sm:right-4 lg:-bottom-16 lg:right-6">
          <PhoneFrame>
            <ScaledFrame src={phoneSrc} scale={phoneScale} title={phoneTitle} />
          </PhoneFrame>
        </div>
      )}
    </div>
  );
}
