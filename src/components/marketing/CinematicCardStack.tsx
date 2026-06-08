import * as React from "react";
import { BadgeCheck } from "lucide-react";

import { ScaledFrame } from "./DeviceMockup";

/**
 * Shared cinematic 50/50 composition: a cinematic photo with 2–3 floating
 * dashboard / stat cards anchored to preset slots. Used inside `PillarPage`
 * via the `{ kind: 'cinematic', ... }` feature mockup variant.
 *
 * Preset slots — never use free coordinates. Keeps every pillar page consistent.
 */
export type CinematicCardPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center-right";

export type FloatingCard =
  | { kind: "iframe"; src: string; title: string; scale?: number; width?: number }
  | { kind: "stat"; label: string; value: string; delta?: string; icon?: React.ComponentType<{ className?: string }> }
  | { kind: "node"; node: React.ReactNode };

export type PositionedFloatingCard = FloatingCard & { position: CinematicCardPosition };

export interface CinematicCardStackProps {
  image: { src: string; alt: string };
  cards: PositionedFloatingCard[];
  /** Brand-orange radial glow strength (0–1). Defaults to 0.22. */
  glow?: number;
  /** Optional class on the outer wrapper. */
  className?: string;
}

const POSITION_CLASSES: Record<CinematicCardPosition, string> = {
  "top-left": "top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8",
  "top-right": "top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8",
  "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8",
  "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8",
  "center-right": "top-1/2 right-4 -translate-y-1/2 sm:right-6 lg:right-8",
};

const STAGGER_DELAYS = ["80ms", "160ms", "240ms"];

export function CinematicCardStack({
  image,
  cards,
  glow = 0.22,
  className,
}: CinematicCardStackProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[22px] border border-reps-border bg-reps-ink aspect-[4/5] lg:aspect-[5/4] ${className ?? ""}`}
    >
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Legibility wash + brand glow */}
      <div aria-hidden className="absolute inset-0 bg-reps-ink/35" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 55% at 50% 40%, rgba(255,122,0,${glow}), transparent 70%)`,
        }}
      />

      {cards.slice(0, 3).map((card, i) => (
        <div
          key={`${card.position}-${i}`}
          className={`absolute ${POSITION_CLASSES[card.position]} animate-fade-in`}
          style={{ animationDuration: "560ms", animationDelay: STAGGER_DELAYS[i], animationFillMode: "both" }}
        >
          <FloatingCardShell>
            <FloatingCardBody card={card} />
          </FloatingCardShell>
        </div>
      ))}
    </div>
  );
}

function FloatingCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-reps-border bg-reps-panel/85 backdrop-blur-md shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
      {children}
    </div>
  );
}

function FloatingCardBody({ card }: { card: FloatingCard }) {
  if (card.kind === "stat") {
    const Icon = card.icon ?? BadgeCheck;
    return (
      <div className="flex items-start gap-3 p-4 w-[200px]">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-reps-orange">
            {card.label}
          </p>
          <p className="mt-1 font-display text-[24px] font-bold leading-none text-white">
            {card.value}
          </p>
          {card.delta && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-300">
              {card.delta}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (card.kind === "iframe") {
    const width = card.width ?? 220;
    const scale = card.scale ?? 0.45;
    const height = Math.round(width * 0.66);
    return (
      <div className="overflow-hidden rounded-[16px]" style={{ width, height }}>
        <div className="relative h-full w-full">
          <ScaledFrame src={card.src} scale={scale} title={card.title} />
        </div>
      </div>
    );
  }

  return <div className="p-4 w-[220px]">{card.node}</div>;
}
