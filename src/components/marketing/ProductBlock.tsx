import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { MockupPlaceholder } from "@/components/mockups/MockupPlaceholder";
import type { FeatureLink } from "@/components/features/feature-config";

export interface ProductBlockProps {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  imageLabel: string;
  ctaLabel: string;
  ctaSlug: FeatureLink["slug"];
  reverse?: boolean;
}

export function ProductBlock({
  eyebrow,
  title,
  body,
  bullets,
  imageLabel,
  ctaLabel,
  ctaSlug,
  reverse,
}: ProductBlockProps) {
  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14 ${
        reverse ? "lg:[&>div:first-child]:order-2" : ""
      }`}
    >
      <MockupPlaceholder label={imageLabel} />
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
          {eyebrow}
        </span>
        <h3 className="mt-2 font-display text-[26px] font-bold leading-tight text-white lg:text-[32px]">
          {title}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-white/70">{body}</p>
        <ul className="mt-4 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[14px] text-white/80">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
              {b}
            </li>
          ))}
        </ul>
        <Link
          to="/features/$slug"
          params={{ slug: ctaSlug }}
          className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-reps-orange hover:underline"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
