import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  CreditCard,
  GraduationCap,
  LineChart,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroTrainer from "@/assets/hero-trainer.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";

export const Route = createFileRoute("/for-professionals")({
  head: () => ({
    meta: [
      { title: "For Professionals — Grow your practice on REPs" },
      {
        name: "description",
        content:
          "Join 25,000+ verified exercise professionals. Get discovered, take bookings and run your practice on REPs.",
      },
      { property: "og:title", content: "For Professionals — REPs" },
      {
        property: "og:description",
        content: "Get discovered, take bookings and grow your practice on REPs.",
      },
      { property: "og:url", content: "/for-professionals" },
    ],
    links: [{ rel: "canonical", href: "/for-professionals" }],
  }),
  component: ForProsPage,
});

const FEATURES = [
  { icon: BadgeCheck, title: "Verified profile that ranks", body: "Your qualifications, insurance and reviews are checked once — and surface forever in search." },
  { icon: Calendar, title: "Built-in booking engine", body: "Sync availability, manage sessions and reduce no-shows with reminders and deposits." },
  { icon: CreditCard, title: "Payments without admin", body: "Stripe-powered payouts, invoices and recurring memberships in one place." },
  { icon: MessageSquare, title: "Client messaging", body: "A focused inbox for client conversations, with AI quick replies when you're slammed." },
  { icon: LineChart, title: "Insights that grow you", body: "See bookings, retention and revenue — and the next move to make this month." },
  { icon: GraduationCap, title: "CPD on rails", body: "Log CPD points, upload certificates and stay current — REPs handles the paperwork." },
];

const STEPS = [
  { n: "01", t: "Create your profile", body: "Tell us about your specialisms, services and rates. Takes about 8 minutes." },
  { n: "02", t: "Get verified", body: "Upload qualifications, insurance and any CPD. Our team reviews within 24 hours." },
  { n: "03", t: "Open for bookings", body: "Connect Stripe, switch on your calendar, and start getting matched with clients." },
];

const TESTIMONIAL = {
  img: proJames,
  quote:
    "Within two months of joining REPs I was fully booked. The verification matters — clients arrive ready to commit because they already trust the badge.",
  name: "James Carter",
  role: "Level 4 PT · London",
};

const ROSTER = [
  { img: proSophie, name: "Sophie Reid", role: "Pilates Instructor" },
  { img: proLaura, name: "Laura Bennett", role: "Nutritionist" },
];

function ForProsPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      <section className="relative overflow-hidden border-b border-reps-border">
        <img
          src={heroTrainer}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto grid max-w-[1240px] gap-12 px-6 py-24 lg:grid-cols-[1.3fr_1fr] lg:px-10 lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> For professionals
            </span>
            <h1 className="mt-5 font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
              Grow a fitness practice
              <br />
              <span className="text-reps-orange">clients actually trust.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/70">
              REPs is where verified personal trainers, coaches and instructors get discovered, take bookings and
              run their business — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Join REPs <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-[12px] text-white/55">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-reps-orange" /> 25,000+ verified pros
              </span>
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-reps-orange" /> 4.8★ avg. client rating
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-reps-orange" /> Verified register since 2009
              </span>
            </div>
          </div>

          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Earnings calculator
            </div>
            <h3 className="mt-2 font-display text-[20px] font-bold text-white">
              What a Pro plan can return
            </h3>
            <div className="mt-4 space-y-3 text-[13px]">
              {[
                ["Sessions / week", "12"],
                ["Avg. price", "£45"],
                ["Retention", "84%"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-[12px] border border-reps-border bg-reps-ink px-4 py-3"
                >
                  <span className="text-white/65">{k}</span>
                  <span className="font-semibold text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[16px] border border-reps-orange/40 bg-reps-orange-soft p-5">
              <div className="text-[12px] text-white/70">Projected monthly revenue</div>
              <div className="mt-1 font-display text-[34px] font-bold text-reps-orange">£2,160</div>
              <div className="text-[11px] text-white/60">After 15% platform take</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
              Everything you need
            </span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              One platform for the entire client journey.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1240px] px-6 py-20 lg:px-10">
          <h2 className="font-display text-[28px] font-bold text-white">Get started in 3 steps</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-[18px] border border-reps-border bg-reps-panel p-6"
              >
                <span className="font-display text-[28px] font-bold text-reps-orange">{s.n}</span>
                <h3 className="mt-2 font-display text-[17px] font-bold text-white">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-reps-border">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-20 lg:grid-cols-[1.4fr_1fr] lg:px-10">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8">
            <Star className="h-6 w-6 fill-reps-orange text-reps-orange" />
            <p className="mt-4 font-display text-[22px] leading-snug text-white">
              "{TESTIMONIAL.quote}"
            </p>
            <div className="mt-6 flex items-center gap-3">
              <img
                src={TESTIMONIAL.img}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-white">{TESTIMONIAL.name}</div>
                <div className="text-[12px] text-white/55">{TESTIMONIAL.role}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {ROSTER.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-3 rounded-[18px] border border-reps-border bg-reps-panel p-4"
              >
                <img src={r.img} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="font-semibold text-white">{r.name}</div>
                  <div className="text-[12px] text-white/55">{r.role}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-reps-orange-soft px-2 py-1 text-[11px] font-semibold text-reps-orange">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              </div>
            ))}
            <Link
              to="/signup"
              className="flex items-center justify-center gap-1 rounded-[18px] border border-dashed border-reps-orange/50 bg-reps-orange-soft py-5 text-[14px] font-semibold text-reps-orange hover:bg-reps-orange-soft/80"
            >
              Join 25,000+ verified pros <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
