import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PricingCompare } from "@/components/pricing/PricingCompare";
import { FoundingBanner } from "@/components/pricing/FoundingBanner";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare every REPs plan — Free, Verified, Pro, Business, Studio" },
      {
        name: "description",
        content:
          "Plan-by-plan comparison of every REPs tier — visibility, business operations, coaching delivery, REPs AI, growth and admin.",
      },
      { property: "og:title", content: "Compare REPs plans" },
      {
        property: "og:description",
        content: "Side-by-side comparison of every REPs plan. Find the right tier for your stage.",
      },
      { property: "og:url", content: "https://repsglobal.lovable.app/compare" },
    ],
    links: [{ rel: "canonical", href: "https://repsglobal.lovable.app/compare" }],
  }),
  component: ComparePage,
});

function ComparePage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[1240px] px-6 py-20 text-center lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Compare plans
          </span>
          <h1 className="mx-auto mt-5 max-w-[820px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Compare every REPs plan.
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            Side-by-side, every feature, every tier. Find the right plan for your stage —
            from free profile to multi-coach studio.
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
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/40">
        <FoundingBanner />
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <PricingCompare />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <h2 className="font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Ready to choose?
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/70">
              All plans start free. Upgrade when you're ready — founding pricing locked for life.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                See pricing <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                Create free profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
