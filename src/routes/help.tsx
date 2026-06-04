import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CreditCard,
  HelpCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  Wallet,
} from "lucide-react";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help centre — REPs" },
      { name: "description", content: "Search the REPs help centre for guides on bookings, billing, verification, profiles and more." },
      { property: "og:title", content: "Help centre — REPs" },
      { property: "og:description", content: "Guides and answers for REPs professionals and clients." },
    ],
  }),
  component: HelpPage,
});

const CATEGORIES = [
  { icon: Sparkles, name: "Getting started", count: 14, desc: "Account setup, first booking, profile basics." },
  { icon: ShieldCheck, name: "Verification", count: 11, desc: "Credentials, DBS, insurance and badges." },
  { icon: UserCircle2, name: "Your profile", count: 18, desc: "Editing, photos, services, specialisms." },
  { icon: CreditCard, name: "Bookings", count: 22, desc: "Calendar, scheduling, cancellations." },
  { icon: Wallet, name: "Billing & payouts", count: 16, desc: "Stripe payouts, invoices, subscriptions." },
  { icon: BookOpen, name: "Education & CPD", count: 9, desc: "Logging CPD, courses, evidence." },
];

const POPULAR = [
  "How do I upload my REPs verification documents?",
  "Why hasn't my Stripe payout arrived?",
  "Setting up your booking calendar and availability",
  "How clients leave reviews and how to respond",
  "Upgrading from Foundation to Pro tier",
  "Adding a new service and price to your profile",
];

function HelpPage() {
  return (
    <div className="min-h-screen bg-reps-warm-white text-reps-charcoal">
      <div className="bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />
        <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-12 text-center lg:px-10">
          <span className="inline-flex items-center rounded-full bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-orange">
            <HelpCircle className="mr-1.5 h-3 w-3" /> Help centre
          </span>
          <h1 className="mt-5 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-white lg:text-[52px]">
            How can we help?
          </h1>
          <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-relaxed text-white/70">
            Search 90+ guides, or browse by topic. For account-specific issues, our team responds
            within 4 hours on weekdays.
          </p>

          <div className="mx-auto mt-8 flex h-14 max-w-[640px] items-center gap-3 rounded-[12px] border border-reps-border bg-reps-panel px-4 text-left">
            <Search className="h-5 w-5 text-white/55" />
            <input
              type="search"
              placeholder="Search for 'verification', 'payout', 'cancellation'…"
              className="h-full w-full bg-transparent text-[14px] text-white placeholder:text-white/45 focus:outline-none"
            />
            <button className="inline-flex h-10 items-center rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
        <h2 className="font-display text-[24px] font-bold text-reps-charcoal">Browse by topic</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              className="group flex items-start gap-4 rounded-[18px] border border-reps-stone bg-white p-5 text-left transition-colors hover:border-reps-orange"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[15px] font-semibold text-reps-charcoal">{c.name}</h3>
                  <span className="text-[11px] font-semibold text-reps-muted-light">{c.count}</span>
                </div>
                <p className="mt-1 text-[13px] text-reps-charcoal/70">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[18px] border border-reps-stone bg-white p-6">
            <h2 className="font-display text-[18px] font-bold text-reps-charcoal">Popular articles</h2>
            <ul className="mt-4 divide-y divide-reps-stone">
              {POPULAR.map((p) => (
                <li key={p}>
                  <a href="#" className="flex items-center justify-between gap-4 py-3 text-[14px] text-reps-charcoal hover:text-reps-orange">
                    <span>{p}</span>
                    <span aria-hidden className="text-reps-muted-light">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[22px] bg-reps-ink p-6 text-white">
            <h2 className="font-display text-[18px] font-bold text-white">Still need help?</h2>
            <p className="mt-2 text-[13px] text-white/70">
              Our support team typically replies within 4 hours on weekdays. Verified professionals
              get priority routing.
            </p>
            <div className="mt-5 space-y-3">
              <Link
                to="/contact"
                className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
              >
                Contact support
              </Link>
              <Link
                to="/faq"
                className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-white/20 text-[13px] font-semibold text-white shadow-none hover:bg-white/10"
              >
                Browse FAQs
              </Link>
            </div>
          </section>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
