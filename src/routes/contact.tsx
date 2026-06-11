import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Compass,
  LifeBuoy,
  Mail,
  MessageSquare,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { MarketingHeroEyebrow } from "@/components/marketing/MarketingHeroEyebrow";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { MarketingFaq } from "@/components/marketing/MarketingFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusCard } from "@/components/contact/StatusCard";
import { ContactForm } from "@/components/contact/ContactForm";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact REPs — talk to a human" },
      {
        name: "description",
        content:
          "Send a message to REPs and reach the right team — clients, professionals, press and partnerships. Real humans, typical reply under 4 hours.",
      },
      { property: "og:title", content: "Contact REPs — talk to a human" },
      {
        property: "og:description",
        content:
          "One smart contact form that routes your message to the right team. Typical reply under 4 hours, Mon–Fri.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const QUICK_ANSWERS = [
  {
    icon: ShieldAlert,
    title: "How do I get verified?",
    body: "Three checks: ID, an Ofqual-regulated qualification, valid insurance. Average turnaround: 48 hours.",
    to: "/for-professionals",
    cta: "See how verification works",
  },
  {
    icon: Search,
    title: "How do I find a coach in my city?",
    body: "Search the register by city and specialism — filter by tier, format, and availability.",
    to: "/find-a-professional",
    cta: "Browse the register",
  },
  {
    icon: Compass,
    title: "Is this person really REPs-registered?",
    body: "Every active member has a public profile. If you can find them on the register, they're current.",
    to: "/find-a-professional",
    cta: "Check the register",
  },
] as const;

const CHANNELS = [
  {
    label: "Client support",
    email: "support@repsuk.org",
    scope: "Finding a pro, bookings and your account.",
  },
  {
    label: "Professional support",
    email: "pros@repsuk.org",
    scope: "Verification, payouts, profile and shop-front.",
  },
  {
    label: "Press, partnerships & enterprise",
    email: "press@repsuk.org",
    scope: "Media, partnerships, multi-coach and investor enquiries.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "How quickly will I hear back?",
    a: "Most messages get a reply the same working day. Verification and payout questions are usually answered in under two hours during working hours (Mon–Fri, 9–6 GMT).",
  },
  {
    q: "Can I phone REPs?",
    a: "We're a remote-first global team and don't run a phone line. Email keeps a written record for both of us and lets the right specialist answer — usually faster than a call.",
  },
  {
    q: "I'm a coach — where do I report a profile issue?",
    a: "Use the form above and pick \"I'm a professional\" → \"Profile / shop-front\". If you can, include your REPs profile URL so we can look you up directly.",
  },
  {
    q: "I'm a client — how do I report a coach?",
    a: "If it's a safeguarding concern, use the dedicated safeguarding route below — it goes straight to our safeguarding lead. For anything else (a no-show, a refund question), use the form above.",
  },
  {
    q: "Where are you based?",
    a: "REPs is a global register with a remote-first team. We don't operate a public office — every message goes to a real person, not a reception desk.",
  },
];

