import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Crown, Sparkles, Star } from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — REPs" },
      {
        name: "description",
        content:
          "Simple plans for exercise professionals. Start free, upgrade when you're ready to take bookings and get featured.",
      },
      { property: "og:title", content: "Pricing — REPs" },
      {
        property: "og:description",
        content: "Free to join. Pro and Elite plans unlock bookings, payments and featured placement.",
      },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    tier: "Foundation",
    price: "£0",
    period: "Free forever",
    desc: "Get on the register and be discoverable.",
    cta: "Create profile",
    featured: false,
    features: [
      "Verified REPs profile",
      "Public listing in search",
      "Up to 3 services",
      "Client reviews",
      "Basic profile analytics",
    ],
  },
  {
    tier: "Pro",
    price: "£14",
    period: "per month",
    desc: "Run your full practice on REPs.",
    cta: "Start 14-day trial",
    featured: true,
    features: [
      "Everything in Foundation",
      "Booking engine + calendar sync",
      "Stripe payments & invoices",
      "Unlimited services & class packs",
      "Client messaging inbox",
      "CPD tracking & certificates",
      "Priority verification",
    ],
  },
  {
    tier: "Elite",
    price: "£39",
    period: "per month",
    desc: "Get featured and scale your business.",
    cta: "Talk to sales",
    featured: false,
    features: [
      "Everything in Pro",
      "Featured placement in search",
      "AI session planner & quick replies",
      "Recurring memberships",
      "Custom branding on profile",
      "Dedicated account manager",
    ],
  },
];

const FAQ = [
  { q: "Is REPs really free to join?", a: "Yes. Foundation gives you a verified profile, public listing and reviews — forever. You only upgrade when you want bookings, payments or featured placement." },
  { q: "How does verification work?", a: "Upload your qualifications, insurance and any CPD. Our team reviews within 24 hours. You'll see a Verified badge on your profile once approved." },
  { q: "What does REPs take per booking?", a: "On Pro and Elite, REPs takes 15% of each booking made through the platform. Stripe fees are included." },
  { q: "Can I cancel anytime?", a: "Yes. Plans are monthly and you can downgrade or cancel from your dashboard at any time." },
  { q: "Do you support clients in my country?", a: "REPs operates globally with 25,000+ professionals across 120+ countries. Bookings and payments are supported in most major regions." },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> Pricing
          </span>
          <h1 className="mt-5 font-display text-[44px] font-bold leading-tight text-white lg:text-[56px]">
            Simple plans for serious professionals.
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] text-white/65">
            Start free. Upgrade when you're ready to take bookings, get paid and grow.
          </p>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.tier}
                className={
                  p.featured
                    ? "relative rounded-[22px] border-2 border-reps-orange bg-reps-panel p-8"
                    : "rounded-[22px] border border-reps-border bg-reps-panel p-8"
                }
              >
                {p.featured && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-reps-orange px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    <Star className="h-3 w-3 fill-white" /> Most popular
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {p.tier === "Elite" && <Crown className="h-4 w-4 text-reps-orange" />}
                  <h2 className="font-display text-[22px] font-bold text-white">{p.tier}</h2>
                </div>
                <p className="mt-1 text-[13px] text-white/55">{p.desc}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-[44px] font-bold text-white">{p.price}</span>
                  <span className="text-[13px] text-white/55">{p.period}</span>
                </div>

                <Link
                  to="/signup"
                  className={
                    p.featured
                      ? "mt-6 flex h-12 items-center justify-center rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                      : "mt-6 flex h-12 items-center justify-center rounded-[10px] border border-white/20 text-[14px] font-semibold text-white hover:bg-white/10"
                  }
                >
                  {p.cta}
                </Link>

                <ul className="mt-7 space-y-3 text-[13px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-white/75">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[18px] border border-reps-border bg-reps-panel p-6 text-center text-[13px] text-white/65">
            Clients always search REPs for free. Pricing applies to professionals only.
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[820px] px-6 py-20 lg:px-10">
          <h2 className="font-display text-[28px] font-bold text-white">Frequently asked</h2>
          <div className="mt-8 divide-y divide-reps-border overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group px-6 py-5 [&_summary]:list-none"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-semibold text-white">
                  {item.q}
                  <span className="text-reps-orange transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[13px] leading-relaxed text-white/65">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
