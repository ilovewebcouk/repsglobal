import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, Sparkles, Zap } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { MockupStage } from "@/components/marketing/MockupStage";
import { ActIntro } from "@/components/marketing/ActIntro";
import { PressMarquee } from "@/components/marketing/PressMarquee";
import { ComparisonStrip } from "@/components/marketing/ComparisonStrip";


import heroGym from "@/assets/for-pros-hero-gym.jpg.asset.json";

import {
  FEATURE_GROUPS,
  type FeatureGroupKey,
  groupBySlug,
} from "./feature-config";

const GROUP_ROUTES = {
  visibility: "/features/visibility",
  shopfront: "/features/shop-front",
  operations: "/features/operations",
  coaching: "/features/coaching",
  ai: "/features/ai",
  growth: "/features/growth",
} as const;

export type PillarFeature = {
  tag: string;
  title: string;
  body: string;
  bullets: string[];
  mockup: React.ReactNode;
  learnMoreSlug?: string;
};

type Props = {
  groupKey: FeatureGroupKey;
  /** Two-line H1. `lead` renders white; `accent` renders in brand orange beneath it. */
  heroLead: string;
  heroAccent: string;
  /** Optional background image for the hero. Defaults to the for-pros gym backdrop. */
  heroImage?: { src: string; alt?: string };
  features: PillarFeature[];
  children?: React.ReactNode;
};


export function PillarPage({
  groupKey,
  heroLead,
  heroAccent,
  heroImage,
  features,
  children,
}: Props) {
  const group = groupBySlug(groupKey);
  const otherGroups = FEATURE_GROUPS.filter((g) => g.key !== groupKey);
  const heroBgSrc = heroImage?.src ?? heroGym.url;
  const heroBgAlt = heroImage?.alt ?? "";

  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* HERO — full-bleed moody backdrop with device cluster (mirrors /for-professionals) */}
      <section className="relative flex overflow-hidden min-h-[640px] lg:min-h-[780px]">
        <img
          src={heroBgSrc}
          alt={heroBgAlt}
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
        />

        {/* Legibility wash — lighter so the subject breathes */}
        <div className="absolute inset-0 bg-reps-ink/55 lg:bg-reps-ink/30" />
        {/* Left-anchored vignette — darkens copy zone, lets right side breathe */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_45%,rgba(10,10,12,0.62),transparent_75%)] lg:bg-[radial-gradient(60%_90%_at_18%_55%,rgba(10,10,12,0.82),transparent_72%)]"
        />
        {/* Brand glow */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.14),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.12),transparent_70%)]"
        />
        {/* Floor seal — smooth resolve into the press marquee */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-reps-ink/65 to-reps-ink lg:h-56 lg:via-reps-ink/70"
        />

        <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-start px-6 pt-24 pb-20 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="max-w-[640px]">
            <span
              className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur"
              style={{ animationDuration: "560ms", animationFillMode: "both" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> {group.hero.eyebrow}
            </span>
            <h1
              className="mt-6 animate-fade-in font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[64px]"
              style={{
                animationDuration: "640ms",
                animationDelay: "80ms",
                animationFillMode: "both",
              }}
            >
              {heroLead}
              <br />
              <span className="text-reps-orange">{heroAccent}</span>
            </h1>
            <p
              className="mt-6 max-w-[540px] animate-fade-in text-[16px] leading-relaxed text-white/75"
              style={{
                animationDuration: "640ms",
                animationDelay: "180ms",
                animationFillMode: "both",
              }}
            >
              {group.hero.sub}
            </p>
            <div
              className="mt-8 flex animate-fade-in flex-wrap gap-3"
              style={{
                animationDuration: "640ms",
                animationDelay: "260ms",
                animationFillMode: "both",
              }}
            >
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Join REPs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/features"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 bg-white/5 px-7 text-[14px] font-semibold text-white shadow-none backdrop-blur hover:bg-white/15"
              >
                Explore features
              </Link>
            </div>
            <ul
              className="mt-7 flex animate-fade-in flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-white/70"
              style={{
                animationDuration: "640ms",
                animationDelay: "340ms",
                animationFillMode: "both",
              }}
            >
              <li className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-reps-orange" />
                Verified credentials
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-reps-orange" />
                10-minute setup
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-reps-orange" />
                Every feature included — no add-ons
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* PRESS MARQUEE — same ink continuum as hero + Act 1 */}
      <PressMarquee />

      {/* ACT INTRO */}
      <section className="border-t border-reps-border/60">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-24">
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
        <div className="mx-auto max-w-[1320px] space-y-24 px-6 py-20 lg:space-y-32 lg:px-10 lg:py-28">
          {features.map((f, i) => (
            <PillarFeatureBlock key={f.tag} feature={f} reverse={i % 2 === 1} />
          ))}
        </div>
      </section>

      {children}

      {/* COMPARISON */}
      <section className="border-t border-reps-border/60">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
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
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <h2 className="font-display text-[24px] font-bold text-white lg:text-[28px]">
            Explore the rest of the platform
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {otherGroups.map((g) => (
              <GroupTile key={g.key} group={g} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-reps-border/60">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
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
