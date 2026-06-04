import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { PressMarquee } from "@/components/marketing/PressMarquee";
import {
  FEATURES,
  FEATURE_GROUPS,
  type FeatureGroupKey,
  groupBySlug,
} from "./feature-config";

type Props = {
  groupKey: FeatureGroupKey;
  /** Static mock-up rendered inside a BrowserFrame in the hero. Ignored when `heroImage` is provided. */
  visual?: React.ReactNode;
  /**
   * Optional photo-backed hero (matches `/features/operations`). When provided, the
   * mockup hero is replaced with a full-bleed photograph plus white/orange split H1.
   */
  heroImage?: { src: string; alt?: string };
  /** Two-line H1 lead (white). Required when `heroImage` is set. */
  heroLead?: string;
  /** Two-line H1 accent (orange). Required when `heroImage` is set. */
  heroAccent?: string;
  /** Optional extra content rendered between the feature grid and the CTA. */
  children?: React.ReactNode;
};

export function FeatureGroupLayout({
  groupKey,
  visual,
  heroImage,
  heroLead,
  heroAccent,
  children,
}: Props) {
  const group = groupBySlug(groupKey);
  const features = FEATURES.filter((f) => f.group === groupKey);
  const otherGroups = FEATURE_GROUPS.filter((g) => g.key !== groupKey);

  return (
    <div className="min-h-screen overflow-x-clip bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* HERO */}
      {heroImage && heroLead && heroAccent ? (
        <section className="relative flex overflow-hidden min-h-[640px] lg:min-h-[780px]">
          <img
            src={heroImage.src}
            alt={heroImage.alt ?? ""}
            width={1920}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover object-center lg:object-right"
          />
          {/* Legibility wash */}
          <div className="absolute inset-0 bg-reps-ink/55 lg:bg-reps-ink/30" />
          {/* Left-anchored vignette */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(95%_75%_at_50%_45%,rgba(10,10,12,0.62),transparent_75%)] lg:bg-[radial-gradient(60%_90%_at_18%_55%,rgba(10,10,12,0.82),transparent_72%)]"
          />
          {/* Brand glow */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(60%_50%_at_50%_15%,rgba(255,122,0,0.14),transparent_72%)] lg:bg-[radial-gradient(40%_45%_at_15%_20%,rgba(255,122,0,0.12),transparent_70%)]"
          />
          {/* Floor seal */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-reps-ink/65 to-reps-ink lg:h-56 lg:via-reps-ink/70"
          />

          <div className="relative mx-auto flex w-full max-w-[1320px] flex-col justify-center px-6 py-20 lg:px-10 lg:py-24">
            <div className="max-w-[640px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> {group.hero.eyebrow}
              </span>
              <h1 className="mt-6 font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[44px] lg:text-[64px]">
                {heroLead}
                <br />
                <span className="text-reps-orange">{heroAccent}</span>
              </h1>
              <p className="mt-6 max-w-[540px] text-[16px] leading-relaxed text-white/75">
                {group.hero.sub}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
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
            </div>
          </div>
        </section>
      ) : null}

      {/* PRESS MARQUEE — only when running the photo-hero variant */}
      {heroImage && heroLead && heroAccent && <PressMarquee />}

      {!(heroImage && heroLead && heroAccent) && (
        <section className="relative overflow-hidden border-b border-reps-border">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
          <div className="relative mx-auto grid max-w-[1320px] gap-10 px-6 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:px-10 lg:py-24">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
                <group.icon className="h-3.5 w-3.5 text-reps-orange" />
                {group.hero.eyebrow}
              </span>
              <h1 className="mt-5 font-display text-[40px] font-bold leading-tight text-white lg:text-[52px]">
                {group.hero.title}
              </h1>
              <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-white/70">
                {group.hero.sub}
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
              <BrowserFrame>{visual}</BrowserFrame>
            </div>
          </div>
        </section>
      )}

      {/* FEATURE GRID */}
      {features.length > 0 && (
        <section className="border-b border-reps-border">
          <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
            <div className="max-w-[620px]">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
                What's inside {group.label}
              </span>
              <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
                {group.desc}
              </h2>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Link
                  key={f.slug}
                  to="/features/$slug"
                  params={{ slug: f.slug }}
                  className="group flex h-full flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6 transition-colors hover:border-reps-orange-border"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-[18px] font-bold text-white group-hover:text-reps-orange">
                    {f.label}
                  </h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-white/65">
                    {f.oneLiner}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {children}

      {/* CROSS-LINKS */}
      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <h2 className="font-display text-[22px] font-bold text-white">
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
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
              <Sparkles className="h-3.5 w-3.5" /> Founding pricing — locked for life
            </span>
            <h2 className="mt-5 font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              Built for fitness pros, not generic SaaS.
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
              Start with Verified or Pro. Founding pricing on Pro locked for life — before public launch.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Join REPs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/compare"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
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

/** Small shared card used by the AI deep-dive narrative section. */
export function AINarrativeCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[18px] border border-reps-orange-border bg-reps-orange-soft p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-reps-orange/20 text-reps-orange">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-[17px] font-bold text-white">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/80">{body}</p>
      <Check className="mt-3 h-4 w-4 text-reps-orange" />
    </div>
  );
}

const GROUP_ROUTES = {
  visibility: "/features/visibility",
  operations: "/features/operations",
  coaching: "/features/coaching",
  ai: "/features/ai",
  growth: "/features/growth",
} as const;

function GroupTile({
  group,
}: {
  group: (typeof FEATURE_GROUPS)[number];
}) {
  return (
    <Link
      to={GROUP_ROUTES[group.key]}
      className="group flex h-full flex-col rounded-[18px] border border-reps-border bg-reps-panel p-5 transition-colors hover:border-reps-orange-border"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
        <group.icon className="h-5 w-5" />
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
