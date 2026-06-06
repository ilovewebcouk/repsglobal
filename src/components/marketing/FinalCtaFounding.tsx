import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Star } from "lucide-react";

export function FinalCtaFounding() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-reps-border bg-gradient-to-br from-reps-panel via-reps-panel/80 to-reps-ink p-10 lg:p-16">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(55%_60%_at_30%_0%,rgba(255,122,0,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(45%_55%_at_85%_100%,rgba(255,122,0,0.12),transparent_70%)]"
      />
      <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange">
            <Sparkles className="h-3 w-3" /> Founding Pro · locked for life
          </span>
          <h2 className="mt-5 font-display text-[36px] font-bold leading-[1.05] text-white lg:text-[52px]">
            £59 a month, forever.
            <br />
            <span className="text-reps-orange">Before public launch.</span>
          </h2>
          <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-white/70">
            Founding pricing on Pro is locked for the lifetime of your subscription —
            available only to a limited number of professionals before public launch.
            Every feature in your tier is included. No paid add-ons.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Claim founding pricing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See pricing
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-white/60">
            <li className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" /> 30-day free trial on Pro
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" /> No setup fees
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" /> Cancel anytime
            </li>
          </ul>
        </div>

        <figure className="relative">
          <div className="rounded-[22px] border border-reps-border bg-reps-ink/70 p-6 backdrop-blur lg:p-7">
            <div className="flex items-center gap-1 text-reps-orange">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-reps-orange" />
              ))}
            </div>
            <blockquote className="mt-3 font-display text-[19px] font-semibold leading-snug text-white lg:text-[22px]">
              "I cancelled four subscriptions in a week. My clients think the app is mine."
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3 border-t border-reps-border pt-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-reps-orange-soft font-display text-[13px] font-bold text-reps-orange">
                JC
              </span>
              <div>
                <div className="text-[13px] font-semibold text-white">James Carter</div>
                <div className="text-[11.5px] text-white/55">Personal Trainer · 6 years on REPs</div>
              </div>
            </figcaption>
          </div>
        </figure>
      </div>
    </div>
  );
}
