import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Rocket,
  User,
  MessageSquare,
  CreditCard,
  Scale,
  Wrench,
  Sparkles,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { HELP_CATEGORIES } from "@/content/help/categories";
import { getArticleSummaries } from "@/content/help/registry";
import { CommandPalette, HelpSearchTrigger } from "@/components/help/CommandPalette";

const CANONICAL = "https://repsuk.org/help";
const META_TITLE = "REPS Help Centre — Verification, profiles, reviews";
const META_DESC =
  "Everything you need to set up your REPS profile, get verified, and run your listing. Built for professionals on the Core tier.";

export const Route = createFileRoute("/help/")({
  head: () => ({
    meta: [
      { title: META_TITLE },
      { name: "description", content: META_DESC },
      { property: "og:title", content: META_TITLE },
      { property: "og:description", content: META_DESC },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: META_TITLE },
      { name: "twitter:description", content: META_DESC },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How long does REPS verification take?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Most identity checks pass in under five minutes. Qualifications and insurance are typically reviewed within one working day.",
              },
            },
            {
              "@type": "Question",
              name: "Is the Core tier free?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Core is £34/year and includes a public profile, verified badge, enquiry inbox and review collection.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: HelpLandingPage,
});

const ICONS = {
  Rocket,
  ShieldCheck,
  User,
  MessageSquare,
  CreditCard,
  Scale,
  Wrench,
} as const;

function HelpLandingPage() {
  const [open, setOpen] = useState(false);
  const articles = getArticleSummaries();
  const popular = [
    "verification/how-verification-works",
    "verification/identity-check",
    "verification/qualifications",
    "verification/insurance",
    "getting-started/set-up-your-account",
    "public-profile/your-profile-photo",
  ]
    .map((id) => {
      const [c, s] = id.split("/");
      return articles.find((a) => a.category === c && a.slug === s);
    })
    .filter(Boolean) as ReturnType<typeof getArticleSummaries>;

  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,116,30,0.18),_transparent_60%)]" aria-hidden />
        <div className="relative mx-auto max-w-[1080px] px-6 pb-20 pt-24 text-center lg:px-10">
          <MarketingHeroEyebrow>Help Centre</MarketingHeroEyebrow>
          <h1 className="font-display mt-4 text-balance text-[40px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[56px]">
            How can we help?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/70">
            Plain-English guides for the Core tier — from your first upload to your hundredth
            client enquiry. Written by the team that runs REPS.
          </p>
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <HelpSearchTrigger onClick={() => setOpen(true)} />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1180px] px-6 py-20 lg:px-10">
        <h2 className="font-display text-[26px] font-semibold tracking-tight text-white">
          Browse by topic
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon as keyof typeof ICONS] ?? Sparkles;
            const count = articles.filter((a) => a.category === c.slug).length;
            return (
              <li key={c.slug}>
                <Link
                  to="/help/$category"
                  params={{ category: c.slug }}
                  className="group flex h-full flex-col rounded-[18px] border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-reps-orange/15 text-reps-orange">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                      {count} {count === 1 ? "article" : "articles"}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[20px] font-semibold text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                    {c.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-reps-orange">
                    Open
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Popular */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-[1180px] px-6 py-20 lg:px-10">
          <h2 className="font-display text-[26px] font-semibold tracking-tight text-white">
            Most read this week
          </h2>
          <ul className="mt-8 grid gap-3 lg:grid-cols-2">
            {popular.map((a) => (
              <li key={`${a.category}/${a.slug}`}>
                <Link
                  to="/help/$category/$slug"
                  params={{ category: a.category, slug: a.slug }}
                  className="group flex items-start justify-between gap-4 rounded-[16px] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="text-[15.5px] font-semibold text-white">{a.title}</p>
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-white/65">{a.summary}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-white/40 transition-colors group-hover:text-white" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Still need help */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[900px] px-6 py-20 text-center lg:px-10">
          <h2 className="font-display text-[28px] font-semibold tracking-tight text-white">
            Still stuck?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            We answer every support ticket from a real human, usually within a few hours during
            UK working time.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange/90"
            >
              Contact REPS support
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/standards"
              className="inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              Read the Standards
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />

      <CommandPalette open={open} onOpenChange={setOpen} />
    </div>
  );
}
