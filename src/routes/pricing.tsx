import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { FoundingBanner } from "@/components/pricing/FoundingBanner";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { PricingCompare } from "@/components/pricing/PricingCompare";
import { FounderAccessBanner } from "@/components/marketing/FounderAccessBanner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Verified, Pro, Studio · REPs" },
      {
        name: "description",
        content:
          "Verified £99/yr. Founding Pro from £49/mo with a 30-day free trial. Studio £149/mo. Every feature in your tier is included — no add-on stack.",
      },
      { property: "og:title", content: "REPs pricing" },
      {
        property: "og:description",
        content: "Verified to be trusted. Pro to run your practice. Studio to scale your team.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/pricing" }],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="border-b border-reps-border bg-reps-panel/40">
        <FoundingBanner />
      </section>

      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-16 text-center lg:px-10 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Pricing
          </span>
          <h1 className="mx-auto mt-5 max-w-[820px] font-display text-[40px] font-bold leading-tight text-white lg:text-[56px]">
            Verified to be trusted.
            <br />
            <span className="text-reps-orange">Pro to run your practice. Studio to scale.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-relaxed text-white/70">
            REPs isn't another coaching app. It's a public register, a trust layer and an
            AI operating system — priced as a clear 3-tier ladder. Pick the tier that fits,
            and every feature in that tier is included.
          </p>
        </div>
      </section>

      <FounderAccessBanner />

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <PricingPlans />
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/20">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-[760px] text-center">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Plan-by-plan
            </span>
            <h2 className="mt-2 font-display text-[28px] font-bold text-white lg:text-[36px]">
              Every feature, every REPs tier.
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/65">
              Visibility, operations, coaching, REPs AI, growth and admin — side by side
              across Verified, Pro and Studio.
            </p>
          </div>
          <div className="mt-10">
            <PricingCompare />
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[820px] px-6 py-20 lg:px-10">
          <PricingFAQ />
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-14 text-center lg:px-10">
          <h2 className="font-display text-[24px] font-bold text-white">
            Looking at other coaching platforms?
          </h2>
          <p className="mx-auto mt-2 max-w-[560px] text-[14px] text-white/65">
            See how REPs compares to Trainerize, MyPTHub and PT Distinction — feature by
            feature.
          </p>
          <Link
            to="/compare"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
          >
            Compare REPs with other platforms <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <h2 className="font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Join 25,000+ verified pros.
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
              Founder pricing is available during beta and remains active while your subscription
              stays active. Some advanced Pro features are released in stages — follow them on
              the <Link to="/roadmap" className="font-semibold text-reps-orange hover:underline">roadmap</Link> and{" "}
              <Link to="/changelog" className="font-semibold text-reps-orange hover:underline">changelog</Link>.
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
                For Professionals overview
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
