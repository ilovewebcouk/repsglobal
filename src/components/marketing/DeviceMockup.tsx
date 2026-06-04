import { LaptopFrame } from "./LaptopFrame";
import { PhoneFrame } from "./PhoneFrame";

export interface DeviceMockupProps {
  device: "laptop" | "phone";
  src: string;
  title: string;
  scale?: number;
  className?: string;
}

/**
 * Renders an existing app route inside a laptop or phone frame, scaled down
 * so a desktop-width view fits inside the device viewport. Iframes are
 * non-interactive and lazy-loaded.
 */
export function DeviceMockup({ device, src, title, scale, className }: DeviceMockupProps) {
  const effectiveScale = scale ?? (device === "laptop" ? 0.5 : 0.34);
  const Frame = device === "laptop" ? LaptopFrame : PhoneFrame;
  return (
    <div className={className}>
      <Frame>
        <ScaledFrame src={src} scale={effectiveScale} title={title} />
      </Frame>
    </div>
  );
}

export function ScaledFrame({
  src,
  scale,
  title,
}: {
  src: string;
  scale: number;
  title: string;
}) {
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
