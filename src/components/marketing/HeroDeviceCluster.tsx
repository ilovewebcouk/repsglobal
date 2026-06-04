import { LaptopFrame } from "./LaptopFrame";
import { PhoneFrame } from "./PhoneFrame";
import { ScaledFrame } from "./DeviceMockup";

/**
 * Hero device cluster: laptop showing /dashboard with a phone showing
 * /portal/today floating bottom-right.
 */
export function HeroDeviceCluster() {
  return (
    <div className="relative w-full">
      <LaptopFrame>
        <ScaledFrame src="/dashboard" scale={0.5} title="REPs dashboard preview" />
      </LaptopFrame>

      <div className="absolute -bottom-10 right-2 w-[26%] min-w-[140px] max-w-[200px] sm:-bottom-12 sm:right-4 lg:-bottom-16 lg:right-6">
        <PhoneFrame>
          <ScaledFrame src="/portal/today" scale={0.32} title="REPs client portal preview" />
        </PhoneFrame>
      </div>
    </div>
  );
}
