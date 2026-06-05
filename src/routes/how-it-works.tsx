import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  Filter,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import heroTrainer from "@/assets/hero-trainer.jpg";
import proJames from "@/assets/pro-james.jpg";
import proSophie from "@/assets/pro-sophie.jpg";
import proLaura from "@/assets/pro-laura.jpg";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How REPs works — Find, enquire, train" },
      {
        name: "description",
        content:
          "Find a verified exercise professional, enquire in minutes and start training. Here's how REPs works for clients.",
      },
      { property: "og:title", content: "How REPs works" },
      {
        property: "og:description",
        content: "Find, enquire, train — the simple way to work with a verified REPs professional.",
      },
      { property: "og:url", content: "/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const JOURNEY = [
  {
    n: "01",
    tag: "Find",
    icon: Search,
    title: "Search the verified register",
    body:
      "Browse 25,000+ REPs-verified professionals by speciality, location or goal. Every profile shows qualifications, insurance and real client reviews — checked by our team.",
    bullets: ["Filter by discipline, price and availability", "See verified credentials at a glance", "Compare reviews from real clients"],
    cta: { to: "/find-a-professional", label: "Find a professional" },
  },
  {
    n: "02",
    tag: "Enquire",
    icon: MessageSquare,
    title: "Send a quick enquiry",
    body:
      "Share your goals, schedule and any considerations in a short form. Your chosen pro typically replies within a few hours with the right next step — a call, consult or first session.",
    bullets: ["No account needed to enquire", "Direct message with the professional", "Free until you book a session"],
    cta: { to: "/find-a-professional", label: "Browse and enquire" },
  },
  {
    n: "03",
    tag: "Train",
    icon: Target,
    title: "Start training with confidence",
    body:
      "Book sessions, pay securely and track progress in one place. Programmes, check-ins and nutrition all live in your client portal — so the focus stays on your goals.",
    bullets: ["Secure payments and clear receipts", "Programme, check-ins and messaging in one app", "Cancel or change pros any time"],
    cta: { to: "/signup", label: "Create a client account" },
  },
];

const TRUST = [
  { icon: BadgeCheck, title: "Verified credentials", body: "Every pro's qualifications, insurance and ID are checked before they appear in search." },
  { icon: ShieldCheck, title: "Safeguarding standards", body: "REPs members sign and uphold our code of conduct — with a clear complaints process." },
  { icon: Star, title: "Real reviews only", body: "Reviews come from clients with verified bookings. No anonymous ratings, no fakes." },
];

