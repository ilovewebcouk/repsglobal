import * as React from "react";
import { BadgeCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ScaledFrame } from "./DeviceMockup";

/**
 * Trainer-to-Platform Composite (a.k.a. "Cinematic Product Composite").
 *
 * A cinematic trainer/coach photo with real REPs UI cards expanding out of the
 * scene — devices and stat tiles emanating from the subject with proper depth.
 * Three locked compositions only; never invent free coordinates per page.
 *
 * Built on shadcn `Card` + existing `ScaledFrame` device mockups. Uses brand
 * tokens (no new colors), 16px float-card radius, 22px outer radius.
 */
export type CompositeStat = {
  label: string;
  value: string;
  delta?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export type CompositeDevice = {
  kind: "laptop" | "phone";
  src: string;
  title: string;
};

export type TrainerToPlatformCompositeProps = {
  image: { src: string; alt: string };
  /** Locked compositions — pick one. Defaults to `card-trail`. */
  composition?: "card-trail" | "device-and-stats" | "single-hero";
  /** Required for `device-and-stats` and `single-hero`. */
  device?: CompositeDevice;
  /**
   * `card-trail`: provide 2 stats (overlay near shoulder + lower-right).
   * `device-and-stats`: provide 1 stat (floats top-left).
   * `single-hero`: ignored.
   */
  stats?: CompositeStat[];
  /** Brand-orange radial glow strength (0–1). Defaults to 0.22. */
  glow?: number;
  className?: string;
};

const STAGGER = ["80ms", "180ms", "280ms"];

export function TrainerToPlatformComposite({
  image,
  composition = "card-trail",
  device,
  stats = [],
  glow = 0.22,
  className,
}: TrainerToPlatformCompositeProps) {
  return (
    <div
      className={`relative w-full aspect-[4/5] lg:aspect-[5/4] overflow-hidden rounded-[22px] border border-reps-border bg-reps-ink ${className ?? ""}`}
    >
      {/* Cinematic photo */}
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Legibility wash */}
      <div aria-hidden className="absolute inset-0 bg-reps-ink/35" />

      {/* Ray-from-subject brand glow (the "expanding from the scene" effect) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 50% at 35% 45%, rgba(255,122,0,${glow}), transparent 70%)`,
        }}
      />

      {composition === "card-trail" && <CardTrail stats={stats} />}
      {composition === "device-and-stats" && (
        <DeviceAndStats device={device} stat={stats[0]} />
      )}
      {composition === "single-hero" && <SingleHero device={device} />}
    </div>
  );
}

/* ---------------- compositions ---------------- */

function CardTrail({ stats }: { stats: CompositeStat[] }) {
  const [s1, s2] = stats;
  return (
    <>
      {s1 && (
        <FloatLayer
          // Overlaps subject's shoulder — small, intimate
          className="top-[14%] right-[8%] w-[230px] -rotate-[2deg]"
          delay={STAGGER[0]}
        >
          <StatCard {...s1} compact />
        </FloatLayer>
      )}
      {s2 && (
        <FloatLayer
          // Trails out and down — larger, anchors the eye
          className="bottom-[8%] right-[14%] w-[280px] rotate-[1.5deg]"
          delay={STAGGER[1]}
        >
          <StatCard {...s2} />
        </FloatLayer>
      )}
    </>
  );
}

function DeviceAndStats({
  device,
  stat,
}: {
  device?: CompositeDevice;
  stat?: CompositeStat;
}) {
  return (
    <>
      {device && (
        <FloatLayer
          className={
            device.kind === "phone"
              ? "bottom-[6%] right-[8%] w-[180px]"
              : "bottom-[8%] right-[6%] w-[58%] max-w-[360px]"
          }
          delay={STAGGER[1]}
        >
          <DeviceCard device={device} />
        </FloatLayer>
      )}
      {stat && (
        <FloatLayer
          className="top-[10%] left-[8%] w-[230px] -rotate-[1.5deg]"
          delay={STAGGER[0]}
        >
          <StatCard {...stat} compact />
        </FloatLayer>
      )}
    </>
  );
}

function SingleHero({ device }: { device?: CompositeDevice }) {
  if (!device) return null;
  return (
    <FloatLayer
      className={
        device.kind === "phone"
          ? "top-1/2 right-[8%] w-[200px] -translate-y-1/2"
          : "top-1/2 right-[6%] w-[62%] max-w-[440px] -translate-y-1/2"
      }
      delay={STAGGER[0]}
    >
      <DeviceCard device={device} />
    </FloatLayer>
  );
}

/* ---------------- atoms ---------------- */

function FloatLayer({
  className,
  delay,
  children,
}: {
  className: string;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute animate-fade-in ${className}`}
      style={{ animationDuration: "640ms", animationDelay: delay, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon = BadgeCheck,
  compact,
}: CompositeStat & { compact?: boolean }) {
  return (
    <Card className="flex items-start gap-3 rounded-[16px] border-reps-border bg-reps-panel/90 p-4 ring-1 ring-white/5 backdrop-blur-md shadow-[0_30px_60px_-25px_rgba(0,0,0,0.75)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
          {label}
        </p>
        <p
          className={`mt-1 font-display font-bold leading-none text-white ${
            compact ? "text-[22px]" : "text-[26px]"
          }`}
        >
          {value}
        </p>
        {delta && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-300">
            {delta}
          </p>
        )}
      </div>
    </Card>
  );
}

function DeviceCard({ device }: { device: CompositeDevice }) {
  if (device.kind === "phone") {
    return (
      <div className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-ink ring-1 ring-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]">
        <div className="relative aspect-[9/19]">
          <ScaledFrame src={device.src} scale={0.45} title={device.title} />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-[16px] border border-reps-border bg-reps-ink ring-1 ring-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]">
      <div className="relative aspect-[16/10]">
        <ScaledFrame src={device.src} scale={0.55} title={device.title} />
      </div>
    </div>
  );
}
