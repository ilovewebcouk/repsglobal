import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Star } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { FEATURES, type FeatureLink } from "./feature-config";
import { PLANS } from "@/components/pricing/pricing-data";

export type FeatureSection = {
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
  visual?: React.ReactNode;
};

export type FeatureQuote = {
  quote: string;
  name: string;
  role: string;
  img: string;
};

export type FeaturePageProps = {
  slug: FeatureLink["slug"];
  hero: {
    eyebrow: string;
    title: string;
    sub: string;
    primaryHref?: string;
    visual: React.ReactNode;
  };
  pillars: { title: string; body: string }[];
  sections: FeatureSection[];
  quote: FeatureQuote;
  related: FeatureLink["slug"][];
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  verified: "Verified",
  pro: "Pro",
  business: "Business",
  studio: "Studio",
};

export function FeaturePageLayout(props: FeaturePageProps) {
  const feature = FEATURES.find((f) => f.slug === props.slug)!;
  const related = props.related.map((s) => FEATURES.find((f) => f.slug === s)!).filter(Boolean);

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto grid max-w-[1320px] gap-10 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:px-10 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
              <feature.icon className="h-3.5 w-3.5 text-reps-orange" /> {props.hero.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-[40px] font-bold leading-tight text-white lg:text-[52px]">
              {props.hero.title}
            </h1>
            <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-white/70">
              {props.hero.sub}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>
          <div className="lg:pl-4">
            <BrowserFrame>{props.hero.visual}</BrowserFrame>
          </div>
        </div>
      </section>

      {/* THREE PILLARS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            {props.pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <Check className="h-5 w-5 text-reps-orange" />
                <h3 className="mt-3 font-display text-[18px] font-bold text-white">{p.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/65">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEEP-DIVE SECTIONS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] space-y-20 px-6 py-20 lg:px-10">
          {props.sections.map((s, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={s.title}
                className={`grid gap-10 lg:grid-cols-2 lg:items-center ${
                  reverse ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div>
                  {s.eyebrow && (
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                      {s.eyebrow}
                    </span>
                  )}
                  <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
                    {s.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/70">{s.body}</p>
                  {s.bullets && (
                    <ul className="mt-4 space-y-2">
                      {s.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-[14px] text-white/80"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  {s.visual ? (
                    <BrowserFrame>{s.visual}</BrowserFrame>
                  ) : (
                    <div className="aspect-[4/3] rounded-[22px] border border-reps-border bg-reps-panel" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* QUOTE */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[820px] px-6 py-16 text-center lg:px-10">
          <Star className="mx-auto h-5 w-5 fill-reps-orange text-reps-orange" />
          <p className="mt-4 font-display text-[22px] font-medium leading-snug text-white lg:text-[26px]">
            "{props.quote.quote}"
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <img
              src={props.quote.img}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
            <div className="text-left">
              <div className="text-[14px] font-semibold text-white">{props.quote.name}</div>
              <div className="text-[12px] text-white/55">{props.quote.role}</div>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED + PLAN AVAILABILITY */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-6 py-16 lg:grid-cols-[1.4fr_1fr] lg:px-10">
          <div>
            <h3 className="font-display text-[20px] font-bold text-white">Works with</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/features/$slug"
                  params={{ slug: r.slug }}
                  className="group flex items-start gap-3 rounded-[16px] border border-reps-border bg-reps-panel p-4 transition-colors hover:border-reps-orange-border"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <r.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-white group-hover:text-reps-orange">
                      {r.label}
                    </div>
                    <div className="mt-0.5 text-[12px] text-white/60">{r.oneLiner}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-display text-[20px] font-bold text-white">Included in</h3>
            <ul className="mt-5 space-y-2">
              {PLANS.map((p) => {
                const included = feature.includedIn.includes(
                  p.tierKey as "verified" | "pro" | "studio",
                );
                return (
                  <li
                    key={p.tierKey}
                    className={
                      included
                        ? "flex items-center justify-between rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-4 py-2"
                        : "flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-panel/40 px-4 py-2"
                    }
                  >
                    <span className="text-[13px] font-semibold text-white">
                      {TIER_LABELS[p.tierKey]}
                    </span>
                    {included ? (
                      <Check className="h-4 w-4 text-reps-orange" />
                    ) : (
                      <span className="text-[11px] text-white/40">—</span>
                    )}
                  </li>
                );
              })}
              <li className="flex items-center justify-between rounded-[10px] border border-reps-border bg-reps-panel/40 px-4 py-2">
                <span className="text-[13px] font-semibold text-white">Studio</span>
                {feature.includedIn.includes("studio") ? (
                  <Check className="h-4 w-4 text-reps-orange" />
                ) : (
                  <span className="text-[11px] text-white/40">—</span>
                )}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <Sparkles className="mx-auto h-5 w-5 text-reps-orange" />
            <h2 className="mt-3 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              Try {feature.label.toLowerCase()} on REPS.
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
              Start with Verified or Pro. Founding pricing on Pro locked for life — before public launch.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Join REPS <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                See plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
