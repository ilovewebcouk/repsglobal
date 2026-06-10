import { Link } from "@tanstack/react-router";
import { ArrowRight, Star, type LucideIcon } from "lucide-react";

type CtaLink = { to: string; label: string };

type Eyebrow = { icon?: LucideIcon; label: string };

type FinalCtaProps = {
  /**
   * Pill above the headline. Defaults to "Founder pricing — stays while you stay".
   * Pass `null` to hide the pill entirely.
   */
  eyebrow?: Eyebrow | null;
  heading: string;
  /** Optional accent fragment rendered inline after `heading`, in brand orange. */
  headingAccent?: string;
  lede?: string;
  primary: CtaLink;
  secondary?: CtaLink;
};

const DEFAULT_EYEBROW: Eyebrow = {
  icon: Star,
  label: "Founder pricing — stays while you stay",
};

/**
 * Shared end-of-page CTA. Canonical visual shell — do not rebuild per route.
 * Pass copy via props; the panel, radius, glow, pill and buttons are fixed.
 */
export function FinalCta({
  eyebrow = DEFAULT_EYEBROW,
  heading,
  headingAccent,
  lede,
  primary,
  secondary,
}: FinalCtaProps) {
  const EyebrowIcon = eyebrow?.icon;

  return (
    <section>
      <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-28">
        <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel to-reps-ink p-10 text-center lg:p-16">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,122,0,0.18),transparent_70%)]"
          />
          <div className="relative">
            {eyebrow ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                {EyebrowIcon ? (
                  <EyebrowIcon className="h-3 w-3 fill-reps-orange" />
                ) : null}
                {eyebrow.label}
              </span>
            ) : null}
            <h2 className="mt-5 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
              {heading}
              {headingAccent ? (
                <>
                  <br />
                  <span className="text-reps-orange">{headingAccent}</span>
                </>
              ) : null}
            </h2>
            {lede ? (
              <p className="mx-auto mt-3 max-w-[540px] text-[15px] text-white/70">
                {lede}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to={primary.to}
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                {primary.label} <ArrowRight className="h-4 w-4" />
              </Link>
              {secondary ? (
                <Link
                  to={secondary.to}
                  className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
                >
                  {secondary.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