function ContactPage() {
  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_70%_at_20%_0%,rgba(255,122,0,0.10),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-reps-ink lg:h-56"
        />
        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-6 pt-24 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-16 lg:px-10 lg:pt-28 lg:pb-24">
          <div className="max-w-[640px]">
            <MarketingHeroEyebrow
              icon={MessageSquare}
              style={{ animationDuration: "560ms", animationFillMode: "both" }}
            >
              Contact
            </MarketingHeroEyebrow>

            <h1
              className="mt-6 animate-fade-in font-display text-[40px] font-bold leading-[1.05] text-white sm:text-[52px] lg:text-[64px]"
              style={{
                animationDuration: "640ms",
                animationDelay: "80ms",
                animationFillMode: "both",
              }}
            >
              Talk to a{" "}
              <span className="text-reps-orange">human.</span>
            </h1>

            <p
              className="mt-6 max-w-[560px] animate-fade-in text-[16px] leading-relaxed text-white/80"
              style={{
                animationDuration: "640ms",
                animationDelay: "180ms",
                animationFillMode: "both",
              }}
            >
              Most messages get a reply the same working day. Pick what fits below —
              we'll route it to the person who actually owns it.
            </p>

            <div
              className="mt-8 flex animate-fade-in flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-white/55"
              style={{
                animationDuration: "640ms",
                animationDelay: "260ms",
                animationFillMode: "both",
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="size-3.5 text-reps-orange" /> Named humans, not a ticket bot
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="size-3.5 text-reps-orange" /> Routed to the right team
              </span>
            </div>
          </div>

          <div
            className="animate-fade-in"
            style={{
              animationDuration: "640ms",
              animationDelay: "340ms",
              animationFillMode: "both",
            }}
          >
            <StatusCard />
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Send a message"
            heading="One form. Three audiences. Routed properly."
            lede="Pick the tab that fits and we'll show only the fields that matter. The estimated reply time below updates as you choose a reason."
            align="center"
            className="mx-auto text-center"
          />
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Quick answers */}
      <section>
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Quick answers"
            heading="Most people are asking…"
            lede="If your question lives here, you'll get an answer in under a minute — no waiting on a reply."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {QUICK_ANSWERS.map((q) => (
              <Link
                key={q.title}
                to={q.to}
                className="group flex flex-col rounded-[16px] border border-reps-border bg-reps-panel/40 p-6 transition-colors hover:border-reps-orange/60"
              >
                <span className="flex size-10 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <q.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-[18px] font-bold text-white">
                  {q.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                  {q.body}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange">
                  {q.cta}{" "}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Direct channels */}
      <section className="bg-reps-panel/30">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <SectionHeader
            eyebrow="Prefer email?"
            heading="Reach the right inbox directly."
            lede="No phone line, no offices to visit. Email keeps a written record and goes straight to the team that owns it."
          />
          <ul className="mt-10 flex flex-col divide-y divide-reps-border overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/50">
            {CHANNELS.map((c) => (
              <li
                key={c.email}
                className="grid gap-2 px-6 py-5 sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                  {c.label}
                </span>
                <span className="text-[14px] text-white/75">{c.scope}</span>
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-reps-orange hover:text-reps-orange-hover"
                >
                  <Mail className="size-4" /> {c.email}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] text-white/55">
            REPs is a remote-first global team. We don't run a phone line or a public office —
            every message is read by a named person.
          </p>
        </div>
      </section>

      {/* Safeguarding callout */}
      <section>
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <Alert className="flex flex-col gap-4 rounded-[18px] border-emerald-400/30 bg-emerald-500/10 p-6 text-emerald-100 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-emerald-400/30 bg-emerald-500/15">
                <ShieldAlert className="size-5 text-emerald-300" />
              </span>
              <div>
                <AlertTitle className="font-display text-[18px] font-bold text-white">
                  Safeguarding concern? Use the dedicated route.
                </AlertTitle>
                <AlertDescription className="mt-1 text-[14px] text-white/75">
                  If you have a safeguarding concern about a coach or client, please don't use the
                  general form — it goes straight to our safeguarding lead.
                </AlertDescription>
              </div>
            </div>
            <a
              href="/complaints"
              className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-[10px] border border-emerald-400/40 bg-emerald-500/15 px-5 text-[13.5px] font-semibold text-emerald-100 hover:bg-emerald-500/25 sm:self-auto"
            >
              <LifeBuoy className="size-4" /> Open safeguarding route
            </a>
          </Alert>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
          <MarketingFaq
            eyebrow="FAQ"
            heading="Before you write…"
            items={FAQ_ITEMS}
          />
        </div>
      </section>

      <FinalCta
        eyebrow={null}
        heading="Prefer to browse first?"
        lede="The register and pricing pages answer most questions before you even need to send a message."
        primary={{ to: "/find-a-professional", label: "Find a coach" }}
        secondary={{ to: "/pricing", label: "See pricing" }}
      />

      <PublicFooter />
    </div>
  );
}