const FAQS = [
  {
    q: "Is it free to use REPs as a client?",
    a: "Yes. Searching, viewing profiles and enquiring is completely free. You only pay for the sessions you book with a professional.",
  },
  {
    q: "How quickly will a professional reply?",
    a: "Most pros respond within a few hours during working days. You'll get an email and an in-app notification as soon as they do.",
  },
  {
    q: "What if it's not the right match?",
    a: "No problem — enquire with a few pros, or switch any time. There's no commitment until you book your first session.",
  },
  {
    q: "How are professionals verified?",
    a: "Our team manually checks qualifications, insurance and ID before activating a profile. Look for the orange verified badge.",
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <img src={heroTrainer} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-reps-ink/80 via-reps-ink/90 to-reps-ink" />
        <div className="relative mx-auto max-w-[1320px] px-6 py-24 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel px-3 py-1 text-[12px] font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-reps-orange" /> How it works
          </span>
          <h1 className="mt-5 max-w-[820px] font-display text-[44px] font-bold leading-tight text-white lg:text-[60px]">
            Find. Enquire. <span className="text-reps-orange">Train.</span>
          </h1>
          <p className="mt-5 max-w-[620px] text-[16px] leading-relaxed text-white/70">
            Working with a verified professional shouldn't be complicated. Here's exactly how REPs helps you go from
            scrolling to your first session — usually within a week.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/find-a-professional"
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
            >
              Find a professional <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/for-professionals"
              className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
            >
              I'm a professional
            </Link>
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">The client journey</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              Three steps from goal to first session.
            </h2>
          </div>

          <div className="mt-10 space-y-6">
            {JOURNEY.map((step, i) => (
              <div
                key={step.n}
                className="grid gap-8 rounded-[22px] border border-reps-border bg-reps-panel p-8 lg:grid-cols-[1fr_1.4fr] lg:p-10"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[40px] font-bold text-reps-orange">{step.n}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-reps-orange-soft px-3 py-1 text-[12px] font-semibold text-reps-orange">
                      <step.icon className="h-3.5 w-3.5" /> {step.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[24px] font-bold leading-tight text-white lg:text-[28px]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/65">{step.body}</p>
                  <Link
                    to={step.cta.to}
                    className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
                  >
                    {step.cta.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-[18px] border border-reps-border bg-reps-ink p-6">
                  <ul className="space-y-3">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-[14px] text-white/80">
                        <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-[8px] bg-reps-orange-soft text-reps-orange">
                          <BadgeCheck className="h-3.5 w-3.5" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Small contextual visual per step */}
                  <div className="mt-6 rounded-[16px] border border-reps-border bg-reps-panel p-5">
                    {i === 0 && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <Filter className="h-4 w-4 text-reps-orange" />
                        <span className="text-white/65">Strength · London · £40–£60</span>
                        <span className="ml-auto rounded-full bg-reps-orange-soft px-2 py-1 text-[11px] font-semibold text-reps-orange">
                          412 matches
                        </span>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="flex items-center gap-3">
                        <img src={proJames} alt="" className="h-10 w-10 rounded-full object-cover" />
                        <div className="flex-1 text-[13px]">
                          <div className="font-semibold text-white">James replied</div>
                          <div className="text-white/55">Usually replies in ~2 hours</div>
                        </div>
                        <MessageSquare className="h-4 w-4 text-reps-orange" />
                      </div>
                    )}
                    {i === 2 && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <CalendarCheck className="h-4 w-4 text-reps-orange" />
                        <span className="text-white/80">First session booked</span>
                        <span className="ml-auto inline-flex items-center gap-1 text-white/55">
                          <CreditCard className="h-3.5 w-3.5" /> Paid securely
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-reps-border bg-reps-panel/30">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="max-w-[720px]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">Why REPs</span>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[40px]">
              The trust layer for the fitness industry since 2009.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.title} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <t.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-[17px] font-bold text-white">{t.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{t.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {[proJames, proSophie, proLaura].map((src, i) => (
              <img key={i} src={src} alt="" className="h-14 w-14 rounded-full border border-reps-border object-cover" />
            ))}
            <div className="flex items-center text-[13px] text-white/55">
              Join thousands of clients training with verified pros every week.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-reps-border">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-6 py-20 lg:grid-cols-[1fr_1.4fr] lg:px-10">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">FAQs</span>
            <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[34px]">
              Quick answers before you start.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">
              Still curious? Our help centre covers everything from refunds to safeguarding.
            </p>
            <Link
              to="/help"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/25 px-5 text-[13px] font-semibold text-white hover:bg-white/10"
            >
              Visit help centre <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-[18px] border border-reps-border bg-reps-panel p-6">
                <h3 className="font-display text-[16px] font-bold text-white">{f.q}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-reps-border">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <div className="rounded-[22px] border border-reps-border bg-reps-panel p-10 text-center lg:p-14">
            <h2 className="font-display text-[32px] font-bold leading-tight text-white lg:text-[42px]">
              Ready to find your <span className="text-reps-orange">REPs pro?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-relaxed text-white/65">
              Free to search, free to enquire. You only pay when you book a session — with a professional you can trust.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                to="/find-a-professional"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                Find a professional <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/for-professionals"
                className="inline-flex h-12 items-center rounded-[10px] border border-white/25 px-6 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                I'm a professional
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
