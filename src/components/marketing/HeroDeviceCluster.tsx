import { LaptopFrame } from "./LaptopFrame";
import { PhoneFrame } from "./PhoneFrame";

/**
 * Hero device cluster: laptop showing /dashboard with a phone showing
 * /portal/today floating bottom-right. Iframes are non-interactive and
 * scaled with CSS transform so the real app content fills the frames.
 */
export function HeroDeviceCluster() {
  return (
    <div className="relative w-full">
      <LaptopFrame>
        <ScaledFrame src="/dashboard" scale={0.5} title="REPs dashboard preview" />
      </LaptopFrame>

      {/* Floating phone */}
      <div className="absolute -bottom-10 right-2 w-[26%] min-w-[140px] max-w-[200px] sm:-bottom-12 sm:right-4 lg:-bottom-16 lg:right-6">
        <PhoneFrame>
          <ScaledFrame src="/portal/today" scale={0.32} title="REPs client portal preview" />
        </PhoneFrame>
      </div>
    </div>
  );
}

function ScaledFrame({ src, scale, title }: { src: string; scale: number; title: string }) {
  // The inner iframe is rendered larger and scaled down so a desktop-width
  // app view fits cleanly inside the device viewport.
  const inversePct = `${100 / scale}%`;
  return (
    <div className="absolute inset-0">
      <iframe
        src={src}
        title={title}
        aria-hidden
        tabIndex={-1}
        loading="lazy"
        scrolling="no"
        className="pointer-events-none origin-top-left border-0"
        style={{
          width: inversePct,
          height: inversePct,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
