import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, ShieldCheck, Brain, Layers, MapPin } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompetitorCompare } from "@/components/marketing/CompetitorCompare";
import { COMPETITOR_LIST } from "@/data/competitor-data";

const URL = "https://repsglobal.lovable.app/compare";
const TITLE = "Personal Trainer Software — REPs vs Trainerize, MyPTHub & PT Distinction";
const DESC =
  "Compare REPs Pro (£59/mo founding) with Trainerize, MyPTHub and PT Distinction. Personal trainer software with the verified public register, CRM, bookings, payments, programmes, nutrition and AI all included — no paid add-on stack.";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ComparePage,
});

const DIFFERENTIATORS = [
  {
    icon: MapPin,
    title: "A public register, not just an app",
    body: "REPs is the verified directory the public already searches. Trainerize, MyPTHub and PT Distinction are private software — they don't bring you clients.",
  },
  {
    icon: ShieldCheck,
    title: "Verification built in",
    body: "Qualifications, insurance and DBS checked once and shown on every profile. Trust without screenshots in your DMs.",
  },
  {
    icon: Brain,
    title: "AI as the operating system",
    body: "Programmes drafted, check-ins summarised, leads scored, risks flagged, next moves ranked. Not a chatbot bolted on — it runs through the whole platform.",
  },
  {
    icon: Layers,
    title: "All-in-one, not a stack of six",
    body: "Discovery, booking, payments, messaging, programmes, nutrition and AI in one record. Replace Trainerize + Calendly + Stripe + Mailchimp + Canva + ChatGPT.",
  },
];

const HEAD_TO_HEAD_CARDS = [
  {
    href: "/compare/reps-vs-trainerize" as const,
    competitor: COMPETITOR_LIST[0],
    headline: "Trainerize charges extra for payments, nutrition and branded app. REPs doesn't.",
  },
  {
    href: "/compare/reps-vs-mypthub" as const,
    competitor: COMPETITOR_LIST[1],
    headline: "MyPTHub's AI, branded app and Zapier are all paid add-ons. REPs includes everything.",
  },
  {
    href: "/compare/reps-vs-pt-distinction" as const,
    competitor: COMPETITOR_LIST[2],
    headline: "PT Distinction charges per extra client. REPs doesn't.",
  },
];

function ComparePage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,122,0,0.10),transparent)]" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-20 text-center lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Personal trainer software
          </span>
          <h1 className="mx-auto mt-5 max-w-[860px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Compare personal trainer software.
          </h1>
          <p className="mx-auto mt-5 max-w-[680px] text-[16px] leading-relaxed text-white/70">
            Trainerize, MyPTHub and PT Distinction are coaching software you bring
            your own clients to — then top up with paid add-ons. REPs Pro is
            £59/mo founding (was £79/mo) and includes the full software platform
            on the verified public register — no paid add-on stack, no per-client
            charges.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Join REPs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              See REPs plans
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <CompetitorCompare />
        </div>
      </section>

      {/* Head-to-head cards — links into each /compare/reps-vs-* page */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Head-to-head
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Deep-dive comparisons.
            </h2>
            <p className="mt-3 text-[15px] text-white/65">
              Side-by-side pricing, the real cost once add-ons are stacked, and
              feature parity row by row.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {HEAD_TO_HEAD_CARDS.map(({ href, competitor, headline }) => (
              <Link
                key={competitor.slug}
                to={href}
                className="group flex flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6 transition hover:border-reps-orange/40 hover:bg-reps-panel-soft"
              >
                <div className="flex h-7 items-center">
                  <img
                    src={competitor.logo}
                    alt={competitor.name}
                    style={{ height: competitor.logoHeight }}
                    className="w-auto opacity-90"
                  />
                </div>
                <div className="mt-4 font-display text-[20px] font-bold text-white">
                  REPs vs {competitor.name}
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">
                  {headline}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-reps-orange">
                  Read comparison
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[760px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Where REPs is different
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Not another coaching app.
            </h2>
            <p className="mt-3 text-[15px] text-white/65">
              Other platforms compete on features. REPs is a different category — built
              around the public register, not the workout builder.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {DIFFERENTIATORS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange/15 text-reps-orange">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-[18px] font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/65">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="rounded-[24px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <h2 className="font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
              Ready to switch?
            </h2>
            <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-white/70">
              Start free, get verified, and run your whole practice on REPs. Founding
              pricing on paid plans stays active while your subscription stays active — before public launch.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                See REPs plans <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-7 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                Join REPs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
