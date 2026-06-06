import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import { DeviceMockup } from "@/components/marketing/DeviceMockup";
import { MockupStage } from "@/components/marketing/MockupStage";

export interface SubFeatureCardProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  mockup: {
    device: "laptop" | "phone";
    src: string;
    title: string;
    scale?: number;
  };
}

/**
 * Rich sub-feature card used inside pillar chapters when a pillar has 4–5
 * capabilities. Renders a small device thumbnail, eyebrow + title, body,
 * 3 bullet sub-points and a "Learn more" link. Designed for a 2×2 grid.
 */
export function SubFeatureCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  bullets,
  ctaLabel,
  ctaHref,
  mockup,
}: SubFeatureCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/60 transition-colors hover:border-reps-orange-border">
      {/* Thumbnail */}
      <div className="relative border-b border-reps-border bg-reps-ink/40 px-6 pt-6">
        <MockupStage variant={mockup.device}>
          <DeviceMockup
            device={mockup.device}
            src={mockup.src}
            title={mockup.title}
            scale={mockup.scale ?? (mockup.device === "laptop" ? 0.32 : 0.26)}
          />
        </MockupStage>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6 lg:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            {eyebrow}
          </span>
        </div>
        <h4 className="mt-4 font-display text-[20px] font-bold leading-tight text-white lg:text-[22px]">
          {title}
        </h4>
        <p className="mt-2 text-[14px] leading-relaxed text-white/65">{body}</p>
        <ul className="mt-4 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[13.5px] text-white/80">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
              {b}
            </li>
          ))}
        </ul>
        <Link
          to={ctaHref}
          className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-reps-orange hover:underline"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
