import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { BrowserFrame } from "@/components/mockups/BrowserFrame";
import { DashboardMockup } from "@/components/mockups/PlatformMockups";
import {
  FEATURES,
  FEATURE_GROUPS,
  type FeatureGroupKey,
} from "@/components/features/feature-config";

export const Route = createFileRoute("/features/")({
  head: () => ({
    meta: [
      { title: "Features — REPs for Professionals" },
      {
        name: "description",
        content:
          "Every feature inside REPs — verified profiles, bookings, payments, CRM, programmes, check-ins, messaging and insights. Built for fitness pros.",
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
            Every tool a fitness practice needs.
            <br />
            <span className="text-reps-orange">In one place.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            REPs replaces six apps with one — verified directory, bookings, payments, CRM,
            programmes, check-ins, messaging and insights. Built for fitness pros.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/for-professionals"
              hash="pricing"
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

      {/* GROUPED FEATURES */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] space-y-20 px-6 py-20 lg:px-10">
          {FEATURE_GROUPS.map((g) => (
            <FeatureGroup key={g.key} groupKey={g.key} label={g.label} desc={g.desc} />
          ))}
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
                to="/for-professionals"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                For Professionals
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function FeatureGroup({
  groupKey,
  label,
  desc,
}: {
  groupKey: FeatureGroupKey;
  label: string;
  desc: string;
}) {
  const items = FEATURES.filter((f) => f.group === groupKey);
  return (
    <div>
      <div className="max-w-[620px]">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
          {label}
        </span>
        <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
          {desc}
        </h2>
      </div>
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
