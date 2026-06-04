import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { MockupStage } from "@/components/marketing/MockupStage";
import { ActIntro } from "@/components/marketing/ActIntro";
import { PressMarquee } from "@/components/marketing/PressMarquee";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";
import {
  FEATURE_GROUPS,
  type FeatureGroupKey,
  groupBySlug,
} from "./feature-config";

const GROUP_ROUTES = {
  visibility: "/features/visibility",
  operations: "/features/operations",
  coaching: "/features/coaching",
  ai: "/features/ai",
  growth: "/features/growth",
} as const;

export type PillarFeature = {
  /** Eyebrow chip text (e.g. "Bookings"). */
  tag: string;
  /** Big H2 headline for this feature. */
  title: string;
  /** Supporting paragraph. */
  body: string;
  /** Outcome bullets (3–5 ideal). */
  bullets: string[];
  /** Mockup component (already styled — no wrapping needed). */
  mockup: React.ReactNode;
  /** Optional deep-dive link to /features/$slug. */
  learnMoreSlug?: string;
};

type Props = {
  groupKey: FeatureGroupKey;
  /** Lead mockup rendered in the hero. */
  heroMockup: React.ReactNode;
  /** Feature blocks rendered as alternating image/copy rows. */
  features: PillarFeature[];
  /** Optional extra section (e.g. AI assist strip) rendered before comparison. */
  children?: React.ReactNode;
};

export function PillarPage({ groupKey, heroMockup, features, children }: Props) {
  const group = groupBySlug(groupKey);
  const otherGroups = FEATURE_GROUPS.filter((g) => g.key !== groupKey);
  const Icon = group.icon;

  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_0%,rgba(255,122,0,0.12),transparent)]" />
        <div className="relative mx-auto grid max-w-[1240px] gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-10 lg:py-28">
          <div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
              <Icon className="h-3.5 w-3.5 text-reps-orange" />
              {group.hero.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-[44px] font-bold leading-[1.05] text-white lg:text-[60px]">
              {group.hero.title}
            </h1>
            <p className="mt-5 max-w-[540px] text-[17px] leading-relaxed text-white/75">
              {group.hero.sub}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
          </div>
          <div className="lg:pl-2">
            <MockupStage variant="laptop">
              <BrowserFrame>{heroMockup}</BrowserFrame>
            </MockupStage>
          </div>
        </div>
      </section>

      {/* PRESS MARQUEE — bridges hero to feature blocks on the same ink surface */}
      <PressMarquee />

      {/* ACT INTRO */}
      <section className="border-t border-reps-border/60">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10 lg:py-24">
          <ActIntro
            act="Act 1"
            kicker={`Inside ${group.label}`}
            eyebrow={`${features.length} capabilities · one tier`}
            title={group.desc}
            body={`Every feature in your tier is included — no paid add-ons. See exactly what ${group.label} ships with, screen by screen.`}
          />
        </div>
      </section>

      {/* FEATURE BLOCKS */}
      <section className="border-t border-reps-border/60">
        <div className="mx-auto max-w-[1240px] space-y-24 px-6 py-20 lg:space-y-32 lg:px-10 lg:py-28">
          {features.map((f, i) => (
            <PillarFeatureBlock key={f.tag} feature={f} reverse={i % 2 === 1} />
          ))}
        </div>
      </section>

      {children}

      {/* COMPARISON */}
      <section className="border-t border-reps-border/60">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <ActIntro
            act="Act 2"
            kicker="How it stacks up"
            eyebrow="Honest comparison"
            title={`${group.label} vs the rest of the market.`}
            body="Side-by-side against Trainerize, MyPTHub and PT Distinction. Last checked June 2026."
          />
          <div className="mt-10">
            <ComparisonStrip />
          </div>
        </div>
      </section>

      {/* CROSS-LINKS */}
      <section className="border-t border-reps-border/60 bg-reps-panel/20">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <h2 className="font-display text-[24px] font-bold text-white lg:text-[28px]">
            Explore the rest of the platform
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {otherGroups.map((g) => (
              <GroupTile key={g.key} group={g} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-reps-border/60">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
              <Sparkles className="h-3.5 w-3.5" /> Founding pricing — locked for life
            </span>
            <h2 className="mt-5 font-display text-[32px] font-bold leading-tight text-white lg:text-[42px]">
              Built for fitness pros, not generic SaaS.
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[15.5px] text-white/70">
              Start with Verified or Pro. Every feature in your tier is included — no paid add-ons.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Join REPs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/compare"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                Compare platforms
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PillarFeatureBlock({ feature, reverse }: { feature: PillarFeature; reverse: boolean }) {
  return (
    <div
      className={`grid items-center gap-10 lg:gap-16 ${
        reverse ? "lg:grid-cols-[1.1fr_0.9fr]" : "lg:grid-cols-[0.9fr_1.1fr]"
      }`}
    >
      <div className={reverse ? "lg:order-2" : ""}>
        <span className="inline-flex w-fit items-center rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
          {feature.tag}
        </span>
        <h3 className="mt-4 font-display text-[30px] font-bold leading-[1.1] text-white lg:text-[40px]">
          {feature.title}
        </h3>
        <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-white/70">
          {feature.body}
        </p>
        <ul className="mt-6 space-y-3">
          {feature.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
              {b}
            </li>
          ))}
        </ul>
        {feature.learnMoreSlug && (
          <Link
            to="/features/$slug"
            params={{ slug: feature.learnMoreSlug }}
            className="mt-6 inline-flex items-center gap-1 text-[14px] font-semibold text-reps-orange hover:underline"
          >
            Learn more about {feature.tag.toLowerCase()} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <MockupStage variant="laptop">
          <BrowserFrame>{feature.mockup}</BrowserFrame>
        </MockupStage>
      </div>
    </div>
  );
}

function GroupTile({ group }: { group: (typeof FEATURE_GROUPS)[number] }) {
  const Icon = group.icon;
  return (
    <Link
      to={GROUP_ROUTES[group.key]}
      className="group flex h-full flex-col rounded-[18px] border border-reps-border bg-reps-panel p-5 transition-colors hover:border-reps-orange-border"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 font-display text-[16px] font-bold text-white group-hover:text-reps-orange">
        {group.label}
      </h3>
      <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-white/60">
        {group.desc}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-reps-orange">
        Explore <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}
