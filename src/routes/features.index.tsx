import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { DashboardMockup } from "@/components/mockups/PlatformMockups";
import {
  FEATURES,
  FEATURE_GROUPS,
  AI_FEATURES,
  type FeatureGroupMeta,
} from "@/components/features/feature-config";

export const Route = createFileRoute("/features/")({
  head: () => ({
    meta: [
      { title: "Features — The REPs Platform" },
      {
        name: "description",
        content:
          "Five pillars: visibility, operations, coaching, REPs AI Operating System and growth. Every tool a fitness practice needs, in one place.",
      },
      { property: "og:title", content: "Features — REPs" },
      {
        property: "og:description",
        content: "The full REPs platform — built for fitness pros, not generic SaaS.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/features" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/features" }],
  }),
  component: FeaturesHubPage,
});

const GROUP_ROUTES = {
  visibility: "/features/visibility",
  operations: "/features/operations",
  coaching: "/features/coaching",
  ai: "/features/ai",
  growth: "/features/growth",
} as const;

function FeaturesHubPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-20 text-center lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> The REPs platform
          </span>
          <h1 className="mx-auto mt-5 max-w-[820px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Five pillars.
            <br />
            <span className="text-reps-orange">One operating system.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            Visibility, operations, coaching delivery, REPs AI and growth — every tool a
            modern fitness practice needs, built for fitness pros and wired into one client
            record.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
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

          <div className="mx-auto mt-14 max-w-[1080px]">
            <BrowserFrame>
              <DashboardMockup />
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] space-y-16 px-6 py-20 lg:px-10">
          {FEATURE_GROUPS.map((g) =>
            g.key === "ai" ? (
              <AIPillar key={g.key} group={g} />
            ) : (
              <Pillar key={g.key} group={g} />
            ),
          )}
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <h2 className="font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]">
              Built for fitness pros, not generic SaaS.
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
              Free profile in minutes. Founding pricing locked for life on paid plans — before
              public launch.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Join REPs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/compare"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PillarHeader({ group }: { group: FeatureGroupMeta }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="max-w-[640px]">
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
          <group.icon className="h-3.5 w-3.5" /> {group.label}
        </span>
        <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
          {group.desc}
        </h2>
      </div>
      <Link
        to={GROUP_ROUTES[group.key]}
        className="hidden shrink-0 items-center gap-1 text-[13px] font-semibold text-reps-orange hover:underline md:inline-flex"
      >
        Explore {group.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Pillar({ group }: { group: FeatureGroupMeta }) {
  const items = FEATURES.filter((f) => f.group === group.key);
  if (items.length === 0) return null;
  return (
    <div>
      <PillarHeader group={group} />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
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
  );
}

function AIPillar({ group }: { group: FeatureGroupMeta }) {
  const top = AI_FEATURES.slice(0, 6);
  return (
    <div className="rounded-[24px] border border-reps-orange-border bg-reps-orange-soft p-8 lg:p-10">
      <PillarHeader group={group} />
      <p className="mt-3 max-w-[720px] text-[14.5px] leading-relaxed text-white/80">
        14 AI capabilities — programmes drafted, check-ins read, leads scored, risks flagged,
        next moves ranked. The operating layer behind your whole business.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {top.map((f) => (
          <div
            key={f.slug}
            className="flex h-full flex-col rounded-[16px] border border-reps-border bg-reps-panel p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-display text-[15px] font-bold text-white">{f.label}</h3>
            <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-white/65">
              {f.oneLiner}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Link
          to="/features/ai"
          className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
        >
          See all 14 AI capabilities <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
