import type { LucideIcon } from "lucide-react";
import { BadgeCheck } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

export interface VerifyStep {
  icon: LucideIcon;
  title: string;
  body: string;
}

interface VerifyStepsProps {
  eyebrow: string;
  heading: React.ReactNode;
  steps: VerifyStep[];
  bannerText: React.ReactNode;
}

/**
 * Canonical 3-step verification strip.
 * Verbatim extract of /specialisms VerifyStrip: numbered Step 1/2/3 cards
 * + orange-soft accent banner closer.
 */
export function VerifySteps({
  eyebrow,
  heading,
  steps,
  bannerText,
}: VerifyStepsProps) {
  return (
    <section className="border-b border-reps-border bg-reps-ink">
      <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
        <SectionHeader eyebrow={eyebrow} heading={heading} />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-[18px] font-bold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-[18px] border border-reps-orange-border bg-reps-orange-soft px-5 py-4">
          <BadgeCheck className="h-5 w-5 text-reps-orange" />
          <span className="text-[14px] font-semibold text-white">
            {bannerText}
          </span>
        </div>
      </div>
    </section>
  );
}
